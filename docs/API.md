# API reference

Base URL: `http://localhost:4000/api`. JSON in, JSON out, **camelCase** everywhere.
Authenticated routes need `Authorization: Bearer <jwt>`. Errors are always
`{ "error": "human readable message" }` with status 400 (validation), 401 (no/invalid token),
403 (wrong role or not your record), 404, 409 (conflict).

Roles: `patient`, `clinician`. A clinician can only see/modify patients assigned to them; a patient
can only see/modify their own data. This is enforced in the controllers, not the UI.

## Vocabulary shared by backend, dashboard and patient app

**Session status** (`rehab_sessions.status`) - the app must never show a score unless it is `VALID` or `PARTIAL`:

| status | meaning | score? | patient-facing message |
|---|---|---|---|
| `VALID` | assessed successfully | yes | "Assessed" |
| `PARTIAL` | reliable, but some metrics could not be assessed (`unassessedMetrics`) | yes (assessed metrics only) | "Partly assessed" |
| `LOW_CONFIDENCE` | tracking too unreliable | no | "Not scored - tracking was unreliable" |
| `INVALID` | unusable recording (out of frame, wrong angle, ...) | no | "Not scored - please record again" |
| `UNSUPPORTED` | movement not recognised as the assigned exercise / no engine support | no | "Not scored - movement not supported" |
| `INCOMPLETE` | no complete repetition captured | no | "Not scored - no full repetition" |
| `ABSTAINED` | legacy generic abstention | no | "Not scored" |

**Metric names** (per repetition): `rom_deg`, `tempo_sec`, `control_max_jerk_deg`, `symmetry_diff_deg`,
`compensation_trunk_lean_deg`. Metric status: `MET`, `BELOW_TARGET`, `ABOVE_TARGET`, `FLAGGED`.

**Criteria metric names** (clinician-configurable, per exercise / per patient): `rom_deg` (target),
`tempo_min_sec`, `tempo_max_sec`, `control_max_jerk_deg`, `symmetry_max_diff_deg`,
`compensation_trunk_lean_deg`, `confidence_min`.

**Error codes**: `insufficient_rom`, `too_fast`, `too_slow`, `jerky_motion`, `trunk_lean`, `asymmetry`,
`incomplete_return`. Severity: `low | medium | high`.

**Pain** 0-10 (integer), **discomfort** 0-10, **difficulty** 1-10.

### Shared object shapes

```jsonc
Criterion = { "metricName": "rom_deg", "targetValue": 100, "minimumValue": null, "maximumValue": null,
              "unit": "degrees", "weight": 0.35, "overridden": false }   // overridden = clinician set this for THIS patient

ProgramExercise = {
  "programExerciseId": 7, "exerciseId": 1, "name": "Sit-to-Stand", "description": "...", "instructions": "...",
  "engineKey": "sit_to_stand",                // which on-device movement spec analyses it (null = unsupported)
  "cameraView": "side",                       // "side" | "front"
  "requiredLandmarks": ["leftHip","leftKnee","leftAnkle"], "phases": ["start_seated","rising","standing","returning","seated"],
  "sets": 3, "repetitions": 10, "orderNumber": 1, "criteria": [Criterion]   // criteria = catalog criteria with this patient's overrides applied
}

ProgramDetail = {
  "id": 3, "patientId": 5, "clinicianId": 2, "clinicianName": "Dr. Demo", "pathwayId": 1,
  "pathwayName": "Knee Mobility Rehabilitation", "status": "active",     // active | completed | paused | discontinued
  "sessionsPerWeek": 3, "startDate": "2026-03-01", "endDate": null, "exercises": [ProgramExercise]
}

AnalysisResult = {                              // longitudinal analysis for ONE exercise
  "status": "OK" | "INSUFFICIENT_DATA",
  "trend": "IMPROVING"|"DETERIORATING"|"INCONSISTENT"|"PLATEAU"|"STABLE"|"STABLE_HIGH"|null,
  "assessedSessionCount": 8, "totalSessionCount": 10, "abstainedSessionCount": 2, "minSessionsRequired": 6,
  "scoreSeries": [{ "date": "ISO", "score": 71.5, "corrected": false }],
  "recentMedian": 84, "earlierMedian": 71, "slopePerSession": 4.08, "residualSd": 0.7, "recentConfidenceMin": 0.86,
  "components": { "rom": { "trend": "IMPROVING"|"DETERIORATING"|"STABLE", "recent": 80, "earlier": 30 } /* rom,tempo,control,symmetry,compensation */ },
  "pain":       { "trend": "RISING"|"FALLING"|"STABLE"|null, "recentMedian": 2, "earlierMedian": 1, "reports": 9 },
  "difficulty": { "trend": "RISING"|"FALLING"|"STABLE"|null, "recentMedian": 4, "earlierMedian": 5, "reports": 9 },
  "painReviewTriggered": false, "correctedSessionCount": 0,
  "explanation": ["plain-language lines explaining the result"], "caveats": ["..."]
}

Progress = {                                    // GET /progress/mine and GET /patients/:id/progress
  "programId": 3 | null, "sessionsPerWeek": 3,
  "adherence": { "windowDays": 14, "expectedDays": 6, "completedDays": 5, "rate": 0.83 | null,   // null = programme too new to judge
                 "weekly": [{ "weekStart": "2026-03-02", "completedDays": 3, "expectedDays": 3 }] },
  "exercises": [{ "exerciseId": 1, "name": "Sit-to-Stand", "analysis": AnalysisResult }],
  "recentSelfReports": [{ "date": "ISO", "exerciseName": "Sit-to-Stand", "pain": 2, "discomfort": 1, "difficulty": 4 }]
}
```

