// patientController.ts
//
// Patient profile (goal, injury history), video-upload consent, and the
// clinician's patient list / linking / detail. Ownership is always enforced
// server-side: ids in the URL are never trusted on their own.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { pool } from '../db/pool';
import { cleanText, isEmail, isObject, parseId } from '../utils/http';
import { loadActiveProgramId, loadProgramDetail } from '../services/programService';

const SEXES = ['male', 'female', 'other'];

/** Validates the editable profile fields; returns SQL assignments or an error. */
function profileUpdate(body: any): { error?: string; sets: string[]; values: any[] } {
  const sets: string[] = [];
  const values: any[] = [];
  if (!isObject(body)) return { error: 'Request body must be a JSON object', sets, values };

  if (body.age !== undefined) {
    if (body.age !== null && (!Number.isInteger(body.age) || body.age < 0 || body.age > 120)) return { error: 'age must be a whole number between 0 and 120', sets, values };
    sets.push('age = ?'); values.push(body.age);
  }
  if (body.sex !== undefined) {
    if (body.sex !== null && !SEXES.includes(body.sex)) return { error: "sex must be 'male', 'female' or 'other'", sets, values };
    sets.push('sex = ?'); values.push(body.sex);
  }
  if (body.heightCm !== undefined) {
    if (body.heightCm !== null && (typeof body.heightCm !== 'number' || body.heightCm < 50 || body.heightCm > 250)) return { error: 'heightCm must be between 50 and 250', sets, values };
    sets.push('height_cm = ?'); values.push(body.heightCm);
  }
  if (body.rehabGoal !== undefined) { sets.push('rehab_goal = ?'); values.push(cleanText(body.rehabGoal, 1000)); }
  if (body.injuryHistory !== undefined) { sets.push('injury_history = ?'); values.push(cleanText(body.injuryHistory, 2000)); }
  if (sets.length === 0) return { error: 'No profile fields were provided', sets, values };
  return { sets, values };
}

/** PUT /patients/me/profile (patient) */
export async function updateMyProfile(req: AuthedRequest, res: Response) {
  const u = profileUpdate(req.body);
  if (u.error) return res.status(400).json({ error: u.error });
  await pool.query(`UPDATE patient_profiles SET ${u.sets.join(', ')} WHERE user_id = ?`, [...u.values, req.user!.id]);
  res.json({ ok: true });
}

/** PUT /patients/me/consent (patient) - raw video upload is OFF unless the patient opts in. */
export async function updateMyConsent(req: AuthedRequest, res: Response) {
  const consent = req.body?.videoUploadConsent;
  if (typeof consent !== 'boolean') {
    return res.status(400).json({ error: 'videoUploadConsent must be true or false' });
  }
  const now = new Date();
  await pool.query(
    'UPDATE patient_profiles SET video_upload_consent = ?, video_consent_updated_at = ? WHERE user_id = ?',
    [consent, now, req.user!.id]
  );
  res.json({ videoUploadConsent: consent, updatedAt: now.toISOString() });
}

