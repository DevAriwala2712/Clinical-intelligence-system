-- ============================================================================
-- schema.sql
-- MySQL schema for the Clinician-Calibrated Rehabilitation system (server side)
--
-- Design principle (matches the SQLite copy on the patient's phone):
--   users -> patients / clinicians
--   patients -> rehabilitation_programs -> program_exercises -> rehab_sessions
--   rehab_sessions -> session_repetitions -> repetition_metrics / repetition_phases / repetition_errors
--   rehab_sessions -> landmark_points (for the clinician to inspect evidence)
--   rehabilitation_programs -> progression_suggestions -> clinician_reviews
--
-- Medications/labs hang off patient_id as OPTIONAL clinician-visible context only.
-- They are never read by the movement-quality or progression logic.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS rehab_system CHARACTER SET utf8mb4;
USE rehab_system;

-- ===================== AUTH / USERS =====================

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'clinician') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_profiles (
  user_id INT PRIMARY KEY,
  age INT,
  sex ENUM('male', 'female', 'other'),
  height_cm DECIMAL(5,1),
  clinician_id INT NULL, -- the assigned treating clinician (nullable until assigned)
  rehab_goal TEXT NULL,            -- patient's rehabilitation goal, in their own words
  injury_history TEXT NULL,        -- brief injury / surgery history (free text, clinician-visible)
  video_upload_consent BOOLEAN NOT NULL DEFAULT FALSE, -- raw video upload is OFF unless the patient opts in
  video_consent_updated_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE clinician_profiles (
  user_id INT PRIMARY KEY,
  license_identifier VARCHAR(120),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================== EXERCISE CATALOG (clinician-authored, shared) =====================

CREATE TABLE rehabilitation_pathways (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT
);

CREATE TABLE exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  engine_key VARCHAR(40) NULL UNIQUE, -- which on-device movement spec analyses this exercise; NULL = not supported by the engine
  description TEXT,
  instructions TEXT,               -- shown to patient before recording
  camera_view VARCHAR(50) NOT NULL, -- e.g. 'side', 'front'
  required_landmarks TEXT NOT NULL, -- comma-separated, e.g. 'hip,knee,ankle'
  phases TEXT NOT NULL              -- comma-separated ordered phase names
);

-- Configurable per-exercise clinician criteria (Section 14/35 of spec).
-- One exercise can have multiple named criteria rows: 'target_rom', 'target_tempo_sec', etc.
CREATE TABLE exercise_criteria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT NOT NULL,
  metric_name VARCHAR(60) NOT NULL,   -- 'rom_deg', 'tempo_sec', 'symmetry_deg', 'confidence_min'
  target_value DECIMAL(6,2),
  minimum_value DECIMAL(6,2),
  maximum_value DECIMAL(6,2),
  unit VARCHAR(20),
  weight DECIMAL(4,2) DEFAULT 0,      -- contribution to overall quality score (0-1)
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE pathway_exercises (
  pathway_id INT NOT NULL,
  exercise_id INT NOT NULL,
  PRIMARY KEY (pathway_id, exercise_id),
  FOREIGN KEY (pathway_id) REFERENCES rehabilitation_pathways(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- ===================== PATIENT-SPECIFIC PROGRAM =====================

CREATE TABLE rehabilitation_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  clinician_id INT NOT NULL,
  pathway_id INT NOT NULL,
  status ENUM('active', 'completed', 'paused', 'discontinued') NOT NULL DEFAULT 'active',
  sessions_per_week INT NOT NULL DEFAULT 3, -- prescribed frequency, used for adherence
  start_date DATE NOT NULL,
  end_date DATE NULL,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pathway_id) REFERENCES rehabilitation_pathways(id)
);

CREATE TABLE program_exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  exercise_id INT NOT NULL,
  `sets` INT NOT NULL DEFAULT 3,
  repetitions INT NOT NULL DEFAULT 10,
  order_number INT NOT NULL DEFAULT 1,
  FOREIGN KEY (program_id) REFERENCES rehabilitation_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Clinician-approved, patient-specific overrides of the catalog criteria
-- (personalisation: the same exercise can have a different ROM target for
-- a patient at week 2 post-op than for one at week 10). A row here replaces
-- the exercise_criteria row with the same metric_name for this assignment.
CREATE TABLE program_exercise_criteria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_exercise_id INT NOT NULL,
  metric_name VARCHAR(60) NOT NULL,
  target_value DECIMAL(6,2),
  minimum_value DECIMAL(6,2),
  maximum_value DECIMAL(6,2),
  UNIQUE KEY uq_pe_metric (program_exercise_id, metric_name),
  FOREIGN KEY (program_exercise_id) REFERENCES program_exercises(id) ON DELETE CASCADE
);

