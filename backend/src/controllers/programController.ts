// programController.ts
//
// Catalog (exercises, pathways) and the clinician's programme workflow:
// assign, edit, discontinue. A patient programme is changed ONLY by these
// clinician endpoints or by a clinician approving a progression suggestion
// (progressionController) - never automatically.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool, withTransaction } from '../db/pool';
import { isObject, parseId } from '../utils/http';
import { loadActiveProgramId, loadProgramDetail, loadProgramExercises } from '../services/programService';

const csv = (s: unknown): string[] => (typeof s === 'string' && s.length ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

// Criteria a clinician is allowed to override per patient.
const OVERRIDABLE_METRICS = [
  'rom_deg', 'tempo_min_sec', 'tempo_max_sec', 'control_max_jerk_deg',
  'symmetry_max_diff_deg', 'compensation_trunk_lean_deg', 'confidence_min',
];

/** GET /exercises - the shared exercise catalog, visible to both roles. */
export async function listExercises(_req: AuthedRequest, res: Response) {
  const [exercises] = await pool.query('SELECT * FROM exercises ORDER BY id');
  const [criteria] = await pool.query('SELECT * FROM exercise_criteria ORDER BY id');

  const byExercise = new Map<number, any[]>();
  for (const c of criteria as any[]) {
    if (!byExercise.has(c.exercise_id)) byExercise.set(c.exercise_id, []);
    byExercise.get(c.exercise_id)!.push({
      metricName: c.metric_name, targetValue: c.target_value, minimumValue: c.minimum_value,
      maximumValue: c.maximum_value, unit: c.unit, weight: c.weight ?? 0, overridden: false,
    });
  }
  res.json((exercises as any[]).map((e) => ({
    id: e.id, name: e.name, engineKey: e.engine_key ?? null, engineSupported: e.engine_key != null,
    description: e.description, instructions: e.instructions, cameraView: e.camera_view,
    requiredLandmarks: csv(e.required_landmarks), phases: csv(e.phases),
    criteria: byExercise.get(e.id) ?? [],
  })));
}

/** GET /pathways - rehabilitation pathways with the exercise ids each contains. */
export async function listPathways(_req: AuthedRequest, res: Response) {
  const [pathways] = await pool.query('SELECT id, name, description FROM rehabilitation_pathways ORDER BY id');
  const [links] = await pool.query('SELECT pathway_id, exercise_id FROM pathway_exercises ORDER BY exercise_id');
  res.json((pathways as any[]).map((p) => ({
    ...p,
    exerciseIds: (links as any[]).filter((l) => l.pathway_id === p.id).map((l) => l.exercise_id),
  })));
}

interface CriterionInput { metricName: string; targetValue: number | null; minimumValue: number | null; maximumValue: number | null }

/** Validates a clinician's criteria overrides. */
function parseCriteria(raw: unknown): { error?: string; list: CriterionInput[] } {
  if (raw === undefined) return { list: [] };
  if (!Array.isArray(raw) || raw.length > 12) return { error: 'criteria must be an array of at most 12 items', list: [] };
  const list: CriterionInput[] = [];
  for (const c of raw) {
    if (!isObject(c) || !OVERRIDABLE_METRICS.includes(c.metricName)) {
      return { error: `criteria metricName must be one of ${OVERRIDABLE_METRICS.join(', ')}`, list: [] };
    }
    const num = (v: unknown) => (v === undefined || v === null ? null : v);
    for (const v of [c.targetValue, c.minimumValue, c.maximumValue]) {
      if (num(v) !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1000)) {
        return { error: 'criteria values must be numbers between 0 and 1000', list: [] };
      }
    }
    list.push({ metricName: c.metricName, targetValue: num(c.targetValue) as any, minimumValue: num(c.minimumValue) as any, maximumValue: num(c.maximumValue) as any });
  }
  return { list };
}

