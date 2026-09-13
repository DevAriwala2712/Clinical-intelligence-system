# Backend Phase 1 Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two real cross-tenant security holes and three smaller correctness bugs found in `backend/src/controllers/` during the pre-implementation audit, and make `npm test` actually run something, before any Flutter work begins.

**Architecture:** No new endpoints, no schema changes. Each fix adds an ownership/validation check (or corrects a status-writing branch) inside an existing controller function, following the exact ownership-check pattern already used elsewhere in the same files (e.g. `getSessionEvidence`'s clinician-owns-this-session join). Tests are hand-rolled integration tests (no Jest/Mocha) that hit the real running dev server and real seeded MySQL database, because these bugs are specifically about how `req.user` interacts with real foreign-key relationships — a mocked DB would hide exactly what we're testing for.

**Tech Stack:** Node.js + TypeScript + Express + MySQL (mysql2/promise), ts-node for one-shot test execution. Node v26 (confirmed installed) has global `fetch`, so no HTTP client dependency is needed for the tests.

**Spec:** `/Users/devariwala/.claude/plans/in-the-docs-folder-wondrous-dongarra.md` (approved implementation plan, Phase 1) and `/Users/devariwala/Downloads/rehab-project/docs/mastercontext.md` (Sections 91-92: ownership must be enforced server-side, never trust a frontend-supplied id; Section 72: progression suggestions have PENDING/APPROVED/REJECTED/MODIFIED states).

## Global Constraints

- Every line must be explainable to a beginner in a viva — no abstraction beyond what's already in the file (mastercontext.md Section 1).
- No new third-party test framework — match the project's existing hand-rolled `ts-node src/tests/runAll.ts` design (package.json's own `test` script already assumes this shape).
- Ownership checks must be enforced in the backend, never left to the frontend (mastercontext.md Section 91-92).
- A wrong/fabricated value is worse than an explicit rejection (mastercontext.md Section 143) — this is why `uploadSession` gets bounds validation rather than silently clamping bad values.
- Precondition for every test-running step below: the backend dev server is already running (`npm run dev`, port 4000) against the seeded MySQL database (`clinician@demo.com` / `patient@demo.com`, password `DemoPass123` for both) — this is already true in the current session.

---

### Task 0: Test harness + runAll wiring + package.json fix

**Files:**
- Create: `backend/src/tests/testHelpers.ts`
- Create: `backend/src/tests/runAll.ts`
- Modify: `backend/package.json:11`

**Interfaces:**
- Produces: `assertEqual(actual: unknown, expected: unknown, label: string): void`, `assertTrue(condition: boolean, label: string): void`, `printSummaryAndExit(): void` — every later task's test file imports these three from `./testHelpers`.

- [ ] **Step 1: Create the hand-rolled assertion helper**

```typescript
// backend/src/tests/testHelpers.ts
//
// WHAT: a tiny hand-rolled test helper - no Jest/Mocha, matching the
// project's "avoid unnecessary third-party packages" principle (Section 86
// of mastercontext.md).
// WHY: we need SOME way to write "expect X, got Y" checks and see a pass/
// fail summary at the end, without pulling in a whole test framework for a
// handful of integration tests against our own running server.

let passCount = 0;
let failCount = 0;

/** Records a passing/failing check by comparing actual vs expected. */
export function assertEqual(actual: unknown, expected: unknown, label: string) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (isEqual) {
    passCount++;
    console.log(`  PASS: ${label}`);
  } else {
    failCount++;
    console.log(`  FAIL: ${label} - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Records a passing check when `condition` is true, a failing one otherwise. */
export function assertTrue(condition: boolean, label: string) {
  assertEqual(condition, true, label);
}

