// programController.ts
//
// Handles the "clinician assigns a program to a patient" workflow
// (Section 93) and the "patient reads their own assigned program" read
// path. Ownership is always enforced server-side (Section 91/92): we never
// trust an id supplied by the frontend without checking who it belongs to.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool } from '../db/pool';

/** GET /exercises - the shared exercise catalog, visible to both roles. */
export async function listExercises(_req: AuthedRequest, res: Response) {
  const [exercises] = await pool.query('SELECT * FROM exercises');
  const [criteria] = await pool.query('SELECT * FROM exercise_criteria');

  const criteriaByExercise: Record<number, any[]> = {};
  for (const row of criteria as any[]) {
    (criteriaByExercise[row.exercise_id] ||= []).push(row);
  }

  const result = (exercises as any[]).map((ex) => ({
    ...ex,
    criteria: criteriaByExercise[ex.id] || [],
  }));

  res.json(result);
}

/** GET /pathways - the shared list of demo rehabilitation pathways. */
export async function listPathways(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query('SELECT * FROM rehabilitation_pathways');
  res.json(rows);
}

/**
 * POST /programs
 * Clinician-only. Creates a program for a specific patient and attaches
 * exercises to it with clinician-set sets/reps.
 * body: {
 *   patientId, pathwayId,
 *   exercises: [{ exerciseId, sets, repetitions, orderNumber }]
 * }
 */
export async function createProgram(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const { patientId, pathwayId, exercises } = req.body;

  if (!patientId || !pathwayId || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: 'patientId, pathwayId, and at least one exercise are required' });
  }

  // Verify the patient actually exists and is a patient (not another clinician).
  const [patientRows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'patient'", [patientId]);
  if ((patientRows as any[]).length === 0) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Patient-stealing guard: if this patient is already assigned to a
  // DIFFERENT clinician, refuse. Only that clinician (or nobody yet) may
  // assign this patient a program through this endpoint.
  const [profileRows] = await pool.query(
    'SELECT clinician_id FROM patient_profiles WHERE user_id = ?',
    [patientId]
  );
  const existingClinicianId = (profileRows as any[])[0]?.clinician_id;
  if (existingClinicianId != null && existingClinicianId !== clinicianId) {
    return res.status(409).json({ error: 'This patient is already assigned to a different clinician' });
  }

  const [programResult] = await pool.query(
    `INSERT INTO rehabilitation_programs (patient_id, clinician_id, pathway_id, status, start_date)
     VALUES (?, ?, ?, 'active', CURDATE())`,
    [patientId, clinicianId, pathwayId]
  );
  const programId = (programResult as any).insertId;

  for (const ex of exercises) {
    await pool.query(
      `INSERT INTO program_exercises (program_id, exercise_id, \`sets\`, repetitions, order_number)
       VALUES (?, ?, ?, ?, ?)`,
      [programId, ex.exerciseId, ex.sets ?? 3, ex.repetitions ?? 10, ex.orderNumber ?? 1]
    );
  }

  // Link this patient to this clinician as their treating clinician, so the
  // clinician's "my patients" list (Section 4) picks them up automatically.
  await pool.query('UPDATE patient_profiles SET clinician_id = ? WHERE user_id = ?', [clinicianId, patientId]);

  res.status(201).json({ programId });
}

/**
 * GET /programs/mine
 * Works for BOTH roles: a patient gets their own active program; a
 * clinician gets every program they created. This is the "ownership
 * enforced server-side" pattern (Section 92) - the id in the URL/body is
 * never trusted; we always filter by req.user.id.
 */
export async function getMyPrograms(req: AuthedRequest, res: Response) {
  const { id, role } = req.user!;

  const [rows] = await pool.query(
    role === 'patient'
      ? 'SELECT * FROM rehabilitation_programs WHERE patient_id = ? ORDER BY start_date DESC'
      : 'SELECT * FROM rehabilitation_programs WHERE clinician_id = ? ORDER BY start_date DESC',
    [id]
  );

  res.json(rows);
}

/** GET /programs/:id/exercises - the assigned exercises + criteria for one program. */
export async function getProgramExercises(req: AuthedRequest, res: Response) {
  const programId = Number(req.params.id);
  const { id: userId, role } = req.user!;

  // Ownership check: this program must belong to the requesting user.
  const [programRows] = await pool.query(
    `SELECT * FROM rehabilitation_programs WHERE id = ? AND ${role === 'patient' ? 'patient_id' : 'clinician_id'} = ?`,
    [programId, userId]
  );
  if ((programRows as any[]).length === 0) {
    return res.status(404).json({ error: 'Program not found or not accessible' });
  }

  const [rows] = await pool.query(
    `SELECT pe.*, e.name, e.instructions, e.camera_view, e.required_landmarks, e.phases
     FROM program_exercises pe
     JOIN exercises e ON pe.exercise_id = e.id
     WHERE pe.program_id = ?
     ORDER BY pe.order_number`,
    [programId]
  );

  res.json(rows);
}

/** GET /patients - clinician-only. Lists patients assigned to THIS clinician. */
export async function listMyPatients(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, pp.age, pp.sex, pp.height_cm
     FROM users u
     JOIN patient_profiles pp ON pp.user_id = u.id
     WHERE pp.clinician_id = ?`,
    [clinicianId]
  );
  res.json(rows);
}
