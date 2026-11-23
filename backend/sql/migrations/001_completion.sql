-- 001_completion.sql
-- Upgrades a database created from the ORIGINAL schema.sql to the current one.
-- Run ONCE:   mysql -u root -p rehab_system < sql/migrations/001_completion.sql
-- A database created from the current schema.sql already has all of this and
-- must NOT run it (MySQL has no "ADD COLUMN IF NOT EXISTS").

USE rehab_system;

-- patient profile: goals, injury history, video consent
ALTER TABLE patient_profiles
  ADD COLUMN rehab_goal TEXT NULL,
  ADD COLUMN injury_history TEXT NULL,
  ADD COLUMN video_upload_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN video_consent_updated_at DATETIME NULL;

-- programs: discontinue + prescribed frequency
ALTER TABLE rehabilitation_programs
  MODIFY COLUMN status ENUM('active', 'completed', 'paused', 'discontinued') NOT NULL DEFAULT 'active',
  ADD COLUMN sessions_per_week INT NOT NULL DEFAULT 3 AFTER status;

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

ALTER TABLE exercises ADD COLUMN engine_key VARCHAR(40) NULL UNIQUE AFTER name;
-- After migrating, set engine_key for the built-in exercises (or re-run `npm run seed` on a fresh DB):
--   UPDATE exercises SET engine_key='sit_to_stand' WHERE name='Sit-to-Stand'; (etc. - see src/db/seed.ts)

-- sessions: richer status vocabulary + idempotency + capture quality
ALTER TABLE rehab_sessions
  MODIFY COLUMN status ENUM('VALID', 'PARTIAL', 'LOW_CONFIDENCE', 'INVALID', 'UNSUPPORTED', 'INCOMPLETE', 'ABSTAINED') NOT NULL,
  ADD COLUMN client_session_uuid VARCHAR(64) NULL UNIQUE AFTER program_exercise_id,
  ADD COLUMN duration_sec INT NULL AFTER session_date,
  ADD COLUMN sets_completed INT NULL AFTER confidence,
  ADD COLUMN reps_completed INT NULL AFTER sets_completed,
  ADD COLUMN analysis_method VARCHAR(20) NULL,
  ADD COLUMN capture_quality TEXT NULL,
  ADD COLUMN assessed_metrics VARCHAR(255) NULL,
  ADD COLUMN unassessed_metrics VARCHAR(255) NULL,
  ADD INDEX idx_pe_date (program_exercise_id, session_date);

ALTER TABLE session_repetitions
  ADD COLUMN start_ms BIGINT NULL,
  ADD COLUMN end_ms BIGINT NULL,
  ADD COLUMN angle_trace MEDIUMTEXT NULL;

CREATE TABLE repetition_phases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repetition_id INT NOT NULL,
  phase_name VARCHAR(40) NOT NULL,
  start_ms BIGINT NOT NULL,
  end_ms BIGINT NOT NULL,
  min_angle DECIMAL(6,2) NULL,
  max_angle DECIMAL(6,2) NULL,
  status VARCHAR(30) NULL,
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id) ON DELETE CASCADE
);

CREATE TABLE repetition_errors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repetition_id INT NOT NULL,
  error_code VARCHAR(60) NOT NULL,
  phase_name VARCHAR(40) NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  detail VARCHAR(255) NULL,
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id) ON DELETE CASCADE
);

-- progression suggestions: structured evidence + proposal + review trail
ALTER TABLE progression_suggestions
  ADD COLUMN kind ENUM('PROGRESS', 'REVIEW_DETERIORATION', 'REVIEW_PLATEAU', 'REVIEW_PAIN') NOT NULL DEFAULT 'PROGRESS' AFTER exercise_id,
  ADD COLUMN source ENUM('system', 'patient_app') NOT NULL DEFAULT 'patient_app' AFTER kind,
  ADD COLUMN evidence_json LONGTEXT NULL,
  ADD COLUMN proposed_sets INT NULL,
  ADD COLUMN proposed_repetitions INT NULL,
  MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'OBSERVE') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD COLUMN review_note TEXT NULL,
  ADD FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- clinician reviews: structured corrections (original assessment is never overwritten)
ALTER TABLE clinician_reviews
  ADD COLUMN action ENUM('NOTE', 'DISMISS_ERROR', 'CONFIRM_ERROR', 'ADD_ERROR', 'ADJUST_SCORE') NOT NULL DEFAULT 'NOTE' AFTER clinician_id,
  ADD COLUMN error_id INT NULL,
  ADD COLUMN repetition_number INT NULL,
  ADD COLUMN error_code VARCHAR(60) NULL,
  ADD COLUMN adjusted_score DECIMAL(5,2) NULL,
  ADD COLUMN feedback_to_patient TEXT NULL,
  ADD FOREIGN KEY (error_id) REFERENCES repetition_errors(id) ON DELETE SET NULL;

CREATE TABLE session_videos (
  session_id INT PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(60) NOT NULL,
  size_bytes INT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id) ON DELETE CASCADE
);
