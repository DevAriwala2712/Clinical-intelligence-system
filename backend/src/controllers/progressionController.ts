// progressionController.ts
//
// Implements the progression workflow: the app/engine may SUGGEST a progression
// or review based on longitudinal evidence, but only a clinician's approval,
// rejection, modification or observation decision takes effect.
// A patient's programme is NEVER changed automatically.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool, withTransaction } from '../db/pool';
import { parseId, toIso } from '../utils/http';

/**
 * GET /progression-suggestions
 * Clinician-only. Returns the review queue for this clinician's patients.
 * Supports filtering by ?status=PENDING,OBSERVE (defaults to PENDING,OBSERVE).
 */
export async function listSuggestions(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const statusQuery = req.query.status as string | undefined;

  let statuses = ['PENDING', 'OBSERVE'];
  if (statusQuery) {
    statuses = statusQuery.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  }

  const [rows] = await pool.query(
    `SELECT ps.id, ps.program_id AS programId, rp.patient_id AS patientId,
            u.name AS patient_name, ps.exercise_id AS exerciseId, e.name AS exercise_name,
            ps.kind, ps.source, ps.status, ps.suggestion, ps.reason, ps.evidence_json,
            pe.\`sets\` AS currentSets, pe.repetitions AS currentRepetitions,
            ps.proposed_sets AS proposedSets, ps.proposed_repetitions AS proposedRepetitions,
            ps.created_at AS createdAt, ps.reviewed_at AS reviewedAt, ps.review_note AS reviewNote
     FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     JOIN users u ON rp.patient_id = u.id
     JOIN exercises e ON ps.exercise_id = e.id
     LEFT JOIN program_exercises pe ON pe.program_id = ps.program_id AND pe.exercise_id = ps.exercise_id
     WHERE rp.clinician_id = ? AND ps.status IN (?)
     ORDER BY ps.created_at DESC`,
    [clinicianId, statuses]
  );

  const suggestions = (rows as any[]).map((r) => {
    let evidence = null;
    let adherenceRate = null;
    if (r.evidence_json) {
      try {
        const parsed = JSON.parse(r.evidence_json);
        evidence = parsed.analysis || parsed;
        adherenceRate = parsed.adherence?.rate ?? null;
      } catch {}
    }

    return {
      id: r.id,
      programId: r.programId,
      patientId: r.patientId,
      patientName: r.patient_name,
      exerciseId: r.exerciseId,
      exerciseName: r.exercise_name,
      kind: r.kind,
      source: r.source,
      status: r.status,
      suggestion: r.suggestion,
      reason: r.reason,
      evidence,
      adherenceRate,
      currentSets: r.currentSets,
      currentRepetitions: r.currentRepetitions,
      proposedSets: r.proposedSets,
      proposedRepetitions: r.proposedRepetitions,
      createdAt: toIso(r.createdAt),
      reviewedAt: toIso(r.reviewedAt),
      reviewNote: r.reviewNote,
    };
  });

  res.json(suggestions);
}

/**
 * Legacy alias: GET /progression-suggestions/pending
 */
export async function listPendingSuggestions(req: AuthedRequest, res: Response) {
  return listSuggestions(req, res);
}

/**
 * POST /progression-suggestions/:id/approve
 * body: { newSets?, newRepetitions?, note? }
 * Clinician-only. Only this endpoint applies suggested changes to program_exercises.
 * Writes a program_changes audit row.
 */
