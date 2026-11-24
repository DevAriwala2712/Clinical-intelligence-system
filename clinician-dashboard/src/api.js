const DEFAULT_API = typeof window !== 'undefined' && window.localStorage?.getItem('API_URL') 
  ? window.localStorage.getItem('API_URL') 
  : 'http://localhost:4000/api';

const BASE_URL = DEFAULT_API;

// Test Accounts Catalog
export const TEST_ACCOUNTS = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'clinician@demo.com',
    role: 'clinician',
    title: 'Lead Physical Therapist (MSK & Post-Op)',
    licenseNumber: 'PT-88492',
    hospital: 'Metropolitan Rehabilitation Center',
  },
  {
    name: 'Dr. Aarav Patel',
    email: 'dr.patel@rehab.org',
    role: 'clinician',
    title: 'Senior Sports Rehabilitation Specialist',
    licenseNumber: 'PT-91204',
    hospital: 'Apex Orthopaedic & Sports Medicine',
  },
  {
    name: 'Dr. Demo',
    email: 'demo@demo.com',
    role: 'clinician',
    title: 'Clinical Evaluation Staff',
    licenseNumber: 'PT-10001',
    hospital: 'Clinical Intelligence Demo Clinic',
  },
];

// Rich Demo Patients
let DEMO_PATIENTS = [
  {
    id: 2,
    userId: 2,
    name: 'Marcus Vance',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'patient@demo.com',
    age: 29,
    sex: 'male',
    heightCm: 182,
    rehabGoal: 'Restore active knee flexion to >=120 deg, normalize gait, and return to recreational running without pain.',
    injuryHistory: 'Right knee ACL reconstruction (hamstring autograft), post-op week 7. Residual quadriceps inhibition and slight terminal extension deficit.',
    videoUploadConsent: true,
    status: 'ACTIVE',
    adherenceRate: 0.86,
    pendingSuggestions: 1,
    unreviewedSessions: 1,
    lastSessionAt: '2026-11-23T18:00:00.000Z',
    latestSession: {
      date: '2026-11-23T18:00:00.000Z',
      overallScore: 87.5,
      status: 'VALID',
    },
  },
  {
    id: 4,
    userId: 4,
    name: 'Elena Rostova',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@demo.com',
    age: 36,
    sex: 'female',
    heightCm: 168,
    rehabGoal: 'Pain-free shoulder abduction to 150 deg; eliminate compensatory shoulder hiking during reaching.',
    injuryHistory: 'Right supraspinatus tendinopathy with secondary scapular dyskinesis, persistent for 3 months.',
    videoUploadConsent: false,
    status: 'ACTIVE',
    adherenceRate: 0.92,
    pendingSuggestions: 1,
    unreviewedSessions: 0,
    lastSessionAt: '2026-11-22T15:30:00.000Z',
    latestSession: {
      date: '2026-11-22T15:30:00.000Z',
      overallScore: 82.0,
      status: 'VALID',
    },
  },
  {
    id: 5,
    userId: 5,
    name: 'David Chen',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david@demo.com',
    age: 44,
    sex: 'male',
    heightCm: 175,
    rehabGoal: 'Full active terminal knee extension (0 deg) and pain-free stair descent.',
    injuryHistory: 'Left knee patellar tendinopathy and mild patellofemoral cartilage wear.',
    videoUploadConsent: false,
    status: 'ACTIVE',
    adherenceRate: 0.78,
    pendingSuggestions: 0,
    unreviewedSessions: 1,
    lastSessionAt: '2026-11-21T11:00:00.000Z',
    latestSession: {
      date: '2026-11-21T11:00:00.000Z',
      overallScore: 79.5,
      status: 'VALID',
    },
  },
];