## Auth

| Method & path | Role | Body -> Response |
|---|---|---|
| `POST /auth/register` | public | `{name,email,password(>=8),role,inviteCode?}` -> 201 `{token,user:{id,name,email,role}}`. If the server sets `CLINICIAN_INVITE_CODE`, registering as clinician requires the matching `inviteCode`. |
| `POST /auth/login` | public | `{email,password}` -> `{token,user}` |
| `GET /auth/me` | any | -> `{user:{id,name,email,role}, profile:{age,sex,heightCm,rehabGoal,injuryHistory,videoUploadConsent,videoConsentUpdatedAt}\|null, clinician:{id,name}\|null}` (`profile` and `clinician` are for patients) |

## Patient (self)

| Method & path | Body -> Response |
|---|---|
| `PUT /patients/me/profile` | `{age?,sex?('male'\|'female'\|'other'),heightCm?,rehabGoal?,injuryHistory?}` -> `{ok:true}` |
| `PUT /patients/me/consent` | `{videoUploadConsent:boolean}` -> `{videoUploadConsent,updatedAt}`. Default is `false`. |
| `GET /programs/active` | -> `ProgramDetail` (404 if none) |
| `GET /sessions/mine?limit=50` | -> `[{id,programExerciseId,exerciseName,sessionDate,durationSec,status,abstainReason,overallScore,confidence,setsCompleted,repsCompleted,pain,discomfort,difficulty,injuryNote,reviewed,clinicianFeedback}]` - `clinicianFeedback` is the latest `feedbackToPatient`, otherwise null. Never exposes clinician-only notes. |
| `GET /progress/mine` | -> `Progress` |
| `POST /sessions` | see below |
| `POST /sessions/:id/video` | raw body, `Content-Type: video/mp4\|video/webm\|video/quicktime`, max 50 MB. 403 unless the patient has consented. |

### `POST /sessions` (patient)

```jsonc
{
  "clientSessionUuid": "uuid-generated-on-the-phone",   // optional but the app MUST send it: re-sending the same uuid is idempotent
  "programExerciseId": 7, "sessionDate": "2026-03-05T09:30:00Z", "durationSec": 310,
  "status": "VALID",                                    // see vocabulary
  "abstainReason": null,                                // REQUIRED (non-empty) when status is not VALID/PARTIAL
  "confidence": 0.91,                                   // 0..1
  "setsCompleted": 3, "repsCompleted": 28,
  "pain": 2, "discomfort": 1, "difficulty": 4, "injuryNote": "optional text",
                                                        // pain + difficulty REQUIRED for VALID/PARTIAL, optional otherwise
  "overallScore": 82.5,                                 // REQUIRED 0..100 for VALID/PARTIAL; ignored (never stored) otherwise
  "analysisMethod": "temporal",                         // 'temporal' | 'threshold'
  "captureQuality": { "cameraView": "side", "checks": { }, "issues": [] },   // free JSON, <= 8 KB
  "assessedMetrics": ["rom_deg","tempo_sec"], "unassessedMetrics": ["symmetry_diff_deg"],
  "repetitions": [{
    "repetitionNumber": 1, "startMs": 0, "endMs": 3100,
    "angleTrace": [[0,172.1],[100,170.4]],              // primary joint angle, downsampled, <= 600 pairs
    "metrics": [{ "metricName":"rom_deg","value":88.0,"expectedValue":100,"status":"BELOW_TARGET" }],
    "phases":  [{ "phaseName":"rising","startMs":0,"endMs":1200,"minAngle":88,"maxAngle":172,"status":"OK" }],
    "errors":  [{ "errorCode":"insufficient_rom","phaseName":"standing","severity":"low","detail":"88 deg vs 100 target" }]
  }],
  "landmarkPoints": [{ "repetitionNumber":1,"timestampMs":0,"landmarkName":"leftKnee","x":0.51,"y":0.62,"confidence":0.93,"phase":"rising" }]
}
```
Response `201 {sessionId, duplicate:false, suggestionsCreated:0}`; a repeated `clientSessionUuid`
returns `200 {sessionId, duplicate:true}`. For a non-assessed status, `overallScore`, repetitions,
metrics and landmarks are **discarded by the server**. Landmark `x`,`y` are normalised 0..1 image coordinates.
After every stored session the server re-runs the longitudinal analysis and may create a system
progression-review suggestion (`suggestionsCreated`).

