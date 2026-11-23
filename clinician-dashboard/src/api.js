const BASE_URL = 'http://localhost:4000/api';

async function request(method, path, token, body) {
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
