const DEFAULT_API = typeof window !== 'undefined' && window.localStorage?.getItem('API_URL') 
  ? window.localStorage.getItem('API_URL') 
  : 'http://localhost:4000/api';

const BASE_URL = DEFAULT_API;

// Realistic fallback demo data when backend is unreachable (e.g. static GitHub Pages hosting)
const DEMO_PATIENTS = [
  {
    id: 2,
    user_id: 2,
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'patient@demo.com',
    dob: '1994-03-12',
    phone: '+1 (555) 234-5678',
    injury_notes: 'Right knee ACL reconstruction (hamstring autograft), post-op week 7. Residual quadriceps inhibition and slight terminal extension deficit.',
    rehab_goals: 'Restore active knee flexion to >=120 deg, normalize gait, and return to recreational running without pain.',
    status: 'ACTIVE',
    adherence_rate: 0.86,
    latest_session: {
      date: '2026-11-23T18:00:00Z',
      overall_score: 87.5,
      status: 'VALID',
    },
  },
  {
    id: 4,
    user_id: 4,
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena@demo.com',
    dob: '1988-09-22',
    phone: '+1 (555) 890-1234',
    injury_notes: 'Rotator cuff tendinopathy (supraspinatus) with secondary scapular dyskinesis.',
    rehab_goals: 'Pain-free shoulder abduction to 150 deg; eliminate compensatory shoulder hiking.',
    status: 'ACTIVE',
    adherence_rate: 0.92,
    latest_session: {
      date: '2026-11-22T15:30:00Z',
      overall_score: 82.0,
      status: 'VALID',
    },
  },
];

const DEMO_EXERCISES = [
  { id: 1, name: 'Bodyweight Squat', target_joint: 'Knee', default_rom: 90, criteria: { target_rom_deg: 90, min_tempo_sec: 2.0, max_tempo_sec: 4.5, max_jerk_deg: 15.0, max_trunk_lean_deg: 18.0 } },
  { id: 2, name: 'Shoulder Abduction', target_joint: 'Shoulder', default_rom: 150, criteria: { target_rom_deg: 150, min_tempo_sec: 2.5, max_tempo_sec: 5.0, max_jerk_deg: 12.0, max_trunk_lean_deg: 10.0 } },
  { id: 3, name: 'Knee Extension', target_joint: 'Knee', default_rom: 0, criteria: { target_rom_deg: 0, min_tempo_sec: 1.5, max_tempo_sec: 3.5, max_jerk_deg: 10.0 } },
  { id: 4, name: 'Standing Lunge', target_joint: 'Knee / Hip', default_rom: 85, criteria: { target_rom_deg: 85, min_tempo_sec: 2.0, max_tempo_sec: 4.0, max_jerk_deg: 14.0 } },
  { id: 5, name: 'Hip Abduction', target_joint: 'Hip', default_rom: 40, criteria: { target_rom_deg: 40, min_tempo_sec: 1.8, max_tempo_sec: 4.0, max_jerk_deg: 12.0 } },
];

const DEMO_PATHWAYS = [
  { id: 1, name: 'Post-Operative ACL Rehabilitation (Phase II)', description: 'Quadriceps re-education, closed-kinetic-chain knee flexion, and frontal plane pelvic control.' },
  { id: 2, name: 'Rotator Cuff & Scapular Conditioning', description: 'Scapulohumeral rhythm restoration, dynamic rotator cuff strengthening.' },
  { id: 3, name: 'General Lower Limb Kinematic Restoration', description: 'Hip abductor strength and lumbopelvic stability progression.' },
];

const DEMO_SUGGESTIONS = [
  {
    id: 1,
    patient_id: 2,
    patient_name: 'Marcus Vance',
    exercise_name: 'Bodyweight Squat',
    program_exercise_id: 1,
    suggestion_type: 'INCREASE_REPS',
    current_reps: 8,
    proposed_reps: 10,
    current_sets: 2,
    proposed_sets: 2,
    rationale: 'Patient achieved 87.5% mean movement quality over the last 6 consecutive sessions with 86% 14-day adherence. Progression criteria for volume increase are satisfied.',
    status: 'PENDING',
    created_at: '2026-11-23T19:00:00Z',
  },
];

// Generate 120 synthetic skeletal frames showing a realistic squat
function generateDemoFrames() {
  const frames = [];
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const squatDepth = Math.sin(t) > 0 ? Math.sin(t) : 0;
    const hipY = 0.50 + squatDepth * 0.12;
    const kneeY = 0.65 + squatDepth * 0.05;
    const kneeAngle = 175 - squatDepth * 85;

    frames.push({
      frameIndex: i,
      timestampMs: i * 33,
      kneeAngle: Math.round(kneeAngle),
      trunkAngle: 12 + Math.round(squatDepth * 4),
      landmarks: {
        leftShoulder: { x: 0.44, y: 0.28, visibility: 0.98 },
        rightShoulder: { x: 0.56, y: 0.28, visibility: 0.98 },
        leftHip: { x: 0.45, y: hipY, visibility: 0.99 },
        rightHip: { x: 0.55, y: hipY, visibility: 0.99 },
        leftKnee: { x: 0.43, y: kneeY, visibility: 0.97 },
        rightKnee: { x: 0.57, y: kneeY, visibility: 0.97 },
        leftAnkle: { x: 0.44, y: 0.85, visibility: 0.99 },
        rightAnkle: { x: 0.56, y: 0.85, visibility: 0.99 },
      },
    });
  }
  return frames;
}

