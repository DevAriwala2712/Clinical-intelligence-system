// routes/index.ts
//
// The central route registry mapping all API endpoints to their controllers.
// Enforces role-based permissions and authentication guards.

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { register, login, me } from '../controllers/authController';
import {
  listExercises,
  listPathways,
  createProgram,
  updateProgram,
  discontinueProgram,
  getMyPrograms,
  getActiveProgram,
  getProgramExercises,
} from '../controllers/programController';
import {
  updateMyProfile,
  updateMyConsent,
  listPatients,
  linkPatient,
  getPatientDetail,
  updatePatientProfile,
} from '../controllers/patientController';
import { getMyProgress, getPatientProgress } from '../controllers/progressController';
import {
  uploadSession,
  getMySessions,
  getPatientSessions,
  getSessionEvidence,
  reviewSession,
  uploadSessionVideo,
  streamSessionVideo,
} from '../controllers/sessionController';
import {
  listSuggestions,
  listPendingSuggestions,
  approveSuggestion,
  rejectSuggestion,
  observeSuggestion,
  createSuggestion,
} from '../controllers/progressionController';

const router = Router();

// ---- Auth ----
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);

// ---- Shared Catalog ----
router.get('/exercises', requireAuth, listExercises);
router.get('/pathways', requireAuth, listPathways);

// ---- Patient Self-Service ----
router.put('/patients/me/profile', requireAuth, requireRole('patient'), updateMyProfile);
router.put('/patients/me/consent', requireAuth, requireRole('patient'), updateMyConsent);
router.get('/programs/active', requireAuth, requireRole('patient'), getActiveProgram);
router.get('/sessions/mine', requireAuth, requireRole('patient'), getMySessions);
router.get('/progress/mine', requireAuth, requireRole('patient'), getMyProgress);
router.post('/sessions', requireAuth, requireRole('patient'), uploadSession);
router.post('/sessions/:id/video', requireAuth, requireRole('patient'), uploadSessionVideo);

// ---- Clinician: Patient Management ----
router.get('/patients', requireAuth, requireRole('clinician'), listPatients);
router.post('/patients/link', requireAuth, requireRole('clinician'), linkPatient);
router.get('/patients/:patientId', requireAuth, requireRole('clinician'), getPatientDetail);
router.put('/patients/:patientId/profile', requireAuth, requireRole('clinician'), updatePatientProfile);
router.get('/patients/:patientId/sessions', requireAuth, requireRole('clinician'), getPatientSessions);
router.get('/patients/:patientId/progress', requireAuth, requireRole('clinician'), getPatientProgress);

// ---- Programs Workflow ----
router.post('/programs', requireAuth, requireRole('clinician'), createProgram);
router.put('/programs/:id', requireAuth, requireRole('clinician'), updateProgram);
router.post('/programs/:id/discontinue', requireAuth, requireRole('clinician'), discontinueProgram);
router.get('/programs/mine', requireAuth, getMyPrograms);
router.get('/programs/:id/exercises', requireAuth, getProgramExercises);

// ---- Session Evidence & Review ----
router.get('/sessions/:id/evidence', requireAuth, requireRole('clinician'), getSessionEvidence);
router.put('/sessions/:id/review', requireAuth, requireRole('clinician'), reviewSession);
router.get('/sessions/:id/video', requireAuth, streamSessionVideo);

// ---- Progression Workflow ----
router.get('/progression-suggestions', requireAuth, requireRole('clinician'), listSuggestions);
router.get('/progression-suggestions/pending', requireAuth, requireRole('clinician'), listPendingSuggestions);
router.post('/progression-suggestions/:id/approve', requireAuth, requireRole('clinician'), approveSuggestion);
router.post('/progression-suggestions/:id/reject', requireAuth, requireRole('clinician'), rejectSuggestion);
router.post('/progression-suggestions/:id/observe', requireAuth, requireRole('clinician'), observeSuggestion);
router.post('/progression-suggestions', requireAuth, requireRole('patient'), createSuggestion);

export default router;