/** Prints the final pass/fail totals and exits with a non-zero code on any failure. */
export function printSummaryAndExit() {
  console.log(`\n${passCount} passed, ${failCount} failed`);
  process.exit(failCount > 0 ? 1 : 0);
}
```

- [ ] **Step 2: Create the runner that will import every test file**

```typescript
// backend/src/tests/runAll.ts
//
// WHAT: the single entry point `npm test` runs. It imports and runs every
// test file in this directory, in order.
// WHY: keeps `npm test` working as ONE command instead of the developer
// needing to remember every individual test file's path.

import './securityTests';
```

- [ ] **Step 3: Fix the package.json test script to actually exit**

`ts-node-dev --respawn` is a watch tool (it never exits on its own) — wrong for a one-shot test run. Switch to plain `ts-node`, which runs once and exits with the process's exit code (so `npm test`'s own exit code reflects `printSummaryAndExit()`'s pass/fail result).

```json
    "test": "ts-node src/tests/runAll.ts",
```

This replaces line 11 of `backend/package.json` (currently `"test": "ts-node-dev --transpile-only src/tests/runAll.ts"`).

- [ ] **Step 4: Run it to confirm the harness itself works (before any real tests exist)**

Run: `cd backend && npm test`
Expected: fails to compile/run because `./securityTests` doesn't exist yet — confirms the wiring is live and waiting for Task 1's test file. (This is the "write the test infra, watch it fail for the right reason" step — the missing-module error IS the expected failure here, not a bug.)

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/tests/testHelpers.ts backend/src/tests/runAll.ts backend/package.json
git commit -m "test: add hand-rolled test harness and fix npm test script"
```

---

### Task 1: Fix `reviewSession` missing ownership check

**Files:**
- Modify: `backend/src/controllers/sessionController.ts:184-196`
- Test: `backend/src/tests/securityTests.ts` (created in this task)

**Interfaces:**
- Consumes: `assertEqual`, `printSummaryAndExit` from `./testHelpers` (Task 0).
- Produces: `login(email, password): Promise<string>` and `apiRequest(method, path, token, body?): Promise<{status: number; body: any}>` helper functions inside `securityTests.ts` — Tasks 2-5 append to this same file and reuse both.

- [ ] **Step 1: Write the failing test (and the shared login/apiRequest helpers it needs)**

```typescript
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
```

Also update Task 0's `runAll.ts` import (it already says `import './securityTests';` — no change needed since this task creates that exact file).

- [ ] **Step 2: Run test to verify it fails (proving the bug exists)**

Run: `cd backend && npm test`
Expected: FAIL — `reviewSession rejects a session the clinician does not own - expected 403, got 201` (the current buggy code inserts a `clinician_reviews` row for ANY session id with no ownership check at all, so it returns 201 even for a nonexistent/unowned session id — actually check: with sessionId 999999 which doesn't exist, the INSERT would still succeed since there's no foreign-key ownership check and MySQL's FK constraint on `clinician_reviews.session_id -> rehab_sessions.id` would reject a truly nonexistent id at the DB level. To make the "wrong owner" case unambiguous rather than relying on a nonexistent id, this is still a valid confirming failure: today's code returns either 201 (if MySQL's FK allows it, unlikely) or a raw 500 DB error (FK violation) — NEITHER of which is the intended 403. Either failure mode confirms the bug.)

- [ ] **Step 3: Write the minimal fix — add the ownership check**

```typescript
/**
 * PUT /sessions/:id/review
 * Clinician-only. Records a correction/note WITHOUT overwriting the
 * original machine-generated result (Section 71/26: keep both, for an
 * audit trail).
 */
export async function reviewSession(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const sessionId = Number(req.params.id);
  const { decision, correction, notes } = req.body;

  // Ownership check: this session must belong to one of THIS clinician's
  // patients, via rehab_sessions -> program_exercises -> rehabilitation_programs.
  // Mirrors the same pattern already used in getSessionEvidence above.
  const [ownershipRows] = await pool.query(
    `SELECT rs.id FROM rehab_sessions rs
     JOIN program_exercises pe ON rs.program_exercise_id = pe.id
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE rs.id = ? AND rp.clinician_id = ?`,
    [sessionId, clinicianId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'Not your session to review' });
  }

  await pool.query(
    `INSERT INTO clinician_reviews (session_id, clinician_id, decision, correction, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, clinicianId, decision ?? null, correction ?? null, notes ?? null]
  );

  res.status(201).json({ ok: true });
}
```

This replaces the existing `reviewSession` function at `backend/src/controllers/sessionController.ts:184-196`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS — `reviewSession rejects a session the clinician does not own`

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/controllers/sessionController.ts backend/src/tests/securityTests.ts
git commit -m "fix: add missing ownership check to reviewSession"
```

