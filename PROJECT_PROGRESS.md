# Project progress

**Overall: ~35% complete. Backend half-refactored (NOT yet runnable end to end).**

## Audit of the original repo (done)
- Backend: Express+TS+MySQL API existed (auth, programs, sessions, progression) - kept.
- Clinician dashboard: 100% mock (fake login, hardcoded data) - must be rebuilt against the API.
- Patient app: only `lib/rehab/*` math + local schema. No Flutter project, UI or camera.
- Sandbox limits: no Flutter/Dart, no MySQL, no package installs -> only pure TypeScript logic can be executed here.

## Done
- MySQL schema extended + migration `backend/sql/migrations/001_completion.sql`
- Pure logic, unit-tested (88 passing): longitudinal analysis, adherence, progression rules, upload validation/abstention, clinician-correction model (`backend/src/analysis/`)
- New/rewritten controllers: auth, patient, program, progress; services: program, analysis, progression
- API contract: `docs/API.md`

## Pending (in order)
1. Rewrite session + progression controllers, wire `routes/index.ts` + `server.ts`, seed, integration tests
2. Dart movement engine (spec, capture-quality, analyzer, threshold vs temporal) + evaluation harness
3. Clinician dashboard (React, plain CSS) connected to API
4. Flutter patient app (login, programme, camera + ML Kit, feedback, progress)
5. Docs: README, ARCHITECTURE, POSE_ANALYSIS, DATA_FLOW, PRIVACY_AND_CONSENT, EVALUATION, VIVA_GUIDE

## Tests
- `cd backend && npx ts-node --transpile-only src/tests/unitTests.ts` -> 88 passed, 0 failed
- Integration tests need MySQL + running server: not runnable in this sandbox.

## GitHub / backups
See DEVELOPMENT_LOG.md. Next exact task: session + progression controllers and route wiring.
