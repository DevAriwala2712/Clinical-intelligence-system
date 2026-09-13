-- ============================================================================
-- schema.sql
-- MySQL schema for the Clinician-Calibrated Rehabilitation system (server side)
--
-- Design principle (matches the SQLite copy on the patient's phone):
--   users -> patients / clinicians
--   patients -> rehabilitation_programs -> program_exercises -> rehab_sessions
--   rehab_sessions -> session_repetitions -> repetition_metrics
--   rehab_sessions -> landmark_points (for the clinician to inspect evidence)
--   rehabilitation_programs -> progression_suggestions -> clinician_reviews
--
-- Medications/labs hang off patient_id as secondary clinical context.
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
  status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
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
  session_date DATETIME NOT NULL,
  status ENUM('VALID', 'ABSTAINED', 'INCOMPLETE', 'INVALID') NOT NULL,
  abstain_reason VARCHAR(255) NULL,   -- filled only when status != VALID
  confidence DECIMAL(4,3),            -- 0.000 - 1.000
  pain INT,                           -- 0-10
  discomfort INT,                     -- 0-10
  difficulty INT,                     -- 1-10
  injury_note TEXT,
  overall_score DECIMAL(5,2) NULL,    -- NULL unless status = VALID
  synced_at DATETIME NULL,
  FOREIGN KEY (program_exercise_id) REFERENCES program_exercises(id) ON DELETE CASCADE
);

CREATE TABLE session_repetitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  repetition_number INT NOT NULL,
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
  suggestion TEXT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES rehabilitation_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE clinician_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  clinician_id INT NOT NULL,
  decision VARCHAR(60),         -- e.g. 'corrected_assessment'
  correction TEXT,              -- e.g. "Poor ROM -> Acceptable"
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id)
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
