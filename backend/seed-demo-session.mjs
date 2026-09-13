// One-off script: uploads one realistic, richly-detailed Sit-to-Stand
// session through the REAL /api/sessions endpoint (as the demo patient),
// so the clinician dashboard has real repetitions/metrics/landmarks to
// render instead of the near-empty sessions the security test suite created.
// This is real data going through the real API — not hardcoded UI fixtures.

const BASE = 'http://localhost:4000/api';

async function req(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const patientLogin = await req('POST', '/auth/login', null, { email: 'patient@demo.com', password: 'DemoPass123' });
const patientToken = patientLogin.token;

// Build a landmark trace for one Sit-to-Stand repetition: hip/knee/ankle
// tracked across 8 frames as the knee angle goes 170 -> 110 -> 170 (a full
// lowering+rising cycle), same shape as the verified geometry.dart tests.
const kneeAngles = [170, 155, 135, 115, 110, 125, 145, 165];
const phases = ['start_seated', 'rising', 'rising', 'standing', 'standing', 'returning', 'returning', 'seated'];
const landmarkPoints = [];
kneeAngles.forEach((angle, i) => {
  const t = i * 400; // ms
  const kneeY = 300 - i * 5; // slight vertical drift, cosmetic realism
  landmarkPoints.push(
    { repetitionNumber: 1, timestampMs: t, landmarkName: 'leftHip', x: 200, y: 150, confidence: 0.95, phase: phases[i] },
    { repetitionNumber: 1, timestampMs: t, landmarkName: 'leftKnee', x: 210, y: kneeY, confidence: 0.93, phase: phases[i] },
    { repetitionNumber: 1, timestampMs: t, landmarkName: 'leftAnkle', x: 220, y: 420, confidence: 0.9, phase: phases[i] }
  );
});

const sessionBody = {
  programExerciseId: 1, // Sit-to-Stand, patient's own program (verified earlier this session)
  sessionDate: new Date().toISOString().slice(0, 10),
  status: 'VALID',
  confidence: 0.91,
  pain: 3,
  discomfort: 2,
  difficulty: 5,
  injuryNote: '',
  overallScore: 82.5,
  repetitions: [
    {
      repetitionNumber: 1,
      metrics: [
        { metricName: 'rom_deg', value: 108, expectedValue: 120, status: 'FLAGGED' },
        { metricName: 'tempo_sec', value: 2.4, expectedValue: 2.0, status: 'OK' },
        { metricName: 'control_max_jerk_deg', value: 14, expectedValue: 25, status: 'OK' },
        { metricName: 'compensation_trunk_lean_deg', value: 12, expectedValue: 30, status: 'OK' },
      ],
    },
    {
      repetitionNumber: 2,
      metrics: [
        { metricName: 'rom_deg', value: 118, expectedValue: 120, status: 'OK' },
        { metricName: 'tempo_sec', value: 2.1, expectedValue: 2.0, status: 'OK' },
        { metricName: 'control_max_jerk_deg', value: 11, expectedValue: 25, status: 'OK' },
        { metricName: 'compensation_trunk_lean_deg', value: 9, expectedValue: 30, status: 'OK' },
      ],
    },
  ],
  landmarkPoints,
};

const result = await req('POST', '/sessions', patientToken, sessionBody);
console.log('Created rich demo session:', result);