## Clinician - patients

| Method & path | Body -> Response |
|---|---|
| `GET /patients` | -> `[{id,name,email,age,sex,heightCm,rehabGoal,activeProgramId,lastSessionAt,pendingSuggestions,unreviewedSessions}]` |
| `POST /patients/link` | `{email}` -> 201 `{id,name,email}`. 404 unknown email / not a patient, 409 already assigned to another clinician. |
| `GET /patients/:patientId` | -> `{patient:{id,name,email,age,sex,heightCm,rehabGoal,injuryHistory,videoUploadConsent}, activeProgram:ProgramDetail\|null, programs:[{id,status,pathwayId,pathwayName,startDate,endDate}]}` |
| `PUT /patients/:patientId/profile` | `{age?,sex?,heightCm?,rehabGoal?,injuryHistory?}` -> `{ok:true}` |
| `GET /patients/:patientId/sessions` | -> `[{id,programExerciseId,exerciseId,exerciseName,sessionDate,durationSec,status,abstainReason,confidence,overallScore,correctedScore,effectiveScore,setsCompleted,repsCompleted,pain,discomfort,difficulty,injuryNote,analysisMethod,errorCount,reviewed}]` newest first. `errorCount` = effective (after clinician corrections); `reviewed` = has any review row. |
| `GET /patients/:patientId/progress` | -> `Progress` |

## Programmes

| Method & path | Role | Body -> Response |
|---|---|---|
| `GET /pathways` | any | -> `[{id,name,description,exerciseIds:[1,2,3,4]}]` |
| `GET /exercises` | any | -> `[{id,name,engineKey,description,instructions,cameraView,requiredLandmarks:[...],phases:[...],engineSupported:boolean,criteria:[Criterion]}]` (`engineSupported` = `engineKey != null`) (catalog criteria, `overridden:false`) |
| `POST /programs` | clinician | `{patientId,pathwayId,sessionsPerWeek?(1-7, default 3),exercises:[{exerciseId,sets(1-10),repetitions(1-50),orderNumber?,criteria?:[{metricName,targetValue?,minimumValue?,maximumValue?}]}]}` -> 201 `{programId}`. 1-8 exercises. Any previous *active* programme of this patient is set to `discontinued`. |
| `PUT /programs/:id` | clinician | `{sessionsPerWeek?,exercises?:[{programExerciseId,sets?,repetitions?,criteria?:[...]}]}` -> `{ok:true}`. Only an active programme. A `criteria` entry with all three values null removes the override. Writes a `program_changes` audit row. |
| `POST /programs/:id/discontinue` | clinician | `{reason?}` -> `{ok:true,status:'discontinued'}` |
| `GET /programs/mine` | any | -> `[{id,status,pathwayName,startDate,endDate}]` |
| `GET /programs/:id/exercises` | owner | -> `[ProgramExercise]` |

A programme only ever changes through these clinician endpoints or through a clinician **approving** a progression suggestion.

## Clinician - session evidence and corrections

`GET /sessions/:id/evidence` (clinician who owns the patient):

