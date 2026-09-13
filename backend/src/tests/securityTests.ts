// backend/src/tests/securityTests.ts
//
// WHAT: integration tests for the cross-tenant ownership bugs found during
// the pre-implementation audit, plus the input-validation and
// approve/modify-status fixes that ride along with them.
// WHY these are INTEGRATION tests (not unit tests with a mocked pool): the
// bugs are specifically about how a controller's req.user interacts with
// REAL foreign-key relationships in the database. A mocked database would
// have to fake exactly the relationship we're testing, which would hide
// the bug instead of catching it.
// PRECONDITION: the backend dev server must already be running
// (`npm run dev`, port 4000) against the seeded MySQL database.

import { assertEqual, printSummaryAndExit } from './testHelpers';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

/** Logs in and returns the JWT token string from the response body. */
async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.token;
}

/** Sends an authenticated API request and returns its status + parsed body. */
async function apiRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function runSecurityTests() {
  console.log('Security tests: ownership, validation, and status-correctness fixes\n');

  const clinicianToken = await login('clinician@demo.com', 'DemoPass123');

  // ---- Task 1: reviewSession must reject a session the clinician doesn't own ----
  // Session id 999999 doesn't exist, which also proves we don't leak "not
  // found" vs "not yours" as different responses - both are 403/404, never
  // a successful write.
  const reviewResult = await apiRequest('PUT', '/api/sessions/999999/review', clinicianToken, {
    decision: 'test', correction: null, notes: 'security test',
  });
  assertEqual(reviewResult.status, 403, 'reviewSession rejects a session the clinician does not own');

  // ---- Task 1 (cross-tenant): reviewSession must reject a session that DOES
  // exist but belongs to a DIFFERENT clinician's patient. The 999999 case
  // above only proves rows-affected-by-nonexistent-id is zero, which a
  // broken "existence only" check would also pass - this proves the
  // clinician_id filter itself is doing real work.
  const patientToken = await login('patient@demo.com', 'DemoPass123');
  const uploadResult = await apiRequest('POST', '/api/sessions', patientToken, {
    programExerciseId: 1,
    sessionDate: '2026-01-01',
    status: 'VALID',
    overallScore: 80,
  });
  const realSessionId = uploadResult.body.sessionId;

  const uniqueEmail = `reviewer-test-${Date.now()}@demo.com`;
  const registerResult = await apiRequest('POST', '/api/auth/register', '', {
    name: 'Reviewer Test Clinician',
    email: uniqueEmail,
    password: 'DemoPass123',
    role: 'clinician',
  });
  const otherClinicianToken = registerResult.body.token;

  const crossTenantResult = await apiRequest(
    'PUT',
    `/api/sessions/${realSessionId}/review`,
    otherClinicianToken,
    { decision: 'test', correction: null, notes: 'security test' }
  );
  assertEqual(
    crossTenantResult.status,
    403,
    'reviewSession rejects a real session belonging to a different clinician\'s patient'
  );

  // ---- Task 2: createSuggestion must reject a program the patient doesn't own ----
  // Nonexistent programId (999999) - proves rows-affected-by-nonexistent-id is
  // zero, but a broken "existence only" check with no real ownership logic
  // would also pass this case (see the cross-tenant case below).
  const suggestionResult = await apiRequest('POST', '/api/progression-suggestions', patientToken, {
    programId: 999999, exerciseId: 1, suggestion: 'test', reason: 'security test',
  });
  assertEqual(suggestionResult.status, 403, 'createSuggestion rejects a program the patient does not own');

  // ---- Task 2 (cross-tenant): createSuggestion must reject a program that
  // DOES exist but belongs to a DIFFERENT patient. programId 1 is
  // patient@demo.com's real, existing program - a brand-new second patient
  // must not be able to create a suggestion against it. This proves the
  // ownership filter itself is doing real work, not just an existence check.
  const uniquePatientEmail = `patient2-test-${Date.now()}@demo.com`;
  const patientRegisterResult = await apiRequest('POST', '/api/auth/register', '', {
    name: 'Patient Two',
    email: uniquePatientEmail,
    password: 'DemoPass123',
    role: 'patient',
  });
  const otherPatientToken = patientRegisterResult.body.token;

  const crossTenantSuggestionResult = await apiRequest(
    'POST',
    '/api/progression-suggestions',
    otherPatientToken,
    { programId: 1, exerciseId: 1, suggestion: 'test', reason: 'security test' }
  );
  assertEqual(
    crossTenantSuggestionResult.status,
    403,
    'createSuggestion rejects a real program belonging to a different patient'
  );

  // ---- Task 3: createProgram must not let a different clinician steal a
  // patient who is already assigned to another clinician. Register a
  // brand-new clinician account so this test doesn't depend on a second
  // clinician existing in the seed data.
  const intruderEmail = `intruder-${Date.now()}@demo.com`;
  await apiRequest('POST', '/api/auth/register', '', {
    name: 'Dr. Intruder', email: intruderEmail, password: 'DemoPass123', role: 'clinician',
  });
  const intruderToken = await login(intruderEmail, 'DemoPass123');

  // patient@demo.com is already assigned to clinician@demo.com by the seed
  // data (seed.ts creates a program for them) - so this SHOULD be refused.
  const stealResult = await apiRequest('POST', '/api/programs', intruderToken, {
    patientId: 2, pathwayId: 1, exercises: [{ exerciseId: 1, sets: 3, repetitions: 10, orderNumber: 1 }],
  });
  assertEqual(stealResult.status, 409, 'createProgram refuses to reassign a patient already owned by another clinician');

  // ---- Task 3 (fix round 1): same clinician re-assigning a patient they
  // already own must still succeed - the stealing guard must not block
  // legitimate re-assignment by the SAME clinician who already owns the patient.
  const legitimateReassignResult = await apiRequest('POST', '/api/programs', clinicianToken, {
    patientId: 2, pathwayId: 1, exercises: [{ exerciseId: 1, sets: 3, repetitions: 10, orderNumber: 1 }],
  });
  assertEqual(legitimateReassignResult.status, 201, 'createProgram allows the same clinician to re-assign a patient they already own');

  // ---- Task 4: approveSuggestion must write MODIFIED when the clinician
  // changes sets/repetitions away from what's currently assigned, and
  // APPROVED when they don't. ----
  const myProgramsResult = await apiRequest('GET', '/api/programs/mine', patientToken);
  const patientProgramId = myProgramsResult.body[0]?.id;
  const programExercisesResult = await apiRequest(
    'GET', `/api/programs/${patientProgramId}/exercises`, patientToken
  );
  const firstExercise = programExercisesResult.body[0];

  // 4a. Approve with NO changes -> should stay APPROVED.
  const suggestion1 = await apiRequest('POST', '/api/progression-suggestions', patientToken, {
    programId: patientProgramId, exerciseId: firstExercise.exercise_id,
    suggestion: 'Keep current sets/reps', reason: 'security test - no change',
  });
  const approve1 = await apiRequest(
    'POST', `/api/progression-suggestions/${suggestion1.body.suggestionId}/approve`, clinicianToken, {}
  );
  assertEqual(approve1.body.status, 'APPROVED', 'approving a suggestion with unchanged sets/reps stays APPROVED');

  // 4b. Approve WITH a changed rep count -> should become MODIFIED.
  const suggestion2 = await apiRequest('POST', '/api/progression-suggestions', patientToken, {
    programId: patientProgramId, exerciseId: firstExercise.exercise_id,
    suggestion: 'Increase repetitions', reason: 'security test - changed value',
  });
  const approve2 = await apiRequest(
    'POST', `/api/progression-suggestions/${suggestion2.body.suggestionId}/approve`, clinicianToken,
    { newRepetitions: firstExercise.repetitions + 5 }
  );
  assertEqual(approve2.body.status, 'MODIFIED', 'approving a suggestion with a changed repetition count becomes MODIFIED');

  // ---- Task 5: uploadSession must validate pain/discomfort/difficulty
  // ranges and overallScore bounds, before it ever looks at ownership. ----
  const badPainResult = await apiRequest('POST', '/api/sessions', patientToken, {
    programExerciseId: 1, sessionDate: '2026-01-01', status: 'VALID', pain: 15, overallScore: 80,
  });
  assertEqual(badPainResult.status, 400, 'uploadSession rejects a pain rating above 10');

  const badScoreResult = await apiRequest('POST', '/api/sessions', patientToken, {
    programExerciseId: 1, sessionDate: '2026-01-01', status: 'VALID', overallScore: 250,
  });
  assertEqual(badScoreResult.status, 400, 'uploadSession rejects an overallScore above 100');

  printSummaryAndExit();
}

runSecurityTests();