async function saveCriteria(conn: any, programExerciseId: number, list: CriterionInput[]) {
  for (const c of list) {
    if (c.targetValue === null && c.minimumValue === null && c.maximumValue === null) {
      await conn.query('DELETE FROM program_exercise_criteria WHERE program_exercise_id = ? AND metric_name = ?', [programExerciseId, c.metricName]);
    } else {
      await conn.query(
        `INSERT INTO program_exercise_criteria (program_exercise_id, metric_name, target_value, minimum_value, maximum_value)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE target_value = VALUES(target_value), minimum_value = VALUES(minimum_value), maximum_value = VALUES(maximum_value)`,
        [programExerciseId, c.metricName, c.targetValue, c.minimumValue, c.maximumValue]
      );
    }
  }
}

const validSetsReps = (sets: unknown, reps: unknown) =>
  Number.isInteger(sets) && (sets as number) >= 1 && (sets as number) <= 10 &&
  Number.isInteger(reps) && (reps as number) >= 1 && (reps as number) <= 50;

/**
 * POST /programs (clinician)
 * body: { patientId, pathwayId, sessionsPerWeek?, exercises: [{ exerciseId, sets, repetitions, orderNumber?, criteria? }] }
 */
export async function createProgram(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const { patientId, pathwayId, exercises } = req.body ?? {};
  const sessionsPerWeek = req.body?.sessionsPerWeek ?? 3;

  if (!patientId || !pathwayId || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: 'patientId, pathwayId, and at least one exercise are required' });
  }
  if (exercises.length > 8) return res.status(400).json({ error: 'A programme can contain at most 8 exercises' });
  if (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1 || sessionsPerWeek > 7) {
    return res.status(400).json({ error: 'sessionsPerWeek must be a whole number between 1 and 7' });
  }

  const seen = new Set<number>();
  const parsed: { exerciseId: number; sets: number; repetitions: number; orderNumber: number; criteria: CriterionInput[] }[] = [];
  for (const [i, ex] of exercises.entries()) {
    if (!isObject(ex) || !Number.isInteger(ex.exerciseId) || ex.exerciseId <= 0) {
      return res.status(400).json({ error: 'each exercise needs a valid exerciseId' });
    }
    if (seen.has(ex.exerciseId)) return res.status(400).json({ error: 'an exercise can only appear once in a programme' });
    seen.add(ex.exerciseId);
    const sets = ex.sets ?? 3;
    const repetitions = ex.repetitions ?? 10;
    if (!validSetsReps(sets, repetitions)) {
      return res.status(400).json({ error: 'sets must be 1-10 and repetitions must be 1-50 (whole numbers)' });
    }
    const crit = parseCriteria(ex.criteria);
    if (crit.error) return res.status(400).json({ error: crit.error });
    parsed.push({ exerciseId: ex.exerciseId, sets, repetitions, orderNumber: ex.orderNumber ?? i + 1, criteria: crit.list });
  }

  const [patientRows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'patient'", [patientId]);
  if ((patientRows as any[]).length === 0) return res.status(404).json({ error: 'Patient not found' });

  // Patient-stealing guard: a patient already assigned to a DIFFERENT clinician is refused.
  const [profileRows] = await pool.query('SELECT clinician_id FROM patient_profiles WHERE user_id = ?', [patientId]);
  const existingClinicianId = (profileRows as any[])[0]?.clinician_id;
  if (existingClinicianId != null && existingClinicianId !== clinicianId) {
    return res.status(409).json({ error: 'This patient is already assigned to a different clinician' });
  }

  const [pathwayRows] = await pool.query('SELECT id FROM rehabilitation_pathways WHERE id = ?', [pathwayId]);
  if ((pathwayRows as any[]).length === 0) return res.status(404).json({ error: 'Pathway not found' });

  const [exRows] = await pool.query('SELECT id FROM exercises WHERE id IN (?)', [parsed.map((p) => p.exerciseId)]);
  if ((exRows as any[]).length !== parsed.length) return res.status(404).json({ error: 'One or more exercises do not exist' });

  const programId = await withTransaction(async (conn) => {
    // One active programme per patient: the previous one is closed, not deleted.
    await conn.query(
      `UPDATE rehabilitation_programs SET status = 'discontinued', end_date = CURDATE()
       WHERE patient_id = ? AND status = 'active'`,
      [patientId]
    );
    const [programResult] = await conn.query(
      `INSERT INTO rehabilitation_programs (patient_id, clinician_id, pathway_id, status, sessions_per_week, start_date)
       VALUES (?, ?, ?, 'active', ?, CURDATE())`,
      [patientId, clinicianId, pathwayId, sessionsPerWeek]
    );
    const id = (programResult as any).insertId;
    for (const ex of parsed) {
      const [peResult] = await conn.query(
        `INSERT INTO program_exercises (program_id, exercise_id, \`sets\`, repetitions, order_number) VALUES (?, ?, ?, ?, ?)`,
        [id, ex.exerciseId, ex.sets, ex.repetitions, ex.orderNumber]
      );
      await saveCriteria(conn, (peResult as any).insertId, ex.criteria);
    }
    await conn.query('UPDATE patient_profiles SET clinician_id = ? WHERE user_id = ?', [clinicianId, patientId]);
    return id as number;
  });

  res.status(201).json({ programId });
}