export async function approveSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = parseId(req.params.id);

  if (!suggestionId) {
    return res.status(400).json({ error: 'suggestion id must be a positive integer' });
  }

  const { newSets, newRepetitions, note } = req.body ?? {};

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
    return res.status(403).json({ error: 'Not your patient’s suggestion to approve' });
  }

  if (suggestion.status !== 'PENDING' && suggestion.status !== 'OBSERVE') {
    return res.status(409).json({ error: 'Suggestion has already been decided' });
  }

  const [programExerciseRows] = await pool.query(
    'SELECT * FROM program_exercises WHERE program_id = ? AND exercise_id = ?',
    [suggestion.program_id, suggestion.exercise_id]
  );
  const oldProgramExercise = (programExerciseRows as any[])[0];
  const oldValue = JSON.stringify(oldProgramExercise);

  // If clinician provided specific sets/reps, use them; otherwise default to proposed values
  const targetSets = newSets !== undefined ? newSets : (suggestion.proposed_sets ?? oldProgramExercise?.sets);
  const targetReps = newRepetitions !== undefined ? newRepetitions : (suggestion.proposed_repetitions ?? oldProgramExercise?.repetitions);

  const changedSets = targetSets !== undefined && targetSets !== oldProgramExercise?.sets;
  const changedReps = targetReps !== undefined && targetReps !== oldProgramExercise?.repetitions;
  const hasProposed = suggestion.proposed_sets !== null || suggestion.proposed_repetitions !== null;
  const differsFromProposed = hasProposed && (
    (suggestion.proposed_sets !== null && targetSets !== suggestion.proposed_sets) ||
    (suggestion.proposed_repetitions !== null && targetReps !== suggestion.proposed_repetitions)
  );
  const differsFromCurrent = changedSets || changedReps;
  const finalStatus = (hasProposed ? differsFromProposed : differsFromCurrent) ? 'MODIFIED' : 'APPROVED';

  await withTransaction(async (conn) => {
    if (changedSets || changedReps) {
      await conn.query(
        `UPDATE program_exercises SET \`sets\` = COALESCE(?, \`sets\`), repetitions = COALESCE(?, repetitions)
         WHERE program_id = ? AND exercise_id = ?`,
        [targetSets ?? null, targetReps ?? null, suggestion.program_id, suggestion.exercise_id]
      );
    }

    await conn.query(
      `UPDATE progression_suggestions
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?
       WHERE id = ?`,
      [finalStatus, clinicianId, note ?? null, suggestionId]
    );

    await conn.query(
      `INSERT INTO program_changes (program_id, old_value, new_value, reason, approved_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        suggestion.program_id,
        oldValue,
        JSON.stringify({ sets: targetSets, repetitions: targetReps }),
        note ?? suggestion.reason,
        clinicianId,
      ]
    );
  });

  res.json({ ok: true, status: finalStatus });
}

/**
 * POST /progression-suggestions/:id/reject
 */
export async function rejectSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = parseId(req.params.id);

  if (!suggestionId) {
    return res.status(400).json({ error: 'suggestion id must be a positive integer' });
  }

  const { note } = req.body ?? {};

  const [rows] = await pool.query(
    `SELECT ps.id, ps.status FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     WHERE ps.id = ? AND rp.clinician_id = ?`,
    [suggestionId, clinicianId]
  );
  const suggestion = (rows as any[])[0];
  if (!suggestion) return res.status(403).json({ error: 'Not your patient’s suggestion' });

  if (suggestion.status !== 'PENDING' && suggestion.status !== 'OBSERVE') {
    return res.status(409).json({ error: 'Suggestion has already been decided' });
  }

  await pool.query(
    `UPDATE progression_suggestions
     SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
     WHERE id = ?`,
    [clinicianId, note ?? null, suggestionId]
  );
  res.json({ ok: true, status: 'REJECTED' });
}

/**
 * POST /progression-suggestions/:id/observe
 * Keeps the suggestion in the queue ("keep watching").
 */
export async function observeSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = parseId(req.params.id);

  if (!suggestionId) {
    return res.status(400).json({ error: 'suggestion id must be a positive integer' });
  }

  const { note } = req.body ?? {};

  const [rows] = await pool.query(
    `SELECT ps.id, ps.status FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     WHERE ps.id = ? AND rp.clinician_id = ?`,
    [suggestionId, clinicianId]
  );
  const suggestion = (rows as any[])[0];
  if (!suggestion) return res.status(403).json({ error: 'Not your patient’s suggestion' });

  if (suggestion.status !== 'PENDING' && suggestion.status !== 'OBSERVE') {
    return res.status(409).json({ error: 'Suggestion has already been decided' });
  }

  await pool.query(
    `UPDATE progression_suggestions
     SET status = 'OBSERVE', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
     WHERE id = ?`,
    [clinicianId, note ?? null, suggestionId]
  );
  res.json({ ok: true, status: 'OBSERVE' });
}

/**
 * POST /progression-suggestions
 * Patient app legacy support.
 */
export async function createSuggestion(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const { programId, exerciseId, suggestion, reason } = req.body ?? {};

  if (!programId || !exerciseId || !suggestion || !reason) {
    return res.status(400).json({ error: 'programId, exerciseId, suggestion, and reason are required' });
  }

  const [programRows] = await pool.query(
    'SELECT id FROM rehabilitation_programs WHERE id = ? AND patient_id = ?',
    [programId, patientId]
  );
  if ((programRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This program does not belong to you' });
  }

  const [result] = await pool.query(
    `INSERT INTO progression_suggestions (program_id, exercise_id, kind, source, suggestion, reason, status)
     VALUES (?, ?, 'PROGRESS', 'patient_app', ?, ?, 'PENDING')`,
    [programId, exerciseId, suggestion, reason]
  );

  res.status(201).json({ suggestionId: (result as any).insertId });
}
