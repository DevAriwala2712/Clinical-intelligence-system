// sessionController.ts
//
// Handles session sync (patient app -> server) and session review
// (clinician reads the evidence). Enforces the central safety rule:
// only an ASSESSED session (VALID / PARTIAL) carries scores and metrics.
// An abstained session is stored with its reason only.

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthedRequest } from '../middleware/auth';
import { pool } from '../db/pool';
import { validateSessionPayload } from '../analysis/sessionValidation';
import { computeEffective } from '../analysis/effective';
import { evaluateAndCreateSuggestions } from '../services/progressionService';
import { loadProgramExerciseCriteria } from '../services/programService';
import { clinicianOwnsPatient } from './patientController';
import { parseId, toIso } from '../utils/http';

const VIDEO_DIR = path.resolve(__dirname, '../../uploads/videos');

/**
 * POST /sessions
 * Patient-only. Uploads one completed (or abstained) session, including
 * its repetitions, per-repetition metrics, phases, errors and landmark trace.
 */
export async function uploadSession(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;

  const validation = validateSessionPayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }
  const v = validation.value;

  // Ownership check: the program_exercise must belong to an active programme of THIS patient.
  const [ownershipRows] = await pool.query(
    `SELECT pe.id FROM program_exercises pe
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE pe.id = ? AND rp.patient_id = ?`,
    [v.programExerciseId, patientId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This exercise assignment does not belong to you' });
  }

  // Idempotency: re-sending the same clientSessionUuid returns 200 with the existing session ID.
  if (v.clientSessionUuid) {
    const [existingRows] = await pool.query(
      'SELECT id FROM rehab_sessions WHERE client_session_uuid = ?',
      [v.clientSessionUuid]
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      return res.status(200).json({ sessionId: existing.id, duplicate: true, suggestionsCreated: 0 });
    }
  }

  // Insert session record
  const [sessionResult] = await pool.query(
    `INSERT INTO rehab_sessions
     (program_exercise_id, client_session_uuid, session_date, duration_sec, status,
      abstain_reason, confidence, sets_completed, reps_completed, pain, discomfort,
      difficulty, injury_note, overall_score, analysis_method, capture_quality,
      assessed_metrics, unassessed_metrics, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      v.programExerciseId,
      v.clientSessionUuid,
      v.sessionDate,
      v.durationSec,
      v.status,
      v.abstainReason,
      v.confidence,
      v.setsCompleted,
      v.repsCompleted,
      v.pain,
      v.discomfort,
      v.difficulty,
      v.injuryNote,
      v.overallScore,
      v.analysisMethod,
      v.captureQuality,
      v.assessedMetrics,
      v.unassessedMetrics,
    ]
  );
  const sessionId = (sessionResult as any).insertId;

  // Insert repetitions, metrics, phases, and errors (only present for assessed sessions)
  for (const rep of v.repetitions) {
    const [repResult] = await pool.query(
      `INSERT INTO session_repetitions (session_id, repetition_number, start_ms, end_ms, angle_trace)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, rep.repetitionNumber, rep.startMs, rep.endMs, rep.angleTrace]
    );
    const repetitionId = (repResult as any).insertId;

    for (const metric of rep.metrics) {
      await pool.query(
        `INSERT INTO repetition_metrics (repetition_id, metric_name, value, expected_value, status)
         VALUES (?, ?, ?, ?, ?)`,
        [repetitionId, metric.metricName, metric.value, metric.expectedValue, metric.status]
      );
    }

    for (const phase of rep.phases) {
      await pool.query(
        `INSERT INTO repetition_phases (repetition_id, phase_name, start_ms, end_ms, min_angle, max_angle, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [repetitionId, phase.phaseName, phase.startMs, phase.endMs, phase.minAngle, phase.maxAngle, phase.status]
      );
    }

    for (const err of rep.errors) {
      await pool.query(
        `INSERT INTO repetition_errors (repetition_id, error_code, phase_name, severity, detail)
         VALUES (?, ?, ?, ?, ?)`,
        [repetitionId, err.errorCode, err.phaseName, err.severity, err.detail]
      );
    }
  }

  // Insert landmark points (batch insert)
  if (v.landmarkPoints.length > 0) {
    const values = v.landmarkPoints.map((p) => [
      sessionId,
      p.repetitionNumber,
      p.timestampMs,
      p.landmarkName,
      p.x,
      p.y,
      p.confidence,
      p.phase,
    ]);
    await pool.query(
      `INSERT INTO landmark_points (session_id, repetition_number, timestamp_ms, landmark_name, x, y, confidence, phase)
       VALUES ?`,
      [values]
    );
  }

  // Re-run longitudinal analysis and generate progression suggestion if warranted
  let suggestionsCreated = 0;
  try {
    suggestionsCreated = await evaluateAndCreateSuggestions(patientId, v.programExerciseId);
  } catch (err) {
    console.error('Failed to evaluate progression suggestions:', err);
  }

  res.status(201).json({ sessionId, duplicate: false, suggestionsCreated });
}

/**
 * GET /sessions/mine?limit=50
 * Patient-only. Returns session history for the logged-in patient.
 */
export async function getMySessions(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  const [rows] = await pool.query(
    `SELECT rs.id, rs.program_exercise_id AS programExerciseId, e.name AS exerciseName,
            rs.session_date AS sessionDate, rs.duration_sec AS durationSec, rs.status,
            rs.abstain_reason AS abstainReason, rs.overall_score AS overallScore,
            rs.confidence, rs.sets_completed AS setsCompleted, rs.reps_completed AS repsCompleted,
            rs.pain, rs.discomfort, rs.difficulty, rs.injury_note AS injuryNote,
            (SELECT cr.feedback_to_patient FROM clinician_reviews cr
             WHERE cr.session_id = rs.id AND cr.feedback_to_patient IS NOT NULL
             ORDER BY cr.created_at DESC, cr.id DESC LIMIT 1) AS clinicianFeedback,
            (SELECT COUNT(*) > 0 FROM clinician_reviews cr WHERE cr.session_id = rs.id) AS reviewed
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ?
     ORDER BY rs.session_date DESC, rs.id DESC
     LIMIT ?`,
    [patientId, limit]
  );

  res.json((rows as any[]).map((r) => ({
    ...r,
    sessionDate: toIso(r.sessionDate),
    reviewed: Boolean(r.reviewed),
  })));
}

/**
 * GET /patients/:patientId/sessions
 * Clinician-only. Returns sessions for one of their patients, most recent first.
 * Calculates effective scores and error counts based on clinician reviews.
 */
export async function getPatientSessions(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const patientId = parseId(req.params.patientId);
  if (!patientId) {
    return res.status(400).json({ error: 'patient id must be a positive integer' });
  }

  if (!(await clinicianOwnsPatient(clinicianId, patientId))) {
    return res.status(403).json({ error: 'This patient is not assigned to you' });
  }

  const [rows] = await pool.query(
    `SELECT rs.id, rs.program_exercise_id AS programExerciseId, pe.exercise_id AS exerciseId,
            e.name AS exerciseName, rs.session_date AS sessionDate, rs.duration_sec AS durationSec,
            rs.status, rs.abstain_reason AS abstainReason, rs.confidence, rs.overall_score AS overallScore,
            rs.sets_completed AS setsCompleted, rs.reps_completed AS repsCompleted,
            rs.pain, rs.discomfort, rs.difficulty, rs.injury_note AS injuryNote,
            rs.analysis_method AS analysisMethod
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rp.patient_id = ?
     ORDER BY rs.session_date DESC, rs.id DESC`,
    [patientId]
  );

  const sessions = rows as any[];
  if (sessions.length === 0) return res.json([]);
  const sessionIds = sessions.map((s) => s.id);

  // Fetch errors and reviews in bulk to compute effective scores and error counts
  const [errorRows] = await pool.query(
    `SELECT re.id, sr.session_id, re.repetition_id, re.error_code AS errorCode
     FROM repetition_errors re
     JOIN session_repetitions sr ON re.repetition_id = sr.id
     WHERE sr.session_id IN (?)`,
    [sessionIds]
  );
  const [reviewRows] = await pool.query(
    `SELECT id, session_id, action, error_id AS errorId, repetition_number AS repetitionNumber,
            error_code AS errorCode, adjusted_score AS adjustedScore, created_at AS createdAt
     FROM clinician_reviews
     WHERE session_id IN (?)
     ORDER BY created_at, id`,
    [sessionIds]
  );

  const errorsBySession = new Map<number, any[]>();
  for (const e of errorRows as any[]) {
    if (!errorsBySession.has(e.session_id)) errorsBySession.set(e.session_id, []);
    errorsBySession.get(e.session_id)!.push(e);
  }

  const reviewsBySession = new Map<number, any[]>();
  for (const r of reviewRows as any[]) {
    if (!reviewsBySession.has(r.session_id)) reviewsBySession.set(r.session_id, []);
    reviewsBySession.get(r.session_id)!.push({
      ...r,
      createdAt: toIso(r.createdAt),
    });
  }

  const result = sessions.map((s) => {
    const errs = errorsBySession.get(s.id) ?? [];
    const revs = reviewsBySession.get(s.id) ?? [];
    const eff = computeEffective(s.status, s.overallScore, errs, revs);
    return {
      ...s,
      sessionDate: toIso(s.sessionDate),
      overallScore: eff.originalScore,
      correctedScore: eff.correctedScore,
      effectiveScore: eff.effectiveScore,
      errorCount: eff.effectiveErrorCount,
      reviewed: revs.length > 0,
    };
  });

  res.json(result);
}

/**
 * GET /sessions/:id/evidence
 * Clinician-only. The full evidence view for ONE session.
 */
export async function getSessionEvidence(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const sessionId = parseId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'session id must be a positive integer' });
  }

  const [sessionRows] = await pool.query(
    `SELECT rs.*, pe.program_id, pe.exercise_id, rp.patient_id, rp.clinician_id,
            e.name AS exercise_name, e.camera_view, e.required_landmarks, e.phases
     FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN exercises e ON pe.exercise_id = e.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ?`,
    [sessionId]
  );
  const session = (sessionRows as any[])[0];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.clinician_id !== clinicianId) {
    return res.status(403).json({ error: 'Not your session to review' });
  }

  // Load criteria
  const criteria = await loadProgramExerciseCriteria(session.program_exercise_id, session.exercise_id);

  // Load repetitions with metrics, phases, and errors
  const [repRows] = await pool.query(
    `SELECT id, repetition_number, start_ms, end_ms, angle_trace
     FROM session_repetitions WHERE session_id = ? ORDER BY repetition_number`,
    [sessionId]
  );
  const reps = repRows as any[];
  const repIds = reps.map((r) => r.id);

  let metrics: any[] = [];
  let phases: any[] = [];
  let errors: any[] = [];
  if (repIds.length > 0) {
    const [mRows] = await pool.query(
      `SELECT * FROM repetition_metrics WHERE repetition_id IN (?) ORDER BY id`,
      [repIds]
    );
    metrics = mRows as any[];

    const [pRows] = await pool.query(
      `SELECT * FROM repetition_phases WHERE repetition_id IN (?) ORDER BY start_ms`,
      [repIds]
    );
    phases = pRows as any[];

    const [eRows] = await pool.query(
      `SELECT * FROM repetition_errors WHERE repetition_id IN (?) ORDER BY id`,
      [repIds]
    );
    errors = eRows as any[];
  }

  // Load clinician reviews
  const [reviewRows] = await pool.query(
    `SELECT cr.id, cr.clinician_id, u.name AS clinician_name, cr.action, cr.decision, cr.correction,
            cr.error_id, cr.repetition_number, cr.error_code, cr.adjusted_score,
            cr.notes, cr.feedback_to_patient, cr.created_at
     FROM clinician_reviews cr
     JOIN users u ON cr.clinician_id = u.id
     WHERE cr.session_id = ?
     ORDER BY cr.created_at, cr.id`,
    [sessionId]
  );
  const reviews = (reviewRows as any[]).map((r) => ({
    id: r.id,
    clinicianId: r.clinician_id,
    clinicianName: r.clinician_name,
    action: r.action,
    errorId: r.error_id,
    repetitionNumber: r.repetition_number,
    errorCode: r.error_code,
    adjustedScore: r.adjusted_score,
    notes: r.notes,
    feedbackToPatient: r.feedback_to_patient,
    createdAt: toIso(r.created_at),
  }));

  // Compute effective assessment
  const effective = computeEffective(
    session.status,
    session.overall_score,
    errors.map((e) => ({ id: e.id, repetitionId: e.repetition_id, errorCode: e.error_code })),
    reviews.map((r) => ({
      id: r.id,
      action: r.action,
      errorId: r.errorId,
      repetitionNumber: r.repetitionNumber,
      errorCode: r.errorCode,
      adjustedScore: r.adjustedScore,
      createdAt: r.createdAt as string,
    }))
  );

  // Group repetition items
  const repsWithDetails = reps.map((r) => {
    let angleTrace = null;
    if (r.angle_trace) {
      try { angleTrace = JSON.parse(r.angle_trace); } catch {}
    }
    const repErrors = errors
      .filter((e) => e.repetition_id === r.id)
      .map((e) => {
        let decision: string | null = null;
        if (effective.dismissedErrorIds.includes(e.id)) decision = 'DISMISSED';
        if (effective.confirmedErrorIds.includes(e.id)) decision = 'CONFIRMED';
        return {
          id: e.id,
          errorCode: e.error_code,
          phaseName: e.phase_name,
          severity: e.severity,
          detail: e.detail,
          autoDetected: true,
          decision,
        };
      });

    return {
      id: r.id,
      repetitionNumber: r.repetition_number,
      startMs: r.start_ms,
      endMs: r.end_ms,
      angleTrace,
      metrics: metrics.filter((m) => m.repetition_id === r.id).map((m) => ({
        metricName: m.metric_name,
        value: m.value,
        expectedValue: m.expected_value,
        status: m.status,
      })),
      phases: phases.filter((p) => p.repetition_id === r.id).map((p) => ({
        phaseName: p.phase_name,
        startMs: p.start_ms,
        endMs: p.end_ms,
        minAngle: p.min_angle,
        maxAngle: p.max_angle,
        status: p.status,
      })),
      errors: repErrors,
    };
  });

  // Load landmarks
  const [landmarkRows] = await pool.query(
    `SELECT repetition_number AS repetitionNumber, timestamp_ms AS timestampMs,
            landmark_name AS landmarkName, x, y, confidence, phase
     FROM landmark_points WHERE session_id = ? ORDER BY timestamp_ms`,
    [sessionId]
  );

  // Check video availability
  const [videoRows] = await pool.query('SELECT session_id FROM session_videos WHERE session_id = ?', [sessionId]);
  const videoAvailable = (videoRows as any[]).length > 0;

  const csv = (s: unknown): string[] => (typeof s === 'string' && s.length ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

  res.json({
    session: {
      id: session.id,
      programExerciseId: session.program_exercise_id,
      sessionDate: toIso(session.session_date),
      durationSec: session.duration_sec,
      status: session.status,
      abstainReason: session.abstain_reason,
      confidence: session.confidence,
      setsCompleted: session.sets_completed,
      repsCompleted: session.reps_completed,
      pain: session.pain,
      discomfort: session.discomfort,
      difficulty: session.difficulty,
      injuryNote: session.injury_note,
      overallScore: session.overall_score,
      analysisMethod: session.analysis_method,
      captureQuality: session.capture_quality ? JSON.parse(session.capture_quality) : null,
      assessedMetrics: csv(session.assessed_metrics),
      unassessedMetrics: csv(session.unassessed_metrics),
    },
    exercise: {
      id: session.exercise_id,
      name: session.exercise_name,
      cameraView: session.camera_view,
      requiredLandmarks: csv(session.required_landmarks),
      phases: csv(session.phases),
    },
    criteria,
    repetitions: repsWithDetails,
    addedErrors: effective.addedErrors,
    corrections: reviews,
    original: {
      score: effective.originalScore,
      errorCount: effective.originalErrorCount,
    },
    effective: {
      score: effective.effectiveScore,
      errorCount: effective.effectiveErrorCount,
      scoreCorrected: effective.correctedScore !== null,
    },
    landmarks: landmarkRows,
    video: { available: videoAvailable },
  });
}

/**
 * PUT /sessions/:id/review
 * Clinician-only. Records a correction/note WITHOUT overwriting the original machine-generated result.
 */
export async function reviewSession(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const sessionId = parseId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'session id must be a positive integer' });
  }

  const {
    action = 'NOTE',
    errorId,
    repetitionNumber,
    errorCode,
    adjustedScore,
    notes,
    feedbackToPatient,
    decision,
    correction,
  } = req.body ?? {};

  const validActions = ['NOTE', 'DISMISS_ERROR', 'CONFIRM_ERROR', 'ADD_ERROR', 'ADJUST_SCORE'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
  }

  // Ownership check: this session must belong to one of THIS clinician's patients.
  const [ownershipRows] = await pool.query(
    `SELECT rs.id, rs.status FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND rp.clinician_id = ?`,
    [sessionId, clinicianId]
  );
  const session = (ownershipRows as any[])[0];
  if (!session) {
    return res.status(403).json({ error: 'Not your session to review' });
  }

  // ADJUST_SCORE validation: score can only be adjusted on an assessed session (VALID / PARTIAL)
  if (action === 'ADJUST_SCORE') {
    if (session.status !== 'VALID' && session.status !== 'PARTIAL') {
      return res.status(409).json({ error: 'Cannot adjust score on an abstained or unassessed session' });
    }
    if (typeof adjustedScore !== 'number' || adjustedScore < 0 || adjustedScore > 100) {
      return res.status(400).json({ error: 'adjustedScore must be a number between 0 and 100' });
    }
  }

  if ((action === 'DISMISS_ERROR' || action === 'CONFIRM_ERROR') && !errorId) {
    return res.status(400).json({ error: 'errorId is required for error decisions' });
  }

  if (action === 'ADD_ERROR' && (!errorCode || typeof errorCode !== 'string')) {
    return res.status(400).json({ error: 'errorCode is required when adding an error' });
  }

  const [result] = await pool.query(
    `INSERT INTO clinician_reviews
     (session_id, clinician_id, action, decision, correction, error_id, repetition_number, error_code, adjusted_score, notes, feedback_to_patient)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      clinicianId,
      action,
      decision ?? null,
      correction ?? null,
      errorId ?? null,
      repetitionNumber ?? null,
      errorCode ?? null,
      adjustedScore ?? null,
      notes ?? null,
      feedbackToPatient ?? null,
    ]
  );

  res.status(201).json({ ok: true, reviewId: (result as any).insertId });
}

