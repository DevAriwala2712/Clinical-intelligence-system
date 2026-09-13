// sessionController.ts
//
// Handles session sync (patient app -> server) and session review
// (clinician reads the evidence). This is the API-side half of the
// on-device movement analysis pipeline: everything here just STORES and
// RETRIEVES numbers that were already calculated on the patient's phone
// (Section 50: pose processing happens on-device, only results sync up).

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool } from '../db/pool';

/**
 * POST /sessions
 * Patient-only. Uploads one completed (or abstained) session, including
 * its repetitions, per-repetition metrics, and landmark trace.
 * This mirrors the local SQLite rehab_sessions/session_repetitions/
 * repetition_metrics/landmark_points tables field-for-field, so the sync
 * layer on the Flutter side is a straightforward copy.
 */
export async function uploadSession(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const {
    programExerciseId,
    sessionDate,
    status, // 'VALID' | 'ABSTAINED' | 'INCOMPLETE' | 'INVALID'
    abstainReason,
    confidence,
    pain,
    discomfort,
    difficulty,
    injuryNote,
    overallScore,
    repetitions, // [{ repetitionNumber, metrics: [{ metricName, value, expectedValue, status }] }]
    landmarkPoints, // [{ repetitionNumber, timestampMs, landmarkName, x, y, confidence, phase }]
  } = req.body;

  if (!programExerciseId || !sessionDate || !status) {
    return res.status(400).json({ error: 'programExerciseId, sessionDate, and status are required' });
  }

  // Ownership check: the program_exercise being reported on must actually
  // belong to a program that belongs to THIS patient.
  const [ownershipRows] = await pool.query(
    `SELECT pe.id FROM program_exercises pe
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE pe.id = ? AND rp.patient_id = ?`,
    [programExerciseId, patientId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This exercise assignment does not belong to you' });
  }

  // A wrong score is worse than no score (Section 143): if status isn't
  // VALID, we never store an overall_score, no matter what the client sent.
  const scoreToStore = status === 'VALID' ? overallScore ?? null : null;

  const [sessionResult] = await pool.query(
    `INSERT INTO rehab_sessions
     (program_exercise_id, session_date, status, abstain_reason, confidence, pain, discomfort, difficulty, injury_note, overall_score, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [programExerciseId, sessionDate, status, abstainReason ?? null, confidence ?? null, pain ?? null, discomfort ?? null, difficulty ?? null, injuryNote ?? null, scoreToStore]
  );
  const sessionId = (sessionResult as any).insertId;

  for (const rep of repetitions ?? []) {
    const [repResult] = await pool.query(
      'INSERT INTO session_repetitions (session_id, repetition_number) VALUES (?, ?)',
      [sessionId, rep.repetitionNumber]
    );
    const repetitionId = (repResult as any).insertId;

    for (const metric of rep.metrics ?? []) {
      await pool.query(
        `INSERT INTO repetition_metrics (repetition_id, metric_name, value, expected_value, status)
         VALUES (?, ?, ?, ?, ?)`,
        [repetitionId, metric.metricName, metric.value, metric.expectedValue ?? null, metric.status ?? null]
      );
    }
  }

  // Landmark trace: inserted in one batch query instead of one-row-at-a-time
  // to avoid hundreds of round trips for a single session (a session can
  // easily contain thousands of landmark rows across all frames).
  if (Array.isArray(landmarkPoints) && landmarkPoints.length > 0) {
    const values = landmarkPoints.map((p: any) => [
      sessionId, p.repetitionNumber ?? null, p.timestampMs, p.landmarkName, p.x, p.y, p.confidence, p.phase ?? null,
    ]);
    await pool.query(
      `INSERT INTO landmark_points (session_id, repetition_number, timestamp_ms, landmark_name, x, y, confidence, phase)
       VALUES ?`,
      [values]
    );
  }

  res.status(201).json({ sessionId });
}

/**
 * GET /patients/:patientId/sessions
 * Clinician-only. Returns every session for one of THEIR patients, most
 * recent first, so the dashboard can build the trend/adherence view.
 */
export async function getPatientSessions(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const patientId = Number(req.params.patientId);

  // Ownership check: this patient must be assigned to THIS clinician.
  const [ownershipRows] = await pool.query(
    'SELECT user_id FROM patient_profiles WHERE user_id = ? AND clinician_id = ?',
    [patientId, clinicianId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This patient is not assigned to you' });
  }

  const [rows] = await pool.query(
    `SELECT rs.*, pe.exercise_id, e.name AS exercise_name
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ?
     ORDER BY rs.session_date DESC`,
    [patientId]
  );

  res.json(rows);
}

/**
 * GET /sessions/:id/evidence
 * Clinician-only. The full evidence view for ONE session: repetitions,
 * per-repetition metrics, and the landmark trace (Section 115: the
 * clinician should never have to trust the score blindly).
 */
export async function getSessionEvidence(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const sessionId = Number(req.params.id);

  const [ownershipRows] = await pool.query(
    `SELECT rs.id FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND rp.clinician_id = ?`,
    [sessionId, clinicianId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'Not your session to review' });
  }

  const [session] = await pool.query('SELECT * FROM rehab_sessions WHERE id = ?', [sessionId]);
  const [repetitions] = await pool.query('SELECT * FROM session_repetitions WHERE session_id = ?', [sessionId]);

  const repIds = (repetitions as any[]).map((r) => r.id);
  let metrics: any[] = [];
  if (repIds.length > 0) {
    const [metricRows] = await pool.query(
      `SELECT * FROM repetition_metrics WHERE repetition_id IN (${repIds.map(() => '?').join(',')})`,
      repIds
    );
    metrics = metricRows as any[];
  }

  const [landmarks] = await pool.query(
    'SELECT * FROM landmark_points WHERE session_id = ? ORDER BY timestamp_ms',
    [sessionId]
  );

  res.json({
    session: (session as any[])[0],
    repetitions,
    metrics,
    landmarks,
  });
}

/**
 * PUT /sessions/:id/review
 * Clinician-only. Records a correction/note WITHOUT overwriting the
 * original machine-generated result (Section 71/26: keep both, for an
 * audit trail).
 */
export async function reviewSession(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const sessionId = Number(req.params.id);
  const { decision, correction, notes } = req.body;

  // Ownership check: this session must belong to one of THIS clinician's
  // patients, via rehab_sessions -> program_exercises -> rehabilitation_programs.
  // Mirrors the same pattern already used in getSessionEvidence above.
  const [ownershipRows] = await pool.query(
    `SELECT rs.id FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND rp.clinician_id = ?`,
    [sessionId, clinicianId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'Not your session to review' });
  }

  await pool.query(
    `INSERT INTO clinician_reviews (session_id, clinician_id, decision, correction, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, clinicianId, decision ?? null, correction ?? null, notes ?? null]
  );

  res.status(201).json({ ok: true });
}