const DEMO_EXERCISES = [
  {
    id: 1,
    name: 'Bodyweight Squat',
    engineKey: 'squat',
    targetJoint: 'Knee / Hip',
    defaultRom: 90,
    cameraView: 'sagittal',
    criteria: [
      { metricName: 'rom_deg', targetValue: 90, minimumValue: 80, maximumValue: 120, unit: 'deg' },
      { metricName: 'tempo_sec', targetValue: 3.5, minimumValue: 2.0, maximumValue: 5.0, unit: 'sec' },
      { metricName: 'control_max_jerk_deg', targetValue: 15.0, minimumValue: 0.0, maximumValue: 25.0, unit: 'deg/s^3' },
      { metricName: 'compensation_trunk_lean_deg', targetValue: 15.0, minimumValue: 0.0, maximumValue: 25.0, unit: 'deg' },
    ],
  },
  {
    id: 2,
    name: 'Shoulder Abduction',
    engineKey: 'shoulder_abduction',
    targetJoint: 'Shoulder',
    defaultRom: 150,
    cameraView: 'frontal',
    criteria: [
      { metricName: 'rom_deg', targetValue: 150, minimumValue: 130, maximumValue: 180, unit: 'deg' },
      { metricName: 'tempo_sec', targetValue: 4.0, minimumValue: 2.5, maximumValue: 6.0, unit: 'sec' },
      { metricName: 'control_max_jerk_deg', targetValue: 12.0, minimumValue: 0.0, maximumValue: 20.0, unit: 'deg/s^3' },
      { metricName: 'compensation_trunk_lean_deg', targetValue: 10.0, minimumValue: 0.0, maximumValue: 18.0, unit: 'deg' },
    ],
  },
  {
    id: 3,
    name: 'Knee Extension',
    engineKey: 'knee_extension',
    targetJoint: 'Knee',
    defaultRom: 0,
    cameraView: 'sagittal',
    criteria: [
      { metricName: 'rom_deg', targetValue: 0, minimumValue: -5, maximumValue: 10, unit: 'deg' },
      { metricName: 'tempo_sec', targetValue: 2.5, minimumValue: 1.5, maximumValue: 4.0, unit: 'sec' },
      { metricName: 'control_max_jerk_deg', targetValue: 10.0, minimumValue: 0.0, maximumValue: 18.0, unit: 'deg/s^3' },
    ],
  },
  {
    id: 4,
    name: 'Standing Lunge',
    engineKey: 'lunge',
    targetJoint: 'Knee / Hip',
    defaultRom: 85,
    cameraView: 'sagittal',
    criteria: [
      { metricName: 'rom_deg', targetValue: 85, minimumValue: 70, maximumValue: 100, unit: 'deg' },
      { metricName: 'tempo_sec', targetValue: 3.5, minimumValue: 2.0, maximumValue: 5.0, unit: 'sec' },
      { metricName: 'control_max_jerk_deg', targetValue: 14.0, minimumValue: 0.0, maximumValue: 22.0, unit: 'deg/s^3' },
    ],
  },
  {
    id: 5,
    name: 'Hip Abduction',
    engineKey: 'hip_abduction',
    targetJoint: 'Hip',
    defaultRom: 40,
    cameraView: 'frontal',
    criteria: [
      { metricName: 'rom_deg', targetValue: 40, minimumValue: 30, maximumValue: 55, unit: 'deg' },
      { metricName: 'tempo_sec', targetValue: 3.0, minimumValue: 1.8, maximumValue: 4.5, unit: 'sec' },
      { metricName: 'control_max_jerk_deg', targetValue: 12.0, minimumValue: 0.0, maximumValue: 20.0, unit: 'deg/s^3' },
    ],
  },
];

const DEMO_PATHWAYS = [
  {
    id: 1,
    name: 'Post-Operative ACL Rehabilitation (Phase II)',
    description: 'Quadriceps re-education, closed-kinetic-chain knee flexion, and frontal plane pelvic control.',
    exerciseIds: [1, 3, 4],
  },
  {
    id: 2,
    name: 'Rotator Cuff & Scapular Conditioning',
    description: 'Scapulohumeral rhythm restoration, dynamic rotator cuff strengthening without compensatory hiking.',
    exerciseIds: [2],
  },
  {
    id: 3,
    name: 'Lower Limb Functional Kinematics',
    description: 'Bilateral symmetry, eccentric deceleration, and progressive load tolerance.',
    exerciseIds: [1, 5],
  },
];

