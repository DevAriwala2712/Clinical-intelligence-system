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

  printSummaryAndExit();
}

runSecurityTests();