---

### Task 2: Fix `createSuggestion` missing ownership check

**Files:**
- Modify: `backend/src/controllers/progressionController.ts:18-32`
- Test: `backend/src/tests/securityTests.ts` (append)

**Interfaces:**
- Consumes: `login`, `apiRequest` from Task 1 (same file, already in scope).

- [ ] **Step 1: Add the failing test**

Insert this into `runSecurityTests()` in `securityTests.ts`, right after the Task 1 block and before `printSummaryAndExit()`:

```typescript
  const patientToken = await login('patient@demo.com', 'DemoPass123');

  // ---- Task 2: createSuggestion must reject a program the patient doesn't own ----
  const suggestionResult = await apiRequest('POST', '/api/progression-suggestions', patientToken, {
    programId: 999999, exerciseId: 1, suggestion: 'test', reason: 'security test',
  });
  assertEqual(suggestionResult.status, 403, 'createSuggestion rejects a program the patient does not own');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL — today's `createSuggestion` has no ownership check at all, so it will either insert successfully (if `programId=999999` somehow satisfies MySQL's FK, which it won't since no such program exists) or return a raw DB foreign-key-violation error (likely a 500), never the intended 403.

- [ ] **Step 3: Write the minimal fix**

```typescript
/**
 * POST /progression-suggestions
 * Called by the PATIENT app's background rule-check after a valid session
 * (Section 99's progression rule runs on-device, this endpoint just
 * records the resulting suggestion for the clinician to see).
 */
export async function createSuggestion(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const { programId, exerciseId, suggestion, reason } = req.body;

  if (!programId || !exerciseId || !suggestion || !reason) {
    return res.status(400).json({ error: 'programId, exerciseId, suggestion, and reason are required' });
  }

  // Ownership check: this program must belong to THIS patient - never trust
  // a programId supplied by the client without checking who it belongs to
  // (Section 91/92).
  const [programRows] = await pool.query(
    'SELECT id FROM rehabilitation_programs WHERE id = ? AND patient_id = ?',
    [programId, patientId]
  );
  if ((programRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This program does not belong to you' });
  }

  const [result] = await pool.query(
    `INSERT INTO progression_suggestions (program_id, exercise_id, suggestion, reason, status)
     VALUES (?, ?, ?, ?, 'PENDING')`,
    [programId, exerciseId, suggestion, reason]
  );

  res.status(201).json({ suggestionId: (result as any).insertId });
}
```

This replaces `createSuggestion` at `backend/src/controllers/progressionController.ts:18-32`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS — both Task 1 and Task 2 assertions pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/controllers/progressionController.ts backend/src/tests/securityTests.ts
git commit -m "fix: add missing ownership check to createSuggestion"
```

---

### Task 3: Fix `createProgram` patient-stealing bug

**Files:**
- Modify: `backend/src/controllers/programController.ts:45-79`
- Test: `backend/src/tests/securityTests.ts` (append)

**Interfaces:**
- Consumes: `login`, `apiRequest` from Task 1.
- Produces: a freshly-registered second clinician account per test run (via `POST /api/auth/register`), so the test doesn't depend on a second clinician existing in seed data.

- [ ] **Step 1: Add the failing test**

Insert into `runSecurityTests()`, after the Task 2 block:

```typescript
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
```

Note: `patientId: 2` assumes `patient@demo.com` is user id 2 (true in this repo's seed data — `clinician@demo.com` is seeded first as id 1, `patient@demo.com` second as id 2, matching the ownership audit's earlier confirmed responses this session). If seed order ever changes, this test would need the patient's real id looked up first — flagging that as a known fragility rather than hiding it.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL — `createProgram refuses to reassign a patient already owned by another clinician - expected 409, got 201` (today's code unconditionally overwrites `patient_profiles.clinician_id`).