CREATE TABLE patient_baselines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  exercise_id INT NOT NULL,
  baseline_rom DECIMAL(6,2),
  baseline_quality DECIMAL(5,2),
  baseline_symmetry DECIMAL(6,2),
  baseline_tempo_sec DECIMAL(6,2),
  pain_rating INT,
  difficulty_rating INT,
  clinician_notes TEXT,
  baseline_date DATE NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ===================== SESSIONS (the evidence) =====================

CREATE TABLE rehab_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_exercise_id INT NOT NULL,
  client_session_uuid VARCHAR(64) NULL UNIQUE, -- generated on the phone; makes re-sync idempotent
  session_date DATETIME NOT NULL,
  duration_sec INT NULL,
  -- Assessment outcome. Only VALID and PARTIAL carry measurements/scores.
  --   VALID           assessed successfully
  --   PARTIAL         reliable, but some metrics could not be assessed (listed in unassessed_metrics)
  --   LOW_CONFIDENCE  landmarks/tracking too unreliable -> abstained
  --   INVALID         recording unusable (person out of frame, wrong camera angle, ...) -> abstained
  --   UNSUPPORTED     movement not recognised as the assigned exercise -> abstained
  --   INCOMPLETE      no complete repetition was captured -> abstained
  --   ABSTAINED       legacy generic abstention
  status ENUM('VALID', 'PARTIAL', 'LOW_CONFIDENCE', 'INVALID', 'UNSUPPORTED', 'INCOMPLETE', 'ABSTAINED') NOT NULL,
  abstain_reason VARCHAR(255) NULL,   -- filled only when status != VALID/PARTIAL
  confidence DECIMAL(4,3),            -- 0.000 - 1.000
  sets_completed INT NULL,
  reps_completed INT NULL,
  pain INT,                           -- 0-10
  discomfort INT,                     -- 0-10
  difficulty INT,                     -- 1-10
  injury_note TEXT,
  overall_score DECIMAL(5,2) NULL,    -- NULL unless status is VALID or PARTIAL
  analysis_method VARCHAR(20) NULL,   -- 'temporal' | 'threshold'
  capture_quality TEXT NULL,          -- JSON: camera-setup checks recorded before the set
  assessed_metrics VARCHAR(255) NULL, -- comma-separated
  unassessed_metrics VARCHAR(255) NULL,
  synced_at DATETIME NULL,
  FOREIGN KEY (program_exercise_id) REFERENCES program_exercises(id) ON DELETE CASCADE,
  INDEX idx_pe_date (program_exercise_id, session_date)
);

CREATE TABLE session_repetitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  repetition_number INT NOT NULL,
  start_ms BIGINT NULL,
  end_ms BIGINT NULL,
  angle_trace MEDIUMTEXT NULL, -- JSON [[timestampMs, angleDeg], ...] of the primary joint, downsampled
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE
);

CREATE TABLE repetition_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repetition_id INT NOT NULL,
  metric_name VARCHAR(60) NOT NULL,   -- 'rom_deg','tempo_sec','control_score','symmetry_deg','compensation_flag'
  value DECIMAL(8,2),
  expected_value DECIMAL(8,2),
  status VARCHAR(30),                 -- 'MET','BELOW_TARGET','ABOVE_TARGET','FLAGGED'
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id) ON DELETE CASCADE
);

-- Phase-level results for one repetition (e.g. 'lowering' took 1.2 s and
-- reached 95 deg). This is what lets the clinician see WHERE in the
-- movement an error happened, not just that the rep scored badly.
CREATE TABLE repetition_phases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repetition_id INT NOT NULL,
  phase_name VARCHAR(40) NOT NULL,
  start_ms BIGINT NOT NULL,
  end_ms BIGINT NOT NULL,
  min_angle DECIMAL(6,2) NULL,
  max_angle DECIMAL(6,2) NULL,
  status VARCHAR(30) NULL,            -- 'OK' | 'FLAGGED'
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id) ON DELETE CASCADE
);

