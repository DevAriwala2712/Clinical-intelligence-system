// schema.dart
//
// Local, on-device SQLite schema for the patient app.
// This mirrors the server's MySQL schema (backend/sql/schema.sql) closely,
// so that syncing a row later is a straightforward field-by-field copy.
//
// WHY SQLite still needs its own copy of tables that also exist on the
// server: the patient app must work with no internet connection at all
// (Section 9/17 of the spec). Every rehab screen reads from THIS local
// database. The sync layer is the only thing that ever talks to the server.

const String createTablesSQL = '''

-- ===================== CURRENT USER (this device belongs to one patient) =====================
CREATE TABLE current_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_user_id INTEGER,     -- the id this user has on the MySQL server, once synced
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'patient'
);

-- ===================== EXERCISE CATALOG (downloaded from server, read-only on device) =====================
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,             -- same id as the server's exercises.id
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  camera_view TEXT NOT NULL,          -- 'side' or 'front'
  required_landmarks TEXT NOT NULL,   -- comma-separated e.g. 'hip,knee,ankle'
  phases TEXT NOT NULL                -- comma-separated ordered phase names
);

CREATE TABLE exercise_criteria (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,          -- 'rom_deg','tempo_sec','symmetry_deg','confidence_min'
  target_value REAL,
  minimum_value REAL,
  maximum_value REAL,
  unit TEXT,
  weight REAL DEFAULT 0,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ===================== ASSIGNED PROGRAM (downloaded, patient cannot edit) =====================
CREATE TABLE rehabilitation_programs (
  id INTEGER PRIMARY KEY,             -- same id as server
  clinician_name TEXT,
  pathway_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE program_exercises (
  id INTEGER PRIMARY KEY,
  program_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  repetitions INTEGER NOT NULL DEFAULT 10,
  order_number INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (program_id) REFERENCES rehabilitation_programs(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ===================== SESSIONS (created on-device, then synced up) =====================
CREATE TABLE rehab_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- local id; server assigns its own id at sync time
  server_id INTEGER,                       -- filled in once this row has synced successfully
  program_exercise_id INTEGER NOT NULL,
  session_date TEXT NOT NULL,              -- ISO8601 timestamp
  status TEXT NOT NULL,                    -- 'VALID' | 'ABSTAINED' | 'INCOMPLETE' | 'INVALID'
  abstain_reason TEXT,
  confidence REAL,
  pain INTEGER,
  discomfort INTEGER,
  difficulty INTEGER,
  injury_note TEXT,
  overall_score REAL,
  sync_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'SYNCED' | 'FAILED'
  FOREIGN KEY (program_exercise_id) REFERENCES program_exercises(id)
);

CREATE TABLE session_repetitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  repetition_number INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id)
);

CREATE TABLE repetition_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repetition_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL,
  expected_value REAL,
  status TEXT,
  FOREIGN KEY (repetition_id) REFERENCES session_repetitions(id)
);

-- Landmark trace: kept locally so the patient's OWN device has the evidence
-- even before syncing. Rows are deleted after a successful sync of very old
-- sessions to keep the phone's storage small (Section 47/49: don't store
-- unnecessary bulk data by default).
CREATE TABLE landmark_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  repetition_number INTEGER,
  timestamp_ms INTEGER NOT NULL,
  landmark_name TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  confidence REAL NOT NULL,
  phase TEXT,
  FOREIGN KEY (session_id) REFERENCES rehab_sessions(id)
);

-- ===================== PROGRESSION (read-only mirror of server decisions) =====================
CREATE TABLE progression_suggestions (
  id INTEGER PRIMARY KEY,
  program_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  suggestion TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
);

-- ===================== SECONDARY: HEALTH KNOWLEDGE (kept from the original app) =====================
CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_type TEXT,
  source_url TEXT,
  last_reviewed TEXT,
  evidence_level TEXT
);

CREATE TABLE medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generic_name TEXT NOT NULL,
  brand_names TEXT,
  drug_class TEXT,
  description TEXT,
  mechanism TEXT,
  common_uses TEXT,
  dosage_forms TEXT,
  source_id INTEGER,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE medication_side_effects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  side_effect TEXT NOT NULL,
  frequency TEXT,
  severity TEXT,
  source_id INTEGER,
  FOREIGN KEY (medication_id) REFERENCES medications(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE medication_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_1_id INTEGER NOT NULL,
  medication_2_id INTEGER NOT NULL,
  severity TEXT,
  description TEXT,
  source_id INTEGER,
  FOREIGN KEY (medication_1_id) REFERENCES medications(id),
  FOREIGN KEY (medication_2_id) REFERENCES medications(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE lab_markers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  typical_range_low REAL,
  typical_range_high REAL,
  increase_factors TEXT,
  decrease_factors TEXT,
  limitations TEXT,
  source_id INTEGER,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE medication_lab_effects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  lab_marker_id INTEGER NOT NULL,
  relationship TEXT,
  description TEXT,
  evidence_level TEXT,
  source_id INTEGER,
  FOREIGN KEY (medication_id) REFERENCES medications(id),
  FOREIGN KEY (lab_marker_id) REFERENCES lab_markers(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE user_medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  start_date TEXT,
  dose TEXT,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

CREATE TABLE user_lab_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lab_marker_id INTEGER NOT NULL,
  result REAL,
  unit TEXT,
  ref_low REAL,
  ref_high REAL,
  test_date TEXT,
  FOREIGN KEY (lab_marker_id) REFERENCES lab_markers(id)
);

CREATE TABLE user_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measurement_date TEXT,
  weight_kg REAL,
  waist_cm REAL,
  neck_cm REAL,
  chest_cm REAL,
  arm_cm REAL,
  hip_cm REAL,
  thigh_cm REAL
);
''';
