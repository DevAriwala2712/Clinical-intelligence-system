# Clinician-Calibrated Rehabilitation System — Build Log

This is being built in phases. **What exists right now (Phase 1-15 of the plan):**

- Full MySQL schema (`backend/sql/schema.sql`)
- Full local SQLite schema for the patient app (`patient_app/lib/db/schema.dart`)
- Backend: Express + TypeScript API with auth, program assignment, session
  upload/review, and the progression suggest/approve/reject workflow
  (`backend/src/`)
- Core on-device movement-analysis math, already verified against known
  test cases before being written into Dart (`patient_app/lib/rehab/`):
  - `geometry.dart` — the joint-angle formula
  - `confidence.dart` — landmark confidence checking and abstention
  - `movement_state_machine.dart` — phase/repetition detection + smoothing
  - `quality_scorer.dart` — ROM/tempo/control/symmetry/compensation scoring
  - `exercise_definitions.dart` — the 5 supported exercises with real
    Google ML Kit landmark names and clinician-configurable criteria

**Not yet built (coming in the next phases):** camera integration + ML Kit
pose wiring, the actual Flutter UI screens (patient + clinician web
dashboard), the sync engine, unit tests, and the documentation set
(ARCHITECTURE.md, POSE_ANALYSIS.md, VIVA_GUIDE.md, etc.).

## Why nothing here has been run yet

My build environment has no internet access, so I cannot `npm install` or
`flutter pub get`, and it has no camera or Flutter SDK, so I cannot launch
an emulator. Every file above is real, complete source — not a stub — but
you need to run the install/verify steps below yourself on your own
machine before the viva.

**What I DID verify without needing any package installs:** the joint-angle
formula and the repetition state machine were both implemented first in
plain Python in a sandbox, checked against known test cases (a straight
line = 180°, the spec's own example angle sequence correctly produces 1
repetition), and only then translated line-for-line into the Dart files
above. The weighted quality-score formula was also checked against the
spec's own worked example (85/90/80/95 at weights .4/.2/.2/.2 → 87.0,
exactly matching Section 33's example).

## Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your real MySQL password and a random JWT_SECRET

npm install

# create the database and tables
mysql -u root -p < sql/schema.sql

# populate demo accounts + the 5-exercise catalog
npm run seed

# start the dev server (auto-restarts on file changes)
npm run dev
```

Then check it's alive:

```bash
curl http://localhost:4000/health
# {"status":"ok"}

curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clinician@demo.com","password":"DemoPass123"}'
# should return a JWT token
```

## Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Clinician | clinician@demo.com | DemoPass123 |
| Patient | patient@demo.com | DemoPass123 |

These are clearly-labeled demo records, not real patient data.