-- Execution errors the AUTOMATED assessment flagged. Never edited: a
-- clinician's correction lives in clinician_reviews and the 'effective'
-- assessment is computed from both, so the original is always preserved.
CREATE TABLE repetition_errors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repetition_id INT NOT NULL,
  error_code VARCHAR(60) NOT NULL,    -- e.g. 'insufficient_rom', 'trunk_lean', 'too_fast', 'jerky_motion', 'asymmetry'
  phase_name VARCHAR(40) NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  detail VARCHAR(255) NULL,
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id) ON DELETE CASCADE
);

CREATE TABLE landmark_points (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  repetition_number INT,
  timestamp_ms BIGINT NOT NULL,
  landmark_name VARCHAR(40) NOT NULL,
  x DECIMAL(8,5) NOT NULL,
  y DECIMAL(8,5) NOT NULL,
  confidence DECIMAL(4,3) NOT NULL,
  phase VARCHAR(40),
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE,
  INDEX idx_session (session_id)
);

-- ===================== PROGRESSION WORKFLOW =====================

CREATE TABLE progression_suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  exercise_id INT NOT NULL,
  kind ENUM('PROGRESS', 'REVIEW_DETERIORATION', 'REVIEW_PLATEAU', 'REVIEW_PAIN') NOT NULL DEFAULT 'PROGRESS',
  source ENUM('system', 'patient_app') NOT NULL DEFAULT 'system',
  suggestion TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_json LONGTEXT NULL,          -- the longitudinal analysis snapshot that triggered this
  proposed_sets INT NULL,
  proposed_repetitions INT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'OBSERVE') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_note TEXT NULL,
  FOREIGN KEY (program_id) REFERENCES rehabilitation_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Every clinician review action is one row: who, when, what. The original
-- automated assessment is never overwritten (see repetition_errors).
CREATE TABLE clinician_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  clinician_id INT NOT NULL,
  action ENUM('NOTE', 'DISMISS_ERROR', 'CONFIRM_ERROR', 'ADD_ERROR', 'ADJUST_SCORE') NOT NULL DEFAULT 'NOTE',
  decision VARCHAR(60),         -- legacy free-text field, kept for compatibility
  correction TEXT,              -- legacy free-text field, kept for compatibility
  error_id INT NULL,            -- target of DISMISS_ERROR / CONFIRM_ERROR
  repetition_number INT NULL,   -- for ADD_ERROR
  error_code VARCHAR(60) NULL,  -- for ADD_ERROR
  adjusted_score DECIMAL(5,2) NULL, -- for ADJUST_SCORE
  notes TEXT,
  feedback_to_patient TEXT NULL,    -- the only review text the patient app shows
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id),
  FOREIGN KEY (error_id) REFERENCES repetition_errors(id) ON DELETE SET NULL
);

-- Optional raw video, stored ONLY if the patient explicitly consented.
CREATE TABLE session_videos (
  session_id INT PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(60) NOT NULL,
  size_bytes INT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE
);

CREATE TABLE program_changes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  approved_by INT NOT NULL,
  approved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES rehabilitation_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ===================== SECONDARY: MEDICATIONS / LABS (demoted, patient-scoped) =====================

CREATE TABLE sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_name VARCHAR(200) NOT NULL,
  source_type VARCHAR(80),
  source_url VARCHAR(255),
  last_reviewed DATE,
  evidence_level ENUM('High', 'Moderate', 'Limited', 'Uncertain')
);

CREATE TABLE medications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  generic_name VARCHAR(150) NOT NULL,
  brand_names TEXT,
  drug_class VARCHAR(120),
  description TEXT,
  mechanism TEXT,
  common_uses TEXT,
  dosage_forms VARCHAR(150),
  source_id INT,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE lab_markers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  unit VARCHAR(30),
  typical_range_low DECIMAL(8,2),
  typical_range_high DECIMAL(8,2),
  limitations TEXT,
  source_id INT,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE patient_medications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  medication_id INT NOT NULL,
  start_date DATE,
  dose VARCHAR(60),
  active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

CREATE TABLE patient_lab_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  lab_marker_id INT NOT NULL,
  result DECIMAL(8,2),
  ref_low DECIMAL(8,2),
  ref_high DECIMAL(8,2),
  test_date DATE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_marker_id) REFERENCES lab_markers(id)
);