- [ ] **Step 3: Write the minimal fix**

```typescript
/**
 * POST /programs
 * Clinician-only. Creates a program for a specific patient and attaches
 * exercises to it with clinician-set sets/reps.
 * body: {
 *   patientId, pathwayId,
 *   exercises: [{ exerciseId, sets, repetitions, orderNumber }]
 * }
 */
export async function createProgram(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const { patientId, pathwayId, exercises } = req.body;

  if (!patientId || !pathwayId || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: 'patientId, pathwayId, and at least one exercise are required' });
  }

  // Verify the patient actually exists and is a patient (not another clinician).
  const [patientRows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'patient'", [patientId]);
  if ((patientRows as any[]).length === 0) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Patient-stealing guard: if this patient is already assigned to a
  // DIFFERENT clinician, refuse. Only that clinician (or nobody yet) may
  // assign this patient a program through this endpoint.
  const [profileRows] = await pool.query(
    'SELECT clinician_id FROM patient_profiles WHERE user_id = ?',
    [patientId]
  );
  const existingClinicianId = (profileRows as any[])[0]?.clinician_id;
  if (existingClinicianId != null && existingClinicianId !== clinicianId) {
    return res.status(409).json({ error: 'This patient is already assigned to a different clinician' });
  }

  const [programResult] = await pool.query(
    `INSERT INTO rehabilitation_programs (patient_id, clinician_id, pathway_id, status, start_date)
     VALUES (?, ?, ?, 'active', CURDATE())`,
    [patientId, clinicianId, pathwayId]
  );
  const programId = (programResult as any).insertId;

  for (const ex of exercises) {
    await pool.query(
      `INSERT INTO program_exercises (program_id, exercise_id, \`sets\`, repetitions, order_number)
       VALUES (?, ?, ?, ?, ?)`,
      [programId, ex.exerciseId, ex.sets ?? 3, ex.repetitions ?? 10, ex.orderNumber ?? 1]
    );
  }

  // Link this patient to this clinician as their treating clinician, so the
  // clinician's "my patients" list (Section 4) picks them up automatically.
  await pool.query('UPDATE patient_profiles SET clinician_id = ? WHERE user_id = ?', [clinicianId, patientId]);

  res.status(201).json({ programId });
}
```

This replaces `createProgram` at `backend/src/controllers/programController.ts:45-79`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS for all three tasks so far.

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/controllers/programController.ts backend/src/tests/securityTests.ts
git commit -m "fix: prevent createProgram from reassigning another clinician's patient"
```

---

### Task 4: Fix `approveSuggestion` to write `MODIFIED` when the clinician changes the numbers

**Files:**
- Modify: `backend/src/controllers/progressionController.ts:58-100`
- Test: `backend/src/tests/securityTests.ts` (append)