let DEMO_SUGGESTIONS = [
  {
    id: 1,
    patientId: 2,
    patientName: 'Marcus Vance',
    exerciseName: 'Bodyweight Squat',
    programExerciseId: 1,
    kind: 'PROGRESS',
    suggestion: 'Progress volume: +2 repetitions per set (from 8 to 10 reps)',
    reason: 'Patient achieved 87.5% mean movement quality over the last 6 consecutive sessions with 86% 14-day adherence. Progression criteria for volume increase are satisfied.',
    currentSets: 2,
    currentRepetitions: 8,
    proposedSets: 2,
    proposedRepetitions: 10,
    status: 'PENDING',
    createdAt: '2026-11-23T19:00:00Z',
  },
  {
    id: 2,
    patientId: 4,
    patientName: 'Elena Rostova',
    exerciseName: 'Shoulder Abduction',
    programExerciseId: 2,
    kind: 'REVIEW_COMPENSATION',
    suggestion: 'Scapular hiking alert: review coronal plane kinematics',
    reason: 'Trunk lean exceeded 10 deg on 3 repetitions during terminal elevation. Consider reducing target ROM from 150 deg to 135 deg to prevent trapezius dominance.',
    currentSets: 3,
    currentRepetitions: 10,
    proposedSets: null,
    proposedRepetitions: null,
    status: 'PENDING',
    createdAt: '2026-11-22T16:00:00Z',
  },
];

function generateDemoLandmarks() {
  const points = [];
  const landmarks = ['leftHip', 'leftKnee', 'leftAnkle', 'rightHip', 'rightKnee', 'rightAnkle'];
  for (let rep = 1; rep <= 5; rep++) {
    for (let frame = 0; frame < 24; frame++) {
      const t = frame / 24;
      const squat = Math.sin(t * Math.PI);
      const timeMs = (rep - 1) * 3500 + frame * 140;
      const phase = t < 0.4 ? 'ECCENTRIC' : t < 0.6 ? 'INFLECTION' : 'CONCENTRIC';

      // Left side landmarks
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'leftHip',
        landmark_name: 'leftHip',
        x: 0.46,
        y: 0.44 + squat * 0.14,
        confidence: 0.98,
        phase,
      });
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'leftKnee',
        landmark_name: 'leftKnee',
        x: 0.44,
        y: 0.62 + squat * 0.05,
        confidence: 0.97,
        phase,
      });
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'leftAnkle',
        landmark_name: 'leftAnkle',
        x: 0.45,
        y: 0.84,
        confidence: 0.99,
        phase,
      });

      // Right side landmarks
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'rightHip',
        landmark_name: 'rightHip',
        x: 0.54,
        y: 0.44 + squat * 0.14,
        confidence: 0.98,
        phase,
      });
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'rightKnee',
        landmark_name: 'rightKnee',
        x: 0.56,
        y: 0.62 + squat * 0.05,
        confidence: 0.97,
        phase,
      });
      points.push({
        repetitionNumber: rep,
        timestampMs: timeMs,
        timestamp_ms: timeMs,
        landmarkName: 'rightAnkle',
        landmark_name: 'rightAnkle',
        x: 0.55,
        y: 0.84,
        confidence: 0.99,
        phase,
      });
    }
  }
  return points;
}

