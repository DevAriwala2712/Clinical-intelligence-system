# System Architecture

## Overview

The **Clinician-Calibrated Rehabilitation Quality and Progression System** is an end-to-end platform bridging computer vision, mobile edge biomechanics, and clinical governance.

The system is deliberately structured into three interoperable subsystems:
1. **Express + TypeScript Backend (`/backend`)**:
   - Central REST API enforcing strict role-based access control (`clinician` vs `patient`).
   - Relational persistence in MySQL (`rehab_system` database).
   - Pure statistical & longitudinal analysis engine (`/src/analysis/`).
   - Clinical progression suggestion and governance engine.
2. **React Clinician Dashboard (`/clinician-dashboard`)**:
   - Web application providing clinicians with patient roster management, program builder with criteria threshold calibration, session evidence & kinematic inspection, error confirmation/dismissal, and progression suggestion approval/rejection.
3. **Flutter Patient Mobile Application (`/patient_app`)**:
   - Camera-based rehabilitation assistant using on-device ML Kit pose detection.
   - Real-time joint angle calculation, movement phase state machine, and quality scoring.
   - Robust capture quality validation with explicit abstention when tracking is unreliable.
   - Patient-reported outcome measures (pain, discomfort, perceived difficulty).

---

## High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                               PATIENT ENVIRONMENT                               |
|                                                                                 |
|  [Phone Camera] ---> [Google ML Kit Pose Detection]                             |
|                                | (33 normalized landmarks @ 20-30 fps)          |
|                                v                                                |
|                   [Capture Quality Validator]                                   |
|                      |             |                                            |
|          Unsuitable? |             | Suitable                                   |
|                      v             v                                            |
|               [ABSTAIN]      [Movement Analyzer]                                |
|           (Explain Reason)     |-- Geometry: Joint Angles (Dot Product / Acos)  |
|                                |-- Movement Phase State Machine                 |
|                                |-- Quality Scorer (ROM, Tempo, Control, Jerk)   |
|                                v                                                |
|                   [Session Feedback & Review]                                   |
|                      (Pain 0-10, Diff 1-10, Notes)                              |
+---------------------------------------------------------------------------------+
                                      |
                                      | HTTPS (JWT Bearer Token, JSON Payloads)
                                      v
+---------------------------------------------------------------------------------+
|                                BACKEND API (Node/TS)                            |
|                                                                                 |
|  [API Routes & Role Middleware]                                                 |
|     |-- /api/auth               (Registration & Login, Bcrypt + JWT)            |
|     |-- /api/patients           (Cohort Linkage & Profile Management)           |
|     |-- /api/programs           (Pathways, Prescriptions, Criteria Overrides)   |
|     |-- /api/sessions           (Validated Upload, Idempotency, Stored Traces)  |
|     |-- /api/progression-suggestions (System Rule Engine & Approval Workflow)   |
|                                                                                 |
|  [Analysis & Logic Core]                                                        |
|     |-- Longitudinal Engine (Theil-Sen Trend Estimator, 14-day Adherence)       |
|     |-- Progression Rules   (Explainable Clinician Review Prompts)              |
|     |-- Effective Scorer    (Merges Automated Findings + Clinician Corrections) |
|                                                                                 |
|  [MySQL Database (rehab_system)]                                                |
|     `users`, `patient_profiles`, `rehabilitation_programs`,                     |
|     `program_exercises`, `program_exercise_criteria`, `rehab_sessions`,         |
|     `session_repetitions`, `repetition_metrics`, `repetition_phases`,           |
|     `repetition_errors`, `landmark_points`, `progression_suggestions`,          |
|     `clinician_reviews`, `program_changes`, `session_videos`                    |
+---------------------------------------------------------------------------------+
                                      ^
                                      | HTTPS (JWT Bearer Token)
                                      |
+---------------------------------------------------------------------------------+
|                          CLINICIAN DASHBOARD (React/Vite)                       |
|                                                                                 |
|  [Overview & Review Queue]                                                      |
|     - Active Patient Roster, At-a-glance Unreviewed Counts                      |
|     - Progression Suggestions (Approve, Modify, Observe, Reject)                |
|  [Patient Profile & Dossier]                                                    |
|     - Adherence Tracking (14-day window rate)                                   |
|     - Longitudinal Movement Trends (Improving, Deteriorating, Plateau)          |
|     - Session History with Effective vs Machine Scores                          |
|  [Kinematics & Evidence Player]                                                 |
|     - Raw 2D Landmark Coordinate Trajectory Plot (`LandmarkSkeleton`)           |
|     - Repetition & Phase-Level Breakdown (Angles, Tempo, Jerk, Compensations)   |
|     - Error Correction: Confirm Error / Dismiss False Alert                     |
|     - Score Calibration & Feedback to Patient                                   |
|  [Protocol & Criteria Builder]                                                  |
|     - Pathway Assignment, Sets/Reps Volume Prescription                         |
|     - Criteria Calibration (Target ROM, Min/Max Tempo, Max Jerk, Trunk Lean)    |
+---------------------------------------------------------------------------------+
```

---

## Key Architectural Principles

1. **Edge-First Biomechanical Processing**: Raw camera frames are analyzed on-device. Permanent raw video storage is never required for core scoring, protecting patient privacy by default.
2. **Explicit Abstention over Fabrication**: When tracking confidence is low (< 70%), lighting is poor, or joints are cropped, the system explicitly abstains (`LOW_CONFIDENCE`, `INVALID`) rather than emitting fabricated measurements.
3. **Clinician-in-the-Loop Governance**: Prescriptions, progression increases, and diagnostic error calibrations must be reviewed and approved by a licensed physiotherapist before taking effect. The machine never autonomously changes a patient's prescription.
4. **Auditability & Append-Only Corrections**: Clinician reviews do not overwrite machine-detected findings. Both original machine measurements and effective clinician decisions are stored, enabling continuous calibration and verification.