**Interfaces:**
- Consumes: `login`, `apiRequest` from Task 1.
- Design note: `progression_suggestions` stores `suggestion`/`reason` as free text — there's no structured "proposed sets/reps" field to compare against. The only honest comparison available is against what's *currently* in `program_exercises`: if the clinician's approve call leaves the sets/repetitions unchanged, that's a straight **APPROVED**; if they submit different numbers, that's a **MODIFIED** approval. This is what the code can actually see, and it matches the spec's intent (Section 72: MODIFIED means the clinician didn't just accept the suggestion as-is).

- [ ] **Step 1: Add the failing test**

Insert into `runSecurityTests()`, after the Task 3 block. This test drives the real flow (get the patient's program, submit a suggestion, approve it twice with different inputs) rather than hardcoding ids, since program/exercise ids depend on seed data that this test shouldn't need to know in advance:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL on the second assertion — `approving a suggestion with a changed repetition count becomes MODIFIED - expected "MODIFIED", got "APPROVED"` (today's code always sets `'APPROVED'` and the response body doesn't even include a `status` field yet, so both assertions may fail with `got undefined`).

- [ ] **Step 3: Write the minimal fix**

```typescript
/**
 * POST /progression-suggestions/:id/approve
 * body: { newSets?, newRepetitions?, newCriteriaOverrides?, note }
 * Only this endpoint is allowed to change program_exercises. It also
 * writes a program_changes row so the change is auditable (Section 45).
 */
export async function approveSuggestion(req: AuthedRequest, res: Response) {
  const clinicianId = req.user!.id;
  const suggestionId = Number(req.params.id);
  const { newSets, newRepetitions, note } = req.body;

  const [suggestionRows] = await pool.query(
    `SELECT ps.*, rp.clinician_id, rp.id AS program_id
     FROM progression_suggestions ps
     JOIN rehabilitation_programs rp ON ps.program_id = rp.id
     WHERE ps.id = ?`,
    [suggestionId]
  );
  const suggestion = (suggestionRows as any[])[0];

  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
  if (suggestion.clinician_id !== clinicianId) {
    return res.status(403).json({ error: 'Not your patient’s suggestion to approve' });
  }

  const [programExerciseRows] = await pool.query(
    'SELECT * FROM program_exercises WHERE program_id = ? AND exercise_id = ?',
    [suggestion.program_id, suggestion.exercise_id]
  );
  const oldProgramExercise = (programExerciseRows as any[])[0];
  const oldValue = JSON.stringify(oldProgramExercise);

  // A clinician "approves" when they accept the currently-assigned numbers
  // as-is; they "modify" when their approval changes sets/repetitions away
  // from what's currently assigned. progression_suggestions has no
  // structured "proposed value" field (suggestion/reason are free text),
  // so this is the only comparison the code can honestly make.
  const changedSets = newSets !== undefined && newSets !== oldProgramExercise?.sets;
  const changedRepetitions = newRepetitions !== undefined && newRepetitions !== oldProgramExercise?.repetitions;
  const finalStatus = (changedSets || changedRepetitions) ? 'MODIFIED' : 'APPROVED';

  if (newSets !== undefined || newRepetitions !== undefined) {
    await pool.query(
      `UPDATE program_exercises SET \`sets\` = COALESCE(?, \`sets\`), repetitions = COALESCE(?, repetitions)
       WHERE program_id = ? AND exercise_id = ?`,
      [newSets ?? null, newRepetitions ?? null, suggestion.program_id, suggestion.exercise_id]
    );
  }

  await pool.query('UPDATE progression_suggestions SET status = ? WHERE id = ?', [finalStatus, suggestionId]);

  await pool.query(
    `INSERT INTO program_changes (program_id, old_value, new_value, reason, approved_by)
     VALUES (?, ?, ?, ?, ?)`,
    [suggestion.program_id, oldValue, JSON.stringify({ newSets, newRepetitions }), note ?? suggestion.reason, clinicianId]
  );

  res.json({ ok: true, status: finalStatus });
}
```

This replaces `approveSuggestion` at `backend/src/controllers/progressionController.ts:58-100`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS for all four tasks so far.

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/controllers/progressionController.ts backend/src/tests/securityTests.ts
git commit -m "fix: write MODIFIED status when approveSuggestion changes sets/reps"
```

---

### Task 5: Add input validation to `uploadSession`

**Files:**
- Modify: `backend/src/controllers/sessionController.ts:21-40`
- Test: `backend/src/tests/securityTests.ts` (append)