/** Loads an ACTIVE programme owned by this clinician, or sends the error response. */
async function ownedActiveProgram(req: AuthedRequest, res: Response): Promise<any | null> {
  const programId = parseId(req.params.id);
  if (!programId) { res.status(400).json({ error: 'programme id must be a positive integer' }); return null; }
  const [rows] = await pool.query('SELECT * FROM rehabilitation_programs WHERE id = ? AND clinician_id = ?', [programId, req.user!.id]);
  const program = (rows as any[])[0];
  if (!program) { res.status(404).json({ error: 'Programme not found or not accessible' }); return null; }
  if (program.status !== 'active') { res.status(409).json({ error: 'Only an active programme can be changed' }); return null; }
  return program;
}

/**
 * PUT /programs/:id (clinician)
 * body: { sessionsPerWeek?, exercises?: [{ programExerciseId, sets?, repetitions?, criteria? }] }
 */
export async function updateProgram(req: AuthedRequest, res: Response) {
  const program = await ownedActiveProgram(req, res);
  if (!program) return;

  const { sessionsPerWeek, exercises } = req.body ?? {};
  if (sessionsPerWeek !== undefined && (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1 || sessionsPerWeek > 7)) {
    return res.status(400).json({ error: 'sessionsPerWeek must be a whole number between 1 and 7' });
  }
  if (exercises !== undefined && (!Array.isArray(exercises) || exercises.length > 8)) {
    return res.status(400).json({ error: 'exercises must be an array' });
  }

  const [peRows] = await pool.query('SELECT id, `sets`, repetitions FROM program_exercises WHERE program_id = ?', [program.id]);
  const current = new Map((peRows as any[]).map((r) => [r.id, r]));

  const edits: { id: number; sets: number; repetitions: number; criteria: CriterionInput[] }[] = [];
  for (const ex of exercises ?? []) {
    const row = isObject(ex) ? current.get(ex.programExerciseId) : undefined;
    if (!row) return res.status(404).json({ error: 'programExerciseId does not belong to this programme' });
    const sets = ex.sets ?? row.sets;
    const repetitions = ex.repetitions ?? row.repetitions;
    if (!validSetsReps(sets, repetitions)) return res.status(400).json({ error: 'sets must be 1-10 and repetitions must be 1-50 (whole numbers)' });
    const crit = parseCriteria(ex.criteria);
    if (crit.error) return res.status(400).json({ error: crit.error });
    edits.push({ id: row.id, sets, repetitions, criteria: crit.list });
  }
  if (sessionsPerWeek === undefined && edits.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const before = await loadProgramExercises(program.id);
  await withTransaction(async (conn) => {
    if (sessionsPerWeek !== undefined) {
      await conn.query('UPDATE rehabilitation_programs SET sessions_per_week = ? WHERE id = ?', [sessionsPerWeek, program.id]);
    }
    for (const e of edits) {
      await conn.query('UPDATE program_exercises SET `sets` = ?, repetitions = ? WHERE id = ?', [e.sets, e.repetitions, e.id]);
      await saveCriteria(conn, e.id, e.criteria);
    }
    await conn.query(
      `INSERT INTO program_changes (program_id, old_value, new_value, reason, approved_by) VALUES (?, ?, ?, ?, ?)`,
      [program.id, JSON.stringify({ sessionsPerWeek: program.sessions_per_week, exercises: before.map((b) => ({ programExerciseId: b.programExerciseId, sets: b.sets, repetitions: b.repetitions, criteria: b.criteria.filter((c) => c.overridden) })) }),
       JSON.stringify({ sessionsPerWeek, exercises: edits }), 'Edited by clinician', req.user!.id]
    );
  });
  res.json({ ok: true });
}

/** POST /programs/:id/discontinue (clinician) */
export async function discontinueProgram(req: AuthedRequest, res: Response) {
  const program = await ownedActiveProgram(req, res);
  if (!program) return;
  await withTransaction(async (conn) => {
    await conn.query(`UPDATE rehabilitation_programs SET status = 'discontinued', end_date = CURDATE() WHERE id = ?`, [program.id]);
    await conn.query(
      `UPDATE progression_suggestions SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, review_note = 'Programme discontinued'
       WHERE program_id = ? AND status IN ('PENDING', 'OBSERVE')`,
      [req.user!.id, new Date(), program.id]
    );
    await conn.query(
      `INSERT INTO program_changes (program_id, old_value, new_value, reason, approved_by) VALUES (?, ?, ?, ?, ?)`,
      [program.id, JSON.stringify({ status: 'active' }), JSON.stringify({ status: 'discontinued' }),
       typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 500) : 'Discontinued by clinician', req.user!.id]
    );
  });
  res.json({ ok: true, status: 'discontinued' });
}