```jsonc
{
  "session": { "id":1,"programExerciseId":7,"sessionDate":"ISO","durationSec":310,"status":"VALID","abstainReason":null,
              "confidence":0.91,"setsCompleted":3,"repsCompleted":28,"pain":2,"discomfort":1,"difficulty":4,"injuryNote":null,
              "overallScore":82.5,"analysisMethod":"temporal","captureQuality":{...}|null,
              "assessedMetrics":["rom_deg"],"unassessedMetrics":[] },
  "exercise": { "id":1,"name":"Sit-to-Stand","cameraView":"side","requiredLandmarks":[...],"phases":[...] },
  "criteria": [Criterion],
  "repetitions": [{ "id":11,"repetitionNumber":1,"startMs":0,"endMs":3100,"angleTrace":[[0,172.1]],
                    "metrics":[{"metricName":"rom_deg","value":88,"expectedValue":100,"status":"BELOW_TARGET"}],
                    "phases":[{"phaseName":"rising","startMs":0,"endMs":1200,"minAngle":88,"maxAngle":172,"status":"OK"}],
                    "errors":[{"id":21,"errorCode":"insufficient_rom","phaseName":"standing","severity":"low","detail":"...",
                               "autoDetected":true,"decision":null|"DISMISSED"|"CONFIRMED"}] }],
  "addedErrors": [{ "reviewId":4,"repetitionNumber":2,"errorCode":"knee_valgus","clinicianName":"Dr. Demo","createdAt":"ISO" }],
  "corrections": [{ "id":4,"clinicianId":2,"clinicianName":"Dr. Demo","action":"DISMISS_ERROR","errorId":21,"repetitionNumber":null,
                    "errorCode":null,"adjustedScore":null,"notes":"...","feedbackToPatient":null,"createdAt":"ISO" }],
  "original":  { "score":82.5, "errorCount":3 },                  // the automated assessment, never overwritten
  "effective": { "score":78.0, "errorCount":2, "scoreCorrected":true },  // after clinician corrections
  "landmarks": [{ "repetitionNumber":1,"timestampMs":0,"landmarkName":"leftKnee","x":0.51,"y":0.62,"confidence":0.93,"phase":"rising" }],
  "video": { "available": false }
}
```
`PUT /sessions/:id/review` (clinician) body `{action, errorId?, repetitionNumber?, errorCode?, adjustedScore?, notes?, feedbackToPatient?}`:
`action` is `NOTE` (default) | `DISMISS_ERROR` | `CONFIRM_ERROR` (need `errorId` of this session) | `ADD_ERROR` (needs
`repetitionNumber` of this session + snake_case `errorCode`) | `ADJUST_SCORE` (needs `adjustedScore` 0-100; 409 if the session is not
`VALID`/`PARTIAL` - a score can never be added to an abstained session). -> 201 `{ok:true,reviewId}`. Reviews are append-only: who and when are recorded; the latest decision on an error wins.
`GET /sessions/:id/video` (clinician) streams the video if one was uploaded with consent (404 otherwise).

## Progression review

A suggestion is **only a prompt for the clinician**. Nothing changes until the clinician approves.

```jsonc
Suggestion = { "id":3,"programId":3,"patientId":5,"patientName":"Patient Demo","exerciseId":1,"exerciseName":"Sit-to-Stand",
  "kind":"PROGRESS"|"REVIEW_DETERIORATION"|"REVIEW_PLATEAU"|"REVIEW_PAIN", "source":"system"|"patient_app",
  "status":"PENDING"|"OBSERVE"|"APPROVED"|"MODIFIED"|"REJECTED",
  "suggestion":"Consider progressing Sit-to-Stand from 3 x 10 to 3 x 12.", "reason":"plain-language evidence",
  "evidence": AnalysisResult|null, "adherenceRate":0.86|null,
  "currentSets":3,"currentRepetitions":10,"proposedSets":3,"proposedRepetitions":12,
  "createdAt":"ISO","reviewedAt":null,"reviewNote":null }
```

| Method & path | Role | Body -> Response |
|---|---|---|
| `GET /progression-suggestions?status=PENDING,OBSERVE` | clinician | -> `[Suggestion]` (default statuses `PENDING,OBSERVE`; `/progression-suggestions/pending` is kept as an alias) |
| `POST /progression-suggestions/:id/approve` | clinician | `{newSets?,newRepetitions?,note?}` -> `{ok,status:'APPROVED'\|'MODIFIED'}`. Defaults to the proposed values; `MODIFIED` when the clinician's numbers differ from the proposal. Only now do sets/reps change; a `program_changes` row is written. 409 if already decided. |
| `POST /progression-suggestions/:id/reject` | clinician | `{note?}` -> `{ok:true}` |
| `POST /progression-suggestions/:id/observe` | clinician | `{note?}` -> `{ok:true,status:'OBSERVE'}` ("keep watching", stays in the queue) |
| `POST /progression-suggestions` | patient | legacy: `{programId,exerciseId,suggestion,reason}` -> 201 `{suggestionId}`, stored with `source:'patient_app'` |

## Health

`GET /health` (no `/api` prefix) -> `{status:'ok'}`.
