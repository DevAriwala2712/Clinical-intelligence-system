// progressController.ts - longitudinal progress for the patient app and the clinician dashboard.

import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { parseId } from '../utils/http';
import { buildProgress } from '../services/analysisService';
import { clinicianOwnsPatient } from './patientController';

/** GET /progress/mine (patient) */
export async function getMyProgress(req: AuthedRequest, res: Response) {
  res.json(await buildProgress(req.user!.id));
}

/** GET /patients/:patientId/progress (clinician) */
export async function getPatientProgress(req: AuthedRequest, res: Response) {
  const patientId = parseId(req.params.patientId);
  if (!patientId) return res.status(400).json({ error: 'patient id must be a positive integer' });
  if (!(await clinicianOwnsPatient(req.user!.id, patientId))) {
    return res.status(403).json({ error: 'This patient is not assigned to you' });
  }
  res.json(await buildProgress(patientId));
}
