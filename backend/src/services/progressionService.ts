// progressionService.ts
//
// After every stored session: re-run the longitudinal analysis for that
// exercise and, if the evidence justifies it, create a PENDING review prompt
// for the treating clinician.
//
// This is the ONLY place suggestions are generated, and it never touches
// program_exercises: a programme changes only when a clinician approves
// (progressionController.approveSuggestion).

import { pool } from '../db/pool';
import { analyzeExercise } from '../analysis/longitudinal';
import { evaluateProgressionRules } from '../analysis/progressionRules';
import { ANALYSIS_CONFIG as C } from '../analysis/config';
import { loadAdherence, loadSessionPoints } from './analysisService';

/** Returns how many new suggestions were created (0 or 1). */
export async function evaluateAndCreateSuggestions(patientId: number, programExerciseId: number): Promise<number> {
  const [rows] = await pool.query(
    `SELECT pe.program_id AS programId, pe.exercise_id AS exerciseId, pe.\`sets\` AS sets,
            pe.repetitions AS repetitions, e.name, rp.status
     FROM program_exercises pe
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.id = ? AND rp.patient_id = ?`,
    [programExerciseId, patientId]
  );
  const pe = (rows as any[])[0];
  if (!pe || pe.status !== 'active') return 0;

  // Never stack prompts: one open (PENDING / OBSERVE) suggestion per exercise at a time.
  const [open] = await pool.query(
    `SELECT id FROM progression_suggestions WHERE program_id = ? AND exercise_id = ? AND status IN ('PENDING', 'OBSERVE')`,
    [pe.programId, pe.exerciseId]
  );
  if ((open as any[]).length > 0) return 0;

  const points = await loadSessionPoints(patientId, pe.exerciseId);
  const analysis = analyzeExercise(points);

  // Cooldown: after a decision, wait for fresh assessed sessions before prompting again.
  const [lastDecided] = await pool.query(
    `SELECT COALESCE(reviewed_at, created_at) AS decidedAt FROM progression_suggestions
     WHERE program_id = ? AND exercise_id = ? AND status IN ('APPROVED', 'MODIFIED', 'REJECTED')
     ORDER BY id DESC LIMIT 1`,
    [pe.programId, pe.exerciseId]
  );
  const decidedAt = (lastDecided as any[])[0]?.decidedAt as Date | undefined;
  if (decidedAt) {
    const cutoff = decidedAt.toISOString();
    const assessedSince = points.filter((p) => (p.status === 'VALID' || p.status === 'PARTIAL') && p.date > cutoff).length;
    if (assessedSince < C.cooldownAssessedSessions && !analysis.painReviewTriggered) return 0;
  }

  const { adherence } = await loadAdherence(patientId, pe.programId);
  const candidates = evaluateProgressionRules({
    exerciseName: pe.name, currentSets: pe.sets, currentRepetitions: pe.repetitions,
    analysis, adherenceRate: adherence.rate,
  });
  if (candidates.length === 0) return 0;

  const c = candidates[0];
  await pool.query(
    `INSERT INTO progression_suggestions
       (program_id, exercise_id, kind, source, suggestion, reason, evidence_json, proposed_sets, proposed_repetitions, status)
     VALUES (?, ?, ?, 'system', ?, ?, ?, ?, ?, 'PENDING')`,
    [pe.programId, pe.exerciseId, c.kind, c.suggestion, c.reason,
     JSON.stringify({ analysis, adherence }), c.proposedSets, c.proposedRepetitions]
  );
  return 1;
}
