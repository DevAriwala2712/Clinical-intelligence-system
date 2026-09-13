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
  listPatients: (token) => request('GET', '/patients', token),
  listExercises: (token) => request('GET', '/exercises', token),
  listPathways: (token) => request('GET', '/pathways', token),
  createProgram: (token, body) => request('POST', '/programs', token, body),
  getMyPrograms: (token) => request('GET', '/programs/mine', token),
  getProgramExercises: (token, programId) => request('GET', `/programs/${programId}/exercises`, token),
  getPatientSessions: (token, patientId) => request('GET', `/patients/${patientId}/sessions`, token),
  getSessionEvidence: (token, sessionId) => request('GET', `/sessions/${sessionId}/evidence`, token),
  reviewSession: (token, sessionId, body) => request('PUT', `/sessions/${sessionId}/review`, token, body),
  listPendingSuggestions: (token) => request('GET', '/progression-suggestions/pending', token),
  approveSuggestion: (token, id, body) => request('POST', `/progression-suggestions/${id}/approve`, token, body),
  rejectSuggestion: (token, id) => request('POST', `/progression-suggestions/${id}/reject`, token, {}),
};

// --- Small pure helpers used by the UI to explain the numbers it shows ---
// (Deliberately duplicated from the same weighting idea used in
// patient_app/lib/rehab/quality_scorer.dart, kept simple and explainable.)

/** Weight used to describe a metric's contribution to the overall score,
 *  when the exercise's own criteria weights aren't loaded for this view. */
export const METRIC_LABELS = {
  rom_deg: 'Range of Motion',
  tempo_sec: 'Tempo',
  tempo_min_sec: 'Tempo (min)',
  tempo_max_sec: 'Tempo (max)',
  control_max_jerk_deg: 'Control',
  compensation_trunk_lean_deg: 'Compensation (trunk lean)',
  symmetry_max_diff_deg: 'Symmetry',
  confidence_min: 'Confidence threshold',
};

export function metricLabel(name) {
  return METRIC_LABELS[name] || name;
}