/** GET /patients (clinician) - their patients with at-a-glance counts. */
export async function listMyPatients(req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, pp.age, pp.sex, pp.height_cm AS heightCm, pp.rehab_goal AS rehabGoal,
       (SELECT rp.id FROM rehabilitation_programs rp
          WHERE rp.patient_id = u.id AND rp.status = 'active' ORDER BY rp.id DESC LIMIT 1) AS activeProgramId,
       (SELECT MAX(rs.session_date) FROM rehab_sessions rs
          JOIN program_exercises pe ON rs.program_exercise_id = pe.id
          JOIN rehabilitation_programs rp ON pe.program_id = rp.id
          WHERE rp.patient_id = u.id) AS lastSessionAt,
       (SELECT COUNT(*) FROM progression_suggestions ps
          JOIN rehabilitation_programs rp ON ps.program_id = rp.id
          WHERE rp.patient_id = u.id AND ps.status IN ('PENDING', 'OBSERVE')) AS pendingSuggestions,
       (SELECT COUNT(*) FROM rehab_sessions rs
          JOIN program_exercises pe ON rs.program_exercise_id = pe.id
          JOIN rehabilitation_programs rp ON pe.program_id = rp.id
          WHERE rp.patient_id = u.id AND rs.status IN ('VALID', 'PARTIAL')
            AND NOT EXISTS (SELECT 1 FROM clinician_reviews cr WHERE cr.session_id = rs.id)) AS unreviewedSessions
     FROM users u JOIN patient_profiles pp ON pp.user_id = u.id
     WHERE pp.clinician_id = ? ORDER BY u.name`,
    [req.user!.id]
  );
  res.json((rows as any[]).map((r) => ({ ...r, lastSessionAt: r.lastSessionAt ? new Date(r.lastSessionAt).toISOString() : null })));
}

export const listPatients = listMyPatients;
export const getPatientDetail = getPatient;


/**
 * POST /patients/link (clinician) body { email }
 * A clinician adds an existing patient account to their list by exact email.
 * Unassigned patients are never listed, so names are not exposed.
 */
export async function linkPatient(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const email = req.body?.email;
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid patient email is required' });

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, pp.clinician_id AS clinicianId
     FROM users u JOIN patient_profiles pp ON pp.user_id = u.id
     WHERE u.email = ? AND u.role = 'patient'`,
    [email.trim().toLowerCase()]
  );
  const patient = (rows as any[])[0];
  if (!patient) return res.status(404).json({ error: 'No patient account was found with that email' });
  if (patient.clinicianId !== null && patient.clinicianId !== clinicianId) {
    return res.status(409).json({ error: 'This patient is already assigned to a different clinician' });
  }
  await pool.query('UPDATE patient_profiles SET clinician_id = ? WHERE user_id = ?', [clinicianId, patient.id]);
  res.status(201).json({ id: patient.id, name: patient.name, email: patient.email });
}

/** Shared ownership check: is this patient assigned to this clinician? */
export async function clinicianOwnsPatient(clinicianId: number, patientId: number): Promise<boolean> {
  const [rows] = await pool.query(
    'SELECT user_id FROM patient_profiles WHERE user_id = ? AND clinician_id = ?',
    [patientId, clinicianId]
  );
  return (rows as any[]).length > 0;
}

/** GET /patients/:patientId (clinician) */
export async function getPatient(req: AuthedRequest, res: Response) {
  const patientId = parseId(req.params.patientId);
  if (!patientId) return res.status(400).json({ error: 'patient id must be a positive integer' });
  if (!(await clinicianOwnsPatient(req.user!.id, patientId))) {
    return res.status(403).json({ error: 'This patient is not assigned to you' });
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, pp.age, pp.sex, pp.height_cm AS heightCm, pp.rehab_goal AS rehabGoal,
            pp.injury_history AS injuryHistory, pp.video_upload_consent AS videoUploadConsent
     FROM users u JOIN patient_profiles pp ON pp.user_id = u.id WHERE u.id = ?`,
    [patientId]
  );
  const patient = (rows as any[])[0];
  patient.videoUploadConsent = !!patient.videoUploadConsent;

  const activeId = await loadActiveProgramId(patientId);
  const [programs] = await pool.query(
    `SELECT rp.id, rp.status, rp.pathway_id AS pathwayId, pw.name AS pathwayName,
            rp.start_date AS startDate, rp.end_date AS endDate
     FROM rehabilitation_programs rp JOIN rehabilitation_pathways pw ON pw.id = rp.pathway_id
     WHERE rp.patient_id = ? AND rp.clinician_id = ? ORDER BY rp.id DESC`,
    [patientId, req.user!.id]
  );
  res.json({
    patient,
    activeProgram: activeId ? await loadProgramDetail(activeId) : null,
    programs,
  });
}

/** PUT /patients/:patientId/profile (clinician) */
export async function updatePatientProfile(req: AuthedRequest, res: Response) {
  const patientId = parseId(req.params.patientId);
  if (!patientId) return res.status(400).json({ error: 'patient id must be a positive integer' });
  if (!(await clinicianOwnsPatient(req.user!.id, patientId))) {
    return res.status(403).json({ error: 'This patient is not assigned to you' });
  }
  const u = profileUpdate(req.body);
  if (u.error) return res.status(400).json({ error: u.error });
  await pool.query(`UPDATE patient_profiles SET ${u.sets.join(', ')} WHERE user_id = ?`, [...u.values, patientId]);
  res.json({ ok: true });
}