let DEMO_EVIDENCE = {
  session: {
    id: 3,
    programExerciseId: 1,
    sessionDate: '2026-11-23T18:00:00.000Z',
    durationSec: 145,
    status: 'VALID',
    confidence: 0.96,
    analysisMethod: 'temporal',
    setsCompleted: 2,
    repsCompleted: 5,
    pain: 2,
    discomfort: 3,
    difficulty: 4,
    injuryNote: 'Mild tightness in patellar tendon during final 2 reps, but no sharp pain.',
  },
  exercise: {
    name: 'Bodyweight Squat',
    cameraView: 'sagittal',
    requiredLandmarks: ['leftHip', 'leftKnee', 'leftAnkle', 'rightHip', 'rightKnee', 'rightAnkle'],
    phases: ['START', 'ECCENTRIC', 'INFLECTION', 'CONCENTRIC', 'COMPLETED'],
  },
  original: {
    overallScore: 87.5,
    score: 87.5,
    errorCount: 1,
    flaggedErrors: [
      { id: 1, repetitionNumber: 5, errorCode: 'excessive_trunk_lean', severity: 'MILD', message: 'Trunk lean exceeded 18 deg during concentric inflection', status: 'FLAGGED' },
    ],
  },
  effective: {
    score: 87.5,
    scoreCorrected: false,
    errorCount: 1,
    flaggedErrors: [
      { id: 1, repetitionNumber: 5, errorCode: 'excessive_trunk_lean', severity: 'MILD', message: 'Trunk lean exceeded 18 deg during concentric inflection', status: 'FLAGGED' },
    ],
  },
  repetitions: [
    { repetitionNumber: 1, durationSec: 3.2, peakRom: 92.4, meanJerk: 6.8, symmetryDiff: 2.1, status: 'VALID', qualityScore: 91.0 },
    { repetitionNumber: 2, durationSec: 3.4, peakRom: 90.8, meanJerk: 7.2, symmetryDiff: 1.8, status: 'VALID', qualityScore: 89.5 },
    { repetitionNumber: 3, durationSec: 3.1, peakRom: 88.5, meanJerk: 8.1, symmetryDiff: 3.2, status: 'VALID', qualityScore: 86.0 },
    { repetitionNumber: 4, durationSec: 3.5, peakRom: 89.2, meanJerk: 7.9, symmetryDiff: 2.5, status: 'VALID', qualityScore: 88.0 },
    { repetitionNumber: 5, durationSec: 3.3, peakRom: 86.0, meanJerk: 11.4, symmetryDiff: 4.8, status: 'VALID', qualityScore: 82.0 },
  ],
  landmarks: generateDemoLandmarks(),
  corrections: [],
  video: { available: false },
};

async function request(method, path, token, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    // Graceful offline fallback for static deployments (GitHub Pages)
    console.warn(`[API] Serving interactive clinical demo data for ${path}:`, err.message);
    return handleDemoFallback(method, path, body);
  }
}

