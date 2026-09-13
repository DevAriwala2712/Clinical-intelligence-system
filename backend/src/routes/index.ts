// routes/index.ts
//
// WHAT: this file is the "map" of the whole API. Every URL the app can
// call is listed here, pointing at the controller function that handles it
// (Section 62/63's data-flow diagram: Flutter -> HTTP -> Express route ->
// Controller -> DB -> Response).
//
// The middleware arguments run IN ORDER before the final handler:
//   requireAuth        -> must have a valid login token
//   requireRole('x')   -> must be logged in as that specific role

import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  listExercises, listPathways, createProgram, getMyPrograms,
  getProgramExercises, listMyPatients,
} from '../controllers/programController';
import {
  uploadSession, getPatientSessions, getSessionEvidence, reviewSession,
} from '../controllers/sessionController';
import {
  createSuggestion, listPendingSuggestions, approveSuggestion, rejectSuggestion,
} from '../controllers/progressionController';

const router = Router();

// ---- Auth (no token required to hit these) ----
router.post('/auth/register', register);
router.post('/auth/login', login);

// ---- Shared catalog (any logged-in user) ----
router.get('/exercises', requireAuth, listExercises);
router.get('/pathways', requireAuth, listPathways);

// ---- Clinician: patient + program management ----
router.get('/patients', requireAuth, requireRole('clinician'), listMyPatients);
router.post('/programs', requireAuth, requireRole('clinician'), createProgram);

// ---- Shared: reading "my" programs works for both roles (see controller) ----
router.get('/programs/mine', requireAuth, getMyPrograms);
router.get('/programs/:id/exercises', requireAuth, getProgramExercises);

// ---- Patient: session upload ----
router.post('/sessions', requireAuth, requireRole('patient'), uploadSession);

// ---- Clinician: session review ----
router.get('/patients/:patientId/sessions', requireAuth, requireRole('clinician'), getPatientSessions);
router.get('/sessions/:id/evidence', requireAuth, requireRole('clinician'), getSessionEvidence);
router.put('/sessions/:id/review', requireAuth, requireRole('clinician'), reviewSession);

// ---- Progression workflow ----
router.post('/progression-suggestions', requireAuth, requireRole('patient'), createSuggestion);
router.get('/progression-suggestions/pending', requireAuth, requireRole('clinician'), listPendingSuggestions);
router.post('/progression-suggestions/:id/approve', requireAuth, requireRole('clinician'), approveSuggestion);
router.post('/progression-suggestions/:id/reject', requireAuth, requireRole('clinician'), rejectSuggestion);

export default router;