/**
 * POST /sessions/:id/video
 * Patient-only. Uploads raw video if and only if explicit consent has been given.
 */
export async function uploadSessionVideo(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const sessionId = parseId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'session id must be a positive integer' });
  }

  const [patientRows] = await pool.query(
    `SELECT pp.video_upload_consent FROM patient_profiles pp WHERE pp.user_id = ?`,
    [patientId]
  );
  const patient = (patientRows as any[])[0];
  if (!patient || !patient.video_upload_consent) {
    return res.status(403).json({ error: 'Video upload requires explicit patient consent' });
  }

  const [sessionRows] = await pool.query(
    `SELECT rs.id FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND rp.patient_id = ?`,
    [sessionId, patientId]
  );
  if ((sessionRows as any[]).length === 0) {
    return res.status(403).json({ error: 'Not your session' });
  }

  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }

  const filePath = path.join(VIDEO_DIR, `session_${sessionId}.mp4`);
  const writeStream = fs.createWriteStream(filePath);

  req.pipe(writeStream);
  writeStream.on('finish', async () => {
    const stats = fs.statSync(filePath);
    await pool.query(
      `INSERT INTO session_videos (session_id, file_path, mime_type, size_bytes)
       VALUES (?, ?, 'video/mp4', ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), size_bytes = VALUES(size_bytes)`,
      [sessionId, filePath, stats.size]
    );
    res.status(201).json({ ok: true, sizeBytes: stats.size });
  });

  writeStream.on('error', (err) => {
    console.error('Video upload failed:', err);
    res.status(500).json({ error: 'Video upload failed' });
  });
}

/**
 * GET /sessions/:id/video
 * Streams video for authorized user (patient owner or assigned clinician).
 */
export async function streamSessionVideo(req: AuthedRequest, res: Response) {
  const userId = req.user!.id;
  const role = req.user!.role;
  const sessionId = parseId(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'session id must be a positive integer' });
  }

  const [ownershipRows] = await pool.query(
    `SELECT rs.id FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND ${role === 'patient' ? 'rp.patient_id' : 'rp.clinician_id'} = ?`,
    [sessionId, userId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const [videoRows] = await pool.query('SELECT file_path, mime_type FROM session_videos WHERE session_id = ?', [sessionId]);
  const video = (videoRows as any[])[0];
  if (!video || !fs.existsSync(video.file_path)) {
    return res.status(404).json({ error: 'Video not available' });
  }

  res.setHeader('Content-Type', video.mime_type || 'video/mp4');
  fs.createReadStream(video.file_path).pipe(res);
}
