// programService.ts - shared read helpers for programmes (used by several controllers).

import { pool } from '../db/pool';

export interface Criterion {
  metricName: string; targetValue: number | null; minimumValue: number | null; maximumValue: number | null;
  unit: string | null; weight: number; overridden: boolean;
}

const csv = (s: unknown): string[] => (typeof s === 'string' && s.length ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

/** The exercises of one programme with effective (override-applied) criteria. */
export async function loadProgramExercises(programId: number) {
  const [rows] = await pool.query(
    `SELECT pe.id AS programExerciseId, pe.exercise_id AS exerciseId, pe.\`sets\` AS sets,
            pe.repetitions AS repetitions, pe.order_number AS orderNumber,
            e.name, e.engine_key AS engineKey, e.description, e.instructions,
            e.camera_view AS cameraView, e.required_landmarks AS requiredLandmarks, e.phases
     FROM program_exercises pe JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.program_id = ? ORDER BY pe.order_number, pe.id`,
    [programId]
  );
  const list = rows as any[];
  if (list.length === 0) return [];

  const [catalogRows] = await pool.query(
    `SELECT exercise_id, metric_name, target_value, minimum_value, maximum_value, unit, weight
     FROM exercise_criteria WHERE exercise_id IN (?) ORDER BY id`,
    [list.map((r) => r.exerciseId)]
  );
  const [overrideRows] = await pool.query(
    `SELECT program_exercise_id, metric_name, target_value, minimum_value, maximum_value
     FROM program_exercise_criteria WHERE program_exercise_id IN (?)`,
    [list.map((r) => r.programExerciseId)]
  );

  return list.map((r) => {
    const overrides = new Map<string, any>();
    for (const o of overrideRows as any[]) if (o.program_exercise_id === r.programExerciseId) overrides.set(o.metric_name, o);

    const criteria: Criterion[] = [];
    for (const c of catalogRows as any[]) {
      if (c.exercise_id !== r.exerciseId) continue;
      const o = overrides.get(c.metric_name);
      criteria.push({
        metricName: c.metric_name,
        targetValue: o ? o.target_value : c.target_value,
        minimumValue: o ? o.minimum_value : c.minimum_value,
        maximumValue: o ? o.maximum_value : c.maximum_value,
        unit: c.unit,
        weight: c.weight ?? 0,
        overridden: !!o,
      });
    }
    return {
      programExerciseId: r.programExerciseId, exerciseId: r.exerciseId, name: r.name, engineKey: r.engineKey ?? null,
      description: r.description, instructions: r.instructions, cameraView: r.cameraView,
      requiredLandmarks: csv(r.requiredLandmarks), phases: csv(r.phases),
      sets: r.sets, repetitions: r.repetitions, orderNumber: r.orderNumber, criteria,
    };
  });
}

/** ProgramDetail for the API (see docs/API.md). */
export async function loadProgramDetail(programId: number) {
  const [rows] = await pool.query(
    `SELECT rp.id, rp.patient_id AS patientId, rp.clinician_id AS clinicianId, c.name AS clinicianName,
            rp.pathway_id AS pathwayId, pw.name AS pathwayName, rp.status,
            rp.sessions_per_week AS sessionsPerWeek, rp.start_date AS startDate, rp.end_date AS endDate
     FROM rehabilitation_programs rp
     JOIN users c ON c.id = rp.clinician_id
     JOIN rehabilitation_pathways pw ON pw.id = rp.pathway_id
     WHERE rp.id = ?`,
    [programId]
  );
  const program = (rows as any[])[0];
  if (!program) return null;
  return { ...program, exercises: await loadProgramExercises(programId) };
}

export async function loadActiveProgramId(patientId: number): Promise<number | null> {
  const [rows] = await pool.query(
    `SELECT id FROM rehabilitation_programs WHERE patient_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
    [patientId]
  );
  return (rows as any[])[0]?.id ?? null;
}

/** Loads effective criteria for a single program exercise. */
export async function loadProgramExerciseCriteria(programExerciseId: number, exerciseId: number): Promise<Criterion[]> {
  const [catalogRows] = await pool.query(
    `SELECT metric_name, target_value, minimum_value, maximum_value, unit, weight
     FROM exercise_criteria WHERE exercise_id = ? ORDER BY id`,
    [exerciseId]
  );
  const [overrideRows] = await pool.query(
    `SELECT metric_name, target_value, minimum_value, maximum_value
     FROM program_exercise_criteria WHERE program_exercise_id = ?`,
    [programExerciseId]
  );
  const overrides = new Map<string, any>();
  for (const o of overrideRows as any[]) overrides.set(o.metric_name, o);

  return (catalogRows as any[]).map((c) => {
    const o = overrides.get(c.metric_name);
    return {
      metricName: c.metric_name,
      targetValue: o ? o.target_value : c.target_value,
      minimumValue: o ? o.minimum_value : c.minimum_value,
      maximumValue: o ? o.maximum_value : c.maximum_value,
      unit: c.unit,
      weight: c.weight ?? 0,
      overridden: !!o,
    };
  });
}

