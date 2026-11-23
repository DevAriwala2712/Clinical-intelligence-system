# End-to-End Data Flow

This document details the complete 20-step clinical lifecycle from clinician prescription to patient exercise execution, longitudinal analysis, and progression calibration.

---

## The 20-Step Clinical Journey

```
[1. Clinician Login]
        │
        ▼
[2. Open Patient Record] ──> [3. Select Pathway] ──> [4. Calibrate Criteria & Assign Program]
                                                               │
                                                               ▼ (Saved to MySQL `rehabilitation_programs`)
                                                     [5. Patient Mobile Login]
                                                               │
                                                               ▼
                                                     [6. View Assigned Program & Prescriptions]
                                                               │
                                                               ▼
                                                     [7. Start Exercise Session]
                                                               │
                                                               ▼
                                                     [8. Camera Setup & Joint Visibility Check]
                                                        │              │
                                          If Corrupted  │              │ If Optimal
                                                        ▼              ▼
                                                [Prompt Adjust]  [9. Extract Pose Landmarks]
                                                                       │
                                                                       ▼
                                                         [10. Evaluate Phases & Repetitions]
                                                                       │
                                                                       ▼
                                                         [11. Assess Quality Score & Errors]
                                                                       │
                                                                       ▼
                                                         [12. Patient Records Pain & Difficulty]
                                                                       │
                                                                       ▼
                                                         [13. Sync Session to Backend via API]
                                                                       │
                                                                       ▼
                                                         [14. Clinician Inspects Session Evidence]
                                                                       │
                                                                       ▼
                                                         [15. Clinician Reviews Flags & Errors]
                                                                       │
                                                                       ▼
                                                         [16. Clinician Calibrates / Corrects]
                                                                       │
                                                                       ▼
                                                         [17. Longitudinal Trends Update]
                                                                       │
                                                                       ▼
                                                         [18. System Suggests Progression]
                                                                       │
                                                                       ▼
                                                         [19. Clinician Approves / Rejects]
                                                                       │
                                                                       ▼ (Only after Clinician Approval)
                                                         [20. Updated Prescription Active on Patient App]
```

---

## Step-by-Step Explanation

1. **Clinician Authentication**: Clinician logs in to the dashboard via `POST /api/auth/login`. Receives JWT containing role `clinician`.
2. **Open Patient Record**: Clinician selects an assigned patient or links a new patient by email (`POST /api/patients/link`).
3. **Select Pathway**: Clinician selects an established rehabilitation pathway (e.g. `Knee Mobility Rehabilitation`).
4. **Calibrate Criteria & Assign**: Clinician customizes target range of motion (ROM), tempo bounds, sets and repetitions, and dispatches via `POST /api/programs`. Previous active programs are transitioned to `discontinued`.
5. **Patient Mobile Login**: Patient logs into the Flutter app via `POST /api/auth/login`.
6. **Fetch Prescribed Protocol**: Mobile app calls `GET /api/programs/active` and retrieves assigned exercises, instructions, target sets/reps, and camera angles.
7. **Initiate Movement Session**: Patient selects an assigned movement and starts the camera.
8. **Camera Setup & Positioning Gate**: The app validates joint visibility and framing distance before allowing the recording to begin.
9. **Real-Time Landmark Extraction**: Google ML Kit pose detection extracts coordinates at 20-30 fps.
10. **Repetition State Machine**: The state machine tracks movement inflection points (start, lowering, bottom, rising, complete).
11. **Movement Quality Assessment**: The engine computes ROM, tempo, jerk/control, and compensatory trunk lean, comparing each against clinician criteria.
12. **Patient Session Self-Report**: The patient rates pain (0-10), discomfort (0-10), perceived difficulty (1-10), and optional injury symptoms.
13. **Sync Session to Backend**: App sends payload to `POST /api/sessions` with `clientSessionUuid` for idempotency.
14. **Evidence Inspection**: Clinician opens session on the dashboard via `GET /api/sessions/:id/evidence`.
15. **Kinematic Evidence Review**: Clinician inspects coordinate stick-figure trajectory, phase metrics, and automated error flags.
16. **Clinician Correction**: Clinician confirms true compensations, dismisses false alerts (`DISMISS_ERROR`), or calibrates score (`ADJUST_SCORE`) with review notes (`PUT /api/sessions/:id/review`).
17. **Longitudinal Trend Update**: Backend updates Theil-Sen trend estimator (improving, stable, plateau, deteriorating) and 14-day adherence.
18. **Progression Suggestion Generation**: If the patient exhibits sustained high quality ($\ge 80\%$) and adherence ($\ge 75\%$), or reports high pain, the backend creates a `progression_suggestions` review prompt.
19. **Clinician Review Decision**: Clinician reviews evidence on the dashboard and chooses `Approve`, `Modify`, `Observe`, or `Reject`.
20. **Prescription Synchronization**: Only upon clinician approval are the new sets/repetitions written to `program_exercises` and synchronized to the patient's phone.