const DEMO_EVIDENCE = {
  session: {
    id: 3,
    patient_id: 2,
    patient_name: 'Marcus Vance',
    exercise_name: 'Bodyweight Squat',
    date: '2026-11-23T18:00:00Z',
    duration_sec: 145,
    status: 'VALID',
    automated_score: 87.5,
    effective_score: 87.5,
    pain_rating: 2,
    perceived_difficulty: 4,
    notes: 'Mild tightness in patellar tendon during final 2 reps, but no sharp pain.',
    capture_quality: 'GOOD',
    mean_confidence: 0.96,
  },
  repetitions: [
    { rep_number: 1, duration_sec: 3.2, peak_rom: 92.4, mean_jerk: 6.8, symmetry_diff: 2.1, status: 'VALID', quality_score: 91.0 },
    { rep_number: 2, duration_sec: 3.4, peak_rom: 90.8, mean_jerk: 7.2, symmetry_diff: 1.8, status: 'VALID', quality_score: 89.5 },
    { rep_number: 3, duration_sec: 3.1, peak_rom: 88.5, mean_jerk: 8.1, symmetry_diff: 3.2, status: 'VALID', quality_score: 86.0 },
    { rep_number: 4, duration_sec: 3.5, peak_rom: 89.2, mean_jerk: 7.9, symmetry_diff: 2.5, status: 'VALID', quality_score: 88.0 },
    { rep_number: 5, duration_sec: 3.3, peak_rom: 86.0, mean_jerk: 11.4, symmetry_diff: 4.8, status: 'VALID', quality_score: 82.0 },
  ],
  errors: [
    { id: 1, rep_number: 5, error_type: 'excessive_trunk_lean', severity: 'MILD', message: 'Trunk lean exceeded 18 deg during concentric phase', status: 'FLAGGED' },
  ],
  frames: generateDemoFrames(),
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
    console.warn(`[API] Falling back to interactive demo data for ${path}:`, err.message);
    return handleDemoFallback(method, path, body);
  }
}

function handleDemoFallback(method, path, body) {
  if (path === '/auth/login') {
    return {
      token: 'demo-clinician-token-preview',
      user: {
        id: 1,
        email: body?.email || 'clinician@demo.com',
        name: 'Dr. Sarah Jenkins',
        role: 'CLINICIAN',
        license_number: 'PT-88492',
      },
    };
  }

  if (path === '/auth/me') {
    return {
      id: 1,
      email: 'clinician@demo.com',
      name: 'Dr. Sarah Jenkins',
      role: 'CLINICIAN',
      license_number: 'PT-88492',
    };
  }

  if (path === '/patients') return DEMO_PATIENTS;
  if (path.startsWith('/patients/2') && path.includes('/progress')) {
    return {
      adherence_rate: 0.86,
      sessions_count: 8,
      trend: 'IMPROVING',
      trend_slope: 0.42,
      mean_score: 87.5,
      rom_trend: [80, 82, 83, 85, 86, 88, 89, 91],
    };
  }
  if (path.startsWith('/patients/2') && path.includes('/sessions')) {
    return [
      { id: 3, date: '2026-11-23T18:00:00Z', exercise_name: 'Bodyweight Squat', overall_score: 87.5, effective_score: 87.5, reps_completed: 5, pain_rating: 2, status: 'VALID' },
      { id: 2, date: '2026-11-21T17:30:00Z', exercise_name: 'Bodyweight Squat', overall_score: 85.0, effective_score: 85.0, reps_completed: 5, pain_rating: 3, status: 'VALID' },
      { id: 1, date: '2026-11-19T18:15:00Z', exercise_name: 'Bodyweight Squat', overall_score: 82.0, effective_score: 82.0, reps_completed: 5, pain_rating: 3, status: 'VALID' },
    ];
  }
  if (path.startsWith('/patients/2')) return DEMO_PATIENTS[0];

  if (path === '/pathways') return DEMO_PATHWAYS;
  if (path === '/exercises') return DEMO_EXERCISES;

  if (path.includes('/sessions/') && path.includes('/evidence')) {
    return DEMO_EVIDENCE;
  }
  if (path.includes('/sessions/') && path.includes('/review')) {
    return { message: 'Review saved successfully (Demo Mode)', review: body };
  }

  if (path.includes('/progression-suggestions')) {
    if (path.includes('/approve')) return { message: 'Suggestion approved (Demo Mode)', updated: true };
    if (path.includes('/reject')) return { message: 'Suggestion rejected (Demo Mode)', updated: true };
    if (path.includes('/observe')) return { message: 'Observation recorded (Demo Mode)', updated: true };
    return DEMO_SUGGESTIONS;
  }

  if (path === '/programs') {
    return { message: 'Program created successfully (Demo Mode)', id: 101 };
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
