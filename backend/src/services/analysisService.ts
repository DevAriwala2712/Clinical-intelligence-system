// analysisService.ts
//
// Loads a patient's stored history from MySQL and feeds the pure longitudinal
// analysis. Also builds the Progress object shared by the patient app and the
// clinician dashboard, so both always show the same numbers.

import { pool } from '../db/pool';
import {
  analyzeExercise, computeAdherence, AnalysisResult, Adherence, SessionPoint, ComponentKey,
} from '../analysis/longitudinal';
import { toIso } from '../utils/http';

const MAX_HISTORY_PER_EXERCISE = 40;

const COMPONENT_OF_METRIC = (metricName: string): ComponentKey | null => {
  if (metricName === 'rom_deg') return 'rom';
  if (metricName === 'tempo_sec') return 'tempo';
  if (metricName === 'control_max_jerk_deg') return 'control';
  if (metricName === 'symmetry_diff_deg') return 'symmetry';
  if (metricName.startsWith('compensation')) return 'compensation';
  return null;
};

/** Every stored session of one exercise for one patient, as analysis inputs (oldest first). */
export async function loadSessionPoints(patientId: number, exerciseId: number): Promise<SessionPoint[]> {
  const [rows] = await pool.query(
    `SELECT rs.id, rs.session_date, rs.status, rs.overall_score, rs.confidence, rs.pain, rs.discomfort, rs.difficulty
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ? AND pe.exercise_id = ?
     ORDER BY rs.session_date DESC, rs.id DESC LIMIT ?`,
    [patientId, exerciseId, MAX_HISTORY_PER_EXERCISE]
  );
  const sessions = (rows as any[]).reverse();
  if (sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id);

  // clinician-corrected scores: the latest ADJUST_SCORE per session wins
  const [reviewRows] = await pool.query(
    `SELECT session_id, adjusted_score FROM clinician_reviews
     WHERE action = 'ADJUST_SCORE' AND session_id IN (?) ORDER BY created_at, id`,
    [ids]
  );
  const corrected = new Map<number, number>();
  for (const r of reviewRows as any[]) corrected.set(r.session_id, r.adjusted_score);

  // per-component share of repetitions that met target
  const [metricRows] = await pool.query(
    `SELECT sr.session_id, rm.metric_name, rm.status
     FROM session_repetitions sr JOIN repetition_metrics rm ON rm.repetition_id = sr.id
     WHERE sr.session_id IN (?)`,
    [ids]
  );
  const tally = new Map<number, Map<ComponentKey, { met: number; total: number }>>();
  for (const m of metricRows as any[]) {
    const key = COMPONENT_OF_METRIC(m.metric_name);
    if (!key) continue;
    if (!tally.has(m.session_id)) tally.set(m.session_id, new Map());
    const t = tally.get(m.session_id)!;
    const cur = t.get(key) ?? { met: 0, total: 0 };
    cur.total += 1;
    if (m.status === 'MET' || m.status === 'OK') cur.met += 1;
    t.set(key, cur);
  }

  return sessions.map((s): SessionPoint => {
    const components: Partial<Record<ComponentKey, number>> = {};
    for (const [k, v] of tally.get(s.id) ?? []) components[k] = (v.met / v.total) * 100;
    return {
      date: toIso(s.session_date) as string,
      status: s.status,
      overallScore: s.overall_score,
      correctedScore: corrected.get(s.id) ?? null,
      confidence: s.confidence,
      pain: s.pain, discomfort: s.discomfort, difficulty: s.difficulty,
      components,
    };
  });
}

/** Adherence for a patient's active programme (session days in the last 14 days). */
export async function loadAdherence(patientId: number, programId: number | null): Promise<{ adherence: Adherence; sessionsPerWeek: number }> {
  let sessionsPerWeek = 3;
  let programStart: Date | null = null;
  if (programId) {
    const [p] = await pool.query('SELECT sessions_per_week, start_date FROM rehabilitation_programs WHERE id = ?', [programId]);
    const row = (p as any[])[0];
    if (row) {
      sessionsPerWeek = row.sessions_per_week;
      programStart = new Date(`${row.start_date}T00:00:00Z`);
    }
  }
  const [rows] = await pool.query(
    `SELECT rs.session_date FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ? AND rs.session_date >= ?`,
    [patientId, new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)]
  );
  const dates = (rows as any[]).map((r) => toIso(r.session_date) as string);
  return { adherence: computeAdherence(dates, sessionsPerWeek, new Date(), programStart), sessionsPerWeek };
}

/** The Progress object of docs/API.md (patient app: /progress/mine, dashboard: /patients/:id/progress). */
export async function buildProgress(patientId: number) {
  const [pRows] = await pool.query(
    `SELECT id FROM rehabilitation_programs WHERE patient_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
    [patientId]
  );
  const programId: number | null = (pRows as any[])[0]?.id ?? null;
  const { adherence, sessionsPerWeek } = await loadAdherence(patientId, programId);

  // Exercises with any history for this patient (current programme first).
  const [exRows] = await pool.query(
    `SELECT DISTINCT e.id AS exerciseId, e.name
     FROM program_exercises pe
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ? AND (rp.status = 'active' OR EXISTS (
       SELECT 1 FROM rehab_sessions rs WHERE rs.program_exercise_id = pe.id))
     ORDER BY e.id`,
    [patientId]
  );
  const exercises: { exerciseId: number; name: string; analysis: AnalysisResult }[] = [];
  for (const ex of exRows as any[]) {
    exercises.push({ exerciseId: ex.exerciseId, name: ex.name, analysis: analyzeExercise(await loadSessionPoints(patientId, ex.exerciseId)) });
  }

  const [selfRows] = await pool.query(
    `SELECT rs.session_date, e.name AS exerciseName, rs.pain, rs.discomfort, rs.difficulty
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ? AND (rs.pain IS NOT NULL OR rs.difficulty IS NOT NULL)
     ORDER BY rs.session_date DESC, rs.id DESC LIMIT 30`,
    [patientId]
  );
  const recentSelfReports = (selfRows as any[]).map((r) => ({
    date: toIso(r.session_date), exerciseName: r.exerciseName, pain: r.pain, discomfort: r.discomfort, difficulty: r.difficulty,
  }));

  return { programId, sessionsPerWeek, adherence, exercises, recentSelfReports };
}