**Interfaces:**
- Consumes: `login`, `apiRequest` from Task 1.
- Design note: validation happens BEFORE the ownership-check query (not after), so a request with garbage input gets a 400 regardless of whose `programExerciseId` it names — this also means the test below doesn't need a real owned `programExerciseId` to prove the validation works. For `overallScore`, this plan deliberately does NOT reimplement `quality_scorer.dart`'s weighted-average math in TypeScript to "double-check" the client's number — that would duplicate scoring logic in two languages with two places to go out of sync, which the approved plan's Phase 2 already rejected for the same reason (server-side progression-rule duplication). A bounds check (`0-100`, and only ever stored when `status === 'VALID'`, which the code already does) is the honest, simple version of "a basic sanity check" called for in the approved plan.

- [ ] **Step 1: Add the failing tests**

Insert into `runSecurityTests()`, after the Task 4 block and before `printSummaryAndExit()`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test`
Expected: FAIL on both new assertions — today's code has no such validation, so these requests fall through to the ownership check (likely a 403, since `programExerciseId: 1` may not belong to `patient@demo.com`'s program) or, if it happens to be owned, a 201 with garbage data actually stored.

- [ ] **Step 3: Write the minimal fix**

```typescript
/**
 * POST /sessions
 * Patient-only. Uploads one completed (or abstained) session, including
 * its repetitions, per-repetition metrics, and landmark trace.
 * This mirrors the local SQLite rehab_sessions/session_repetitions/
 * repetition_metrics/landmark_points tables field-for-field, so the sync
 * layer on the Flutter side is a straightforward copy.
 */