function handleDemoFallback(method, path, body) {
  if (path === '/auth/login') {
    const email = body?.email || 'clinician@demo.com';
    const matchedAccount = TEST_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase()) || {
      name: 'Dr. Sarah Jenkins',
      email: email,
      role: 'clinician',
      licenseNumber: 'PT-88492',
    };

    return {
      token: `demo-jwt-${matchedAccount.email}`,
      user: {
        id: 1,
        email: matchedAccount.email,
        name: matchedAccount.name,
        role: 'clinician',
        licenseNumber: matchedAccount.licenseNumber,
      },
    };
  }

  if (path === '/auth/me') {
    return {
      id: 1,
      email: 'clinician@demo.com',
      name: 'Dr. Sarah Jenkins',
      role: 'clinician',
      licenseNumber: 'PT-88492',
    };
  }

  if (path === '/patients') {
    return DEMO_PATIENTS;
  }

  if (path === '/patients/link') {
    const newPatient = {
      id: DEMO_PATIENTS.length + 1,
      name: body?.email ? body.email.split('@')[0] : 'New Patient',
      email: body?.email || 'patient@demo.com',
      age: 32,
      sex: 'other',
      heightCm: 170,
      rehabGoal: 'Evaluate functional joint kinematics and pain thresholds',
      injuryHistory: 'New clinical intake record',
      videoUploadConsent: false,
      status: 'ACTIVE',
      adherenceRate: 1.0,
      pendingSuggestions: 0,
      unreviewedSessions: 0,
    };
    DEMO_PATIENTS.push(newPatient);
    return newPatient;
  }

  if (path.startsWith('/patients/') && path.includes('/progress')) {
    return {
      adherenceRate: 0.86,
      sessionsCount: 8,
      trend: 'IMPROVING',
      trendSlope: 0.42,
      meanScore: 87.5,
      romTrend: [80, 82, 83, 85, 86, 88, 89, 91],
    };
  }

  if (path.startsWith('/patients/') && path.includes('/sessions')) {
    return [
      { id: 3, sessionDate: '2026-11-23T18:00:00Z', exerciseName: 'Bodyweight Squat', overallScore: 87.5, effectiveScore: 87.5, repsCompleted: 5, setsCompleted: 2, pain: 2, difficulty: 4, status: 'VALID', reviewed: true },
      { id: 2, sessionDate: '2026-11-21T17:30:00Z', exerciseName: 'Bodyweight Squat', overallScore: 85.0, effectiveScore: 85.0, repsCompleted: 5, setsCompleted: 2, pain: 3, difficulty: 4, status: 'VALID', reviewed: true },
      { id: 1, sessionDate: '2026-11-19T18:15:00Z', exerciseName: 'Bodyweight Squat', overallScore: 82.0, effectiveScore: 82.0, repsCompleted: 5, setsCompleted: 2, pain: 3, difficulty: 5, status: 'VALID', reviewed: true },
    ];
  }

  if (path.startsWith('/patients/') && path.includes('/profile')) {
    const id = Number(path.split('/')[2]);
    const p = DEMO_PATIENTS.find((item) => item.id === id);
    if (p && body) {
      if (body.rehabGoal !== undefined) p.rehabGoal = body.rehabGoal;
      if (body.injuryHistory !== undefined) p.injuryHistory = body.injuryHistory;
      if (body.age !== undefined) p.age = body.age;
      if (body.heightCm !== undefined) p.heightCm = body.heightCm;
    }
    return { ok: true, patient: p };
  }

  if (path.startsWith('/patients/')) {
    const id = Number(path.split('/')[2]);
    const p = DEMO_PATIENTS.find((item) => item.id === id) || DEMO_PATIENTS[0];
    return {
      patient: p,
      activeProgram: {
        id: 1,
        name: 'ACL Post-Operative Kinematic Restoration (Phase II)',
        pathwayId: 1,
        sessionsPerWeek: 3,
        startDate: '2026-10-15',
        status: 'active',
        exercises: [
          {
            id: 1,
            exerciseId: 1,
            name: 'Bodyweight Squat',
            targetJoint: 'Knee',
            sets: 3,
            repetitions: 10,
            orderNumber: 1,
            criteria: [
              { metricName: 'rom_deg', targetValue: 90, minimumValue: 80, maximumValue: 120, unit: 'deg' },
              { metricName: 'tempo_sec', targetValue: 3.5, minimumValue: 2.0, maximumValue: 5.0, unit: 'sec' },
              { metricName: 'control_max_jerk_deg', targetValue: 12.0, minimumValue: 0.0, maximumValue: 18.0, unit: 'deg/s^3' },
            ],
          },
          {
            id: 2,
            exerciseId: 3,
            name: 'Knee Extension',
            targetJoint: 'Knee',
            sets: 3,
            repetitions: 12,
            orderNumber: 2,
            criteria: [
              { metricName: 'rom_deg', targetValue: 0, minimumValue: -5, maximumValue: 10, unit: 'deg' },
              { metricName: 'tempo_sec', targetValue: 2.5, minimumValue: 1.5, maximumValue: 4.0, unit: 'sec' },
            ],
          },
        ],
      },
    };
  }

  if (path === '/pathways') return DEMO_PATHWAYS;
  if (path === '/exercises') return DEMO_EXERCISES;

  if (path.includes('/sessions/') && path.includes('/evidence')) {
    return DEMO_EVIDENCE;
  }

  if (path.includes('/sessions/') && path.includes('/review')) {
    if (body?.action === 'DISMISS_ERROR' && body?.errorId) {
      DEMO_EVIDENCE.effective.flaggedErrors = DEMO_EVIDENCE.effective.flaggedErrors.filter(
        (e) => e.id !== body.errorId
      );
      DEMO_EVIDENCE.effective.errorCount = DEMO_EVIDENCE.effective.flaggedErrors.length;
    } else if (body?.action === 'ADJUST_SCORE' && body?.adjustedScore !== undefined) {
      DEMO_EVIDENCE.effective.score = body.adjustedScore;
      DEMO_EVIDENCE.effective.scoreCorrected = true;
    }
    return { message: 'Review saved successfully (Demo Mode)', review: body };
  }

  if (path.includes('/progression-suggestions')) {
    if (path.includes('/approve')) {
      const id = Number(path.split('/')[2]);
      DEMO_SUGGESTIONS = DEMO_SUGGESTIONS.filter((s) => s.id !== id);
      return { message: 'Suggestion approved (Demo Mode)', updated: true };
    }
    if (path.includes('/reject')) {
      const id = Number(path.split('/')[2]);
      DEMO_SUGGESTIONS = DEMO_SUGGESTIONS.filter((s) => s.id !== id);
      return { message: 'Suggestion rejected (Demo Mode)', updated: true };
    }
    if (path.includes('/observe')) {
      const id = Number(path.split('/')[2]);
      const s = DEMO_SUGGESTIONS.find((item) => item.id === id);
      if (s) s.status = 'OBSERVE';
      return { message: 'Observation recorded (Demo Mode)', updated: true };
    }
    return DEMO_SUGGESTIONS;
  }

  if (path === '/programs') {
    return { message: 'Rehabilitation programme created and assigned (Demo Mode)', id: 102 };
  }

  if (path.includes('/discontinue')) {
    return { message: 'Programme discontinued (Demo Mode)', ok: true };
  }

  return {};
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', null, { email, password }),
  register: (body) => request('POST', '/auth/register', null, body),
  me: (token) => request('GET', '/auth/me', token),

  // Patients
  listPatients: (token) => request('GET', '/patients', token),
  linkPatient: (token, email) => request('POST', '/patients/link', token, { email }),
  getPatient: (token, patientId) => request('GET', `/patients/${patientId}`, token),
  updatePatientProfile: (token, patientId, body) => request('PUT', `/patients/${patientId}/profile`, token, body),
  getPatientProgress: (token, patientId) => request('GET', `/patients/${patientId}/progress`, token),
  getPatientSessions: (token, patientId) => request('GET', `/patients/${patientId}/sessions`, token),

  // Pathways and exercises
  listPathways: (token) => request('GET', '/pathways', token),
  listExercises: (token) => request('GET', '/exercises', token),

  // Program assignment & modification
  createProgram: (token, body) => request('POST', '/programs', token, body),
  updateProgram: (token, id, body) => request('PUT', `/programs/${id}`, token, body),
  discontinueProgram: (token, id, reason) => request('POST', `/programs/${id}/discontinue`, token, { reason }),
  getProgramExercises: (token, programId) => request('GET', `/programs/${programId}/exercises`, token),

  // Sessions and Evidence Review
  getSessionEvidence: (token, sessionId) => request('GET', `/sessions/${sessionId}/evidence`, token),
  reviewSession: (token, sessionId, body) => request('PUT', `/sessions/${sessionId}/review`, token, body),

  // Progression Suggestions
  listSuggestions: (token, status = 'PENDING,OBSERVE') => request('GET', `/progression-suggestions?status=${status}`, token),
  listPendingSuggestions: (token) => request('GET', '/progression-suggestions/pending', token),
  approveSuggestion: (token, id, body) => request('POST', `/progression-suggestions/${id}/approve`, token, body),
  rejectSuggestion: (token, id, note) => request('POST', `/progression-suggestions/${id}/reject`, token, { note }),
  observeSuggestion: (token, id, note) => request('POST', `/progression-suggestions/${id}/observe`, token, { note }),
};

export const METRIC_LABELS = {
  rom_deg: 'Range of Motion',
  tempo_sec: 'Tempo',
  tempo_min_sec: 'Tempo (min)',
  tempo_max_sec: 'Tempo (max)',
  control_max_jerk_deg: 'Control (jerk)',
  compensation_trunk_lean_deg: 'Compensation (trunk lean)',
  symmetry_max_diff_deg: 'Symmetry',
  confidence_min: 'Confidence threshold',
};

export function metricLabel(name) {
  return METRIC_LABELS[name] || name;
}