/** GET /programs/mine - works for both roles; always filtered by the caller's own id. */
export async function getMyPrograms(req: AuthedRequest, res: Response) {
  const { id, role } = req.user!;
  const [rows] = await pool.query(
    `SELECT rp.id, rp.status, pw.name AS pathwayName, rp.start_date AS startDate, rp.end_date AS endDate
     FROM rehabilitation_programs rp JOIN rehabilitation_pathways pw ON pw.id = rp.pathway_id
     WHERE rp.${role === 'patient' ? 'patient_id' : 'clinician_id'} = ? ORDER BY rp.id DESC`,
    [id]
  );
  res.json(rows);
}

/** GET /programs/active (patient) - the whole current programme in one call. */
export async function getActiveProgram(req: AuthedRequest, res: Response) {
  const id = await loadActiveProgramId(req.user!.id);
  if (!id) return res.status(404).json({ error: 'No active programme has been assigned yet' });
  res.json(await loadProgramDetail(id));
}

/** GET /programs/:id/exercises - the exercises + effective criteria of one programme. */
export async function getProgramExercises(req: AuthedRequest, res: Response) {
  const programId = parseId(req.params.id);
  if (!programId) return res.status(400).json({ error: 'programme id must be a positive integer' });
  const { id: userId, role } = req.user!;

  const [programRows] = await pool.query(
    `SELECT id FROM rehabilitation_programs WHERE id = ? AND ${role === 'patient' ? 'patient_id' : 'clinician_id'} = ?`,
    [programId, userId]
  );
  if ((programRows as any[]).length === 0) return res.status(404).json({ error: 'Programme not found or not accessible' });

  res.json(await loadProgramExercises(programId));
}