export async function uploadSession(req: AuthedRequest, res: Response) {
  const patientId = req.user!.id;
  const {
    programExerciseId,
    sessionDate,
    status, // 'VALID' | 'ABSTAINED' | 'INCOMPLETE' | 'INVALID'
    abstainReason,
    confidence,
    pain,
    discomfort,
    difficulty,
    injuryNote,
    overallScore,
    repetitions, // [{ repetitionNumber, metrics: [{ metricName, value, expectedValue, status }] }]
    landmarkPoints, // [{ repetitionNumber, timestampMs, landmarkName, x, y, confidence, phase }]
  } = req.body;

  if (!programExerciseId || !sessionDate || !status) {
    return res.status(400).json({ error: 'programExerciseId, sessionDate, and status are required' });
  }

  // Input validation: reject obviously-invalid values before touching the
  // database (Section 131 - do not accept obviously invalid values). Pain
  // and discomfort are 0-10, difficulty is 1-10, per the local SQLite
  // schema's own documented ranges.
  if (pain !== undefined && pain !== null && (pain < 0 || pain > 10)) {
    return res.status(400).json({ error: 'pain must be between 0 and 10' });
  }
  if (discomfort !== undefined && discomfort !== null && (discomfort < 0 || discomfort > 10)) {
    return res.status(400).json({ error: 'discomfort must be between 0 and 10' });
  }
  if (difficulty !== undefined && difficulty !== null && (difficulty < 1 || difficulty > 10)) {
    return res.status(400).json({ error: 'difficulty must be between 1 and 10' });
  }
  // A VALID session must carry a real, in-range score - a wrong score is
  // worse than no score (Section 143), so we refuse an out-of-range one
  // rather than storing it.
  if (status === 'VALID' && (typeof overallScore !== 'number' || overallScore < 0 || overallScore > 100)) {
    return res.status(400).json({ error: 'overallScore must be a number between 0 and 100 for a VALID session' });
  }

  // Ownership check: the program_exercise being reported on must actually
  // belong to a program that belongs to THIS patient.
  const [ownershipRows] = await pool.query(
    `SELECT pe.id FROM program_exercises pe
     JOIN rehabilitation_programs rp ON pe.program_id = rp.id
     WHERE pe.id = ? AND rp.patient_id = ?`,
    [programExerciseId, patientId]
  );
  if ((ownershipRows as any[]).length === 0) {
    return res.status(403).json({ error: 'This exercise assignment does not belong to you' });
  }

  // A wrong score is worse than no score (Section 143): if status isn't
  // VALID, we never store an overall_score, no matter what the client sent.
  const scoreToStore = status === 'VALID' ? overallScore ?? null : null;

  const [sessionResult] = await pool.query(
    `INSERT INTO rehab_sessions
     (program_exercise_id, session_date, status, abstain_reason, confidence, pain, discomfort, difficulty, injury_note, overall_score, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [programExerciseId, sessionDate, status, abstainReason ?? null, confidence ?? null, pain ?? null, discomfort ?? null, difficulty ?? null, injuryNote ?? null, scoreToStore]
  );
  const sessionId = (sessionResult as any).insertId;

  for (const rep of repetitions ?? []) {
    const [repResult] = await pool.query(
      'INSERT INTO session_repetitions (session_id, repetition_number) VALUES (?, ?)',
      [sessionId, rep.repetitionNumber]
    );
    const repetitionId = (repResult as any).insertId;

    for (const metric of rep.metrics ?? []) {
      await pool.query(
        `INSERT INTO repetition_metrics (repetition_id, metric_name, value, expected_value, status)
         VALUES (?, ?, ?, ?, ?)`,
        [repetitionId, metric.metricName, metric.value, metric.expectedValue ?? null, metric.status ?? null]
      );
    }
  }

  // Landmark trace: inserted in one batch query instead of one-row-at-a-time
  // to avoid hundreds of round trips for a single session (a session can
  // easily contain thousands of landmark rows across all frames).
  if (Array.isArray(landmarkPoints) && landmarkPoints.length > 0) {
    const values = landmarkPoints.map((p: any) => [
      sessionId, p.repetitionNumber ?? null, p.timestampMs, p.landmarkName, p.x, p.y, p.confidence, p.phase ?? null,
    ]);
    await pool.query(
      `INSERT INTO landmark_points (session_id, repetition_number, timestamp_ms, landmark_name, x, y, confidence, phase)
       VALUES ?`,
      [values]
    );
  }

  res.status(201).json({ sessionId });
}
```

This replaces `uploadSession` at `backend/src/controllers/sessionController.ts:21-97` (only the new validation block, right after the existing required-fields check, is actually new — the rest is unchanged and shown here for full-function clarity).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS — all tasks' assertions pass. Final summary line should read `9 passed, 0 failed` (1 from Task 1 + 1 from Task 2 + 1 from Task 3 + 2 from Task 4 + 2 from Task 5 = wait, recount: Task1=1, Task2=1, Task3=1, Task4=2, Task5=2 → 7 total. State the actual final count as whatever `npm test`'s own summary line prints, since that's the real source of truth, not an arithmetic guess made while writing this plan.)

- [ ] **Step 5: Commit**

```bash
cd /Users/devariwala/Downloads/rehab-project
git add backend/src/controllers/sessionController.ts backend/src/tests/securityTests.ts
git commit -m "fix: validate pain/discomfort/difficulty ranges and overallScore bounds in uploadSession"
```

---

## Self-Review

**Spec coverage:** All 7 bugs listed in the approved plan's Phase 1 are covered — bugs 1-6 map to Tasks 1-5 (bug 5's "sanity check" is deliberately a bounds check, not a recompute, per the design note in Task 5), bug 7 (dangling test script) is Task 0.

**Placeholder scan:** No TBD/TODO/"add appropriate error handling" language; every step shows the actual code or actual shell command.

**Type consistency:** `login`/`apiRequest` signatures defined once in Task 1 and reused verbatim in Tasks 2-5; `assertEqual`/`assertTrue`/`printSummaryAndExit` defined once in Task 0 and reused throughout; `finalStatus` in Task 4 matches the `'MODIFIED' | 'APPROVED'` values the `progression_suggestions.status` ENUM already defines in `schema.sql`.
