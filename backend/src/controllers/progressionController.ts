// progressionController.ts
//
// Implements Sections 43-45: the app may SUGGEST a progression review, but
// only a clinician's approve/reject/modify decision ever changes the
// active program. This file never mutates rehabilitation_programs or
// program_exercises directly on a suggestion - only on approval.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool } from '../db/pool';

/**
 * POST /progression-suggestions
 * Called by the PATIENT app's background rule-check after a valid session
 * (Section 99's progression rule runs on-device, this endpoint just
 * records the resulting suggestion for the clinician to see).
 */
export async function createSuggestion(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const { programId, exerciseId, suggestion, reason } = req.body;

  if (!programId || !exerciseId || !suggestion || !reason) {
    return res.status(400).json({ error: 'programId, exerciseId, suggestion, and reason are required' });
  }

  // Ownership check: this program must belong to THIS patient - never trust
  // a programId supplied by the client without checking who it belongs to
  // (Section 91/92).
  const [programRows] = await pool.query(
    'SELECT id FROM rehabilitation_programs WHERE id = ? AND patient_id = ?',
    [programId, patientId]
  );
  if ((programRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This program does not belong to you' });
  }

  const [result] = await pool.query(
    `INSERT INTO progression_suggestions (program_id, exercise_id, suggestion, reason, status)
     VALUES (?, ?, ?, ?, 'PENDING')`,
    [programId, exerciseId, suggestion, reason]
  );

  res.status(201).json({ suggestionId: (result as any).insertId });
}

/** GET /progression-suggestions/pending - clinician-only, their pending review queue. */
export async function listPendingSuggestions(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;

  const [rows] = await pool.query(
    `SELECT ps.*, rp.patient_id, u.name AS patient_name, e.name AS exercise_name
     FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     JOIN users u ON rp.patient_id = u.id
     JOIN exercises e ON ps.exercise_id = e.id
     WHERE rp.clinician_id = ? AND ps.status = 'PENDING'
     ORDER BY ps.created_at DESC`,
    [clinicianId]
  );

  res.json(rows);
}

/**
 * POST /progression-suggestions/:id/approve
 * body: { newSets?, newRepetitions?, newCriteriaOverrides?, note }
 * Only this endpoint is allowed to change program_exercises. It also
 * writes a program_changes row so the change is auditable (Section 45).
 */
export async function approveSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = Number(req.params.id);

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    return res.status(400).json({ error: 'suggestion id must be a positive integer' });
  }

  const { newSets, newRepetitions, note } = req.body;

  const [suggestionRows] = await pool.query(
    `SELECT ps.*, rp.clinician_id, rp.id AS program_id
     FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     WHERE ps.id = ?`,
    [suggestionId]
  );
  const suggestion = (suggestionRows as any[])[0];

  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
  if (suggestion.clinician_id !== clinicianId) {
    return res.status(403).json({ error: 'Not your patient\u2019s suggestion to approve' });
  }

  const [programExerciseRows] = await pool.query(
    'SELECT * FROM program_exercises WHERE program_id = ? AND exercise_id = ?',
    [suggestion.program_id, suggestion.exercise_id]
  );
  const oldProgramExercise = (programExerciseRows as any[])[0];
  const oldValue = JSON.stringify(oldProgramExercise);

  // A clinician "approves" when they accept the currently-assigned numbers
  // as-is; they "modify" when their approval changes sets/repetitions away
  // from what's currently assigned. progression_suggestions has no
  // structured "proposed value" field (suggestion/reason are free text),
  // so this is the only comparison the code can honestly make.
  const changedSets = newSets !== undefined && newSets !== oldProgramExercise?.sets;
  const changedRepetitions = newRepetitions !== undefined && newRepetitions !== oldProgramExercise?.repetitions;
  const finalStatus = (changedSets || changedRepetitions) ? 'MODIFIED' : 'APPROVED';

  if (newSets !== undefined || newRepetitions !== undefined) {
    await pool.query(
      `UPDATE program_exercises SET \`sets\` = COALESCE(?, \`sets\`), repetitions = COALESCE(?, repetitions)
       WHERE program_id = ? AND exercise_id = ?`,
      [newSets ?? null, newRepetitions ?? null, suggestion.program_id, suggestion.exercise_id]
    );
  }

  await pool.query('UPDATE progression_suggestions SET status = ? WHERE id = ?', [finalStatus, suggestionId]);

  await pool.query(
    `INSERT INTO program_changes (program_id, old_value, new_value, reason, approved_by)
     VALUES (?, ?, ?, ?, ?)`,
    [suggestion.program_id, oldValue, JSON.stringify({ newSets, newRepetitions }), note ?? suggestion.reason, clinicianId]
  );

  res.json({ ok: true, status: finalStatus });
}

/** POST /progression-suggestions/:id/reject */
export async function rejectSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = Number(req.params.id);

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    return res.status(400).json({ error: 'suggestion id must be a positive integer' });
  }

  const [rows] = await pool.query(
    `SELECT ps.id FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     WHERE ps.id = ? AND rp.clinician_id = ?`,
    [suggestionId, clinicianId]
  );
  if ((rows as any[]).length === 0) return res.status(403).json({ error: 'Not your patient\u2019s suggestion' });

  await pool.query(`UPDATE progression_suggestions SET status = 'REJECTED' WHERE id = ?`, [suggestionId]);
  res.json({ ok: true });
}
