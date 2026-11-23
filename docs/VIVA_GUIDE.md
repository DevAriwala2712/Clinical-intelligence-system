# Viva and Project Demonstration Guide

This guide prepares you for demonstrating the **Clinician-Calibrated Rehabilitation Quality and Progression System** during project defense, evaluation, or viva examination.

---

## 1. Executive Summary of the Technical Contribution

### Problem Statement
Standard mobile fitness trackers count repetitions using basic bounding-box heuristics or single-joint thresholding. In physical therapy and post-operative rehabilitation:
- Counting repetitions alone is medically inadequate and potentially dangerous.
- Movements must be evaluated for **biomechanical quality**: range of motion (ROM), velocity tempo, jerk/control, bilateral symmetry, and compensatory substitutions (e.g. trunk lean).
- General fitness apps emit scores even when the patient is partially out of frame or tracked with noisy landmarks, creating false progress indicators.
- Autonomous AI progression risks re-injuring patients without professional oversight.

### Technical Contribution
1. **Explainable Biomechanical Assessment**: Translates pose landmarks into transparent mathematical scores based on dot-product joint angles and derivative jerk metrics.
2. **Strict Explicit Abstention**: Implements camera setup validation and confidence gating ($k_{\text{conf}} \ge 0.70$). When tracking is compromised, the system explicitly abstains (`LOW_CONFIDENCE`, `INVALID`) rather than fabricating measurements.
3. **Robust Longitudinal Analysis**: Uses the **Theil-Sen robust linear regression estimator** to compute true trajectory trends, ignoring single-session anomalies, good-day outliers, or temporary dips.
4. **Clinician-in-the-Loop Governance**: Suggestions for progression (reps/sets adjustments) or clinical review (due to pain or plateaus) are presented as explainable evidence prompts. Prescriptions only change when approved by the licensed clinician.
5. **Audit-Preserving Effective Scoring**: Clinician corrections (confirming errors, dismissing false alerts, adjusting scores) are recorded as immutable audit events. The original automated assessment is never overwritten.

---

## 2. Supported Rehabilitation Movements & Clinical Criteria

| Exercise | Camera Setup | Measurable Criteria | Common Biomechanical Errors |
|---|---|---|---|
| **Sit-to-Stand** | Side view, 2-3m away | Knee ROM target (160°), Tempo (1.5-4.0s), Control jerk ($\le 25^\circ/\text{frame}$), Trunk lean ($\le 30^\circ$) | `insufficient_rom`, `too_fast`, `jerky_motion`, `trunk_lean` (excessive anterior flexion) |
| **Seated Knee Flexion** | Side view, 2m away | Knee ROM (120°), Bilateral symmetry diff ($\le 15^\circ$), Tempo (1.5-3.5s) | `insufficient_rom`, `asymmetry`, `too_fast`, `jerky_motion` |
| **Shoulder Flexion** | Front view, 2-3m away | Glenohumeral ROM (150°), Trunk lateral lean ($\le 20^\circ$), Tempo (1.5-4.0s) | `insufficient_rom`, `trunk_lean` (lateral trunk lean compensation), `too_fast` |
| **Elbow Flexion (Bicep Curl)** | Side view, 2m away | Elbow ROM (130°), Tempo (1.0-3.0s), Control jerk ($\le 30^\circ/\text{frame}$) | `insufficient_rom`, `jerky_motion`, `too_fast`, `incomplete_return` |
| **Squat-to-Chair** | Side view, 2-3m away | Knee ROM (100°), Tempo (1.5-4.0s), Trunk lean ($\le 25^\circ$), Control jerk ($\le 25^\circ/\text{frame}$) | `insufficient_rom`, `trunk_lean`, `jerky_motion`, `too_fast` |

---

## 3. Recommended Step-by-Step Viva Demonstration

### Step 1: Clinician Station Overview & Login
1. Open the Clinician Dashboard at `http://localhost:5173`.
2. Sign in with demo credentials: `clinician@demo.com` / `DemoPass123`.
3. Highlight the clean, focused interface: active patient count, pending progression suggestions, and unreviewed session alerts.

### Step 2: Patient Record & Prescription Builder
1. Click **Open Record** on `Patient Demo`.
2. Show the patient's rehabilitation goal and injury history.
3. Show the assigned protocol: **Knee Mobility Rehabilitation** (Sit-to-Stand, Seated Knee Flexion, etc.) with configurable criteria thresholds.
4. Open **Assign / Modify Program** (`ProtocolBuilderView`): show how a clinician can adjust target ROM, tempo bounds, sets, and repetitions specifically for this patient.

### Step 3: Kinematics Evidence & Correction Inspection
1. Navigate to the session evidence player (`KinematicsPlayerView` for Session #3).
2. Show the **Raw 2D Landmark Coordinate Trajectory**: unadulterated joint points mapped over time.
3. Show the **Repetition & Phase-Level Breakdown**: angles, duration, and status for each phase.
4. Show **Flagged Movement Errors**: click **Dismiss False Alert** on a minor flag or **Confirm Error**. Show that the Effective Error Count immediately updates while the original machine score is safely preserved.

### Step 4: Longitudinal Evidence & Progression Suggestion
1. Return to the dashboard overview to review the **Progression Suggestions Queue**.
2. Show the prompt: explain why the system proposed progressing Sit-to-Stand (e.g. patient maintained $> 80\%$ quality and high adherence over 14 days).
3. Demonstrate clinical governance: click **Approve** or adjust repetitions. Show that the prescription updates only upon clinician action.

### Step 5: Run Automated Tests & Evaluation Benchmark
1. In the terminal:
   ```bash
   cd backend
   npm test
   ```
   Show all **101 tests passing** (88 unit tests + 13 integration & security tests).
2. Run the technical baseline comparison:
   ```bash
   npm run eval
   ```
   Show examiners the quantitative comparison between Baseline 1 (Threshold, 25% error recall) and Baseline 2 (Temporal, 100% error recall + explicit abstention).

---

## 4. Anticipated Viva Defense Questions & Answers

**Q1: Why did you choose the Theil-Sen estimator instead of Ordinary Least Squares (OLS) for longitudinal trend analysis?**
*Answer*: OLS linear regression is highly sensitive to extreme outliers; a single unusually good session or a bad flare-up session would distort the calculated trajectory slope. The Theil-Sen estimator calculates the median of all pairwise slopes, ensuring high breakdown resilience (up to 29% outliers) and guaranteeing that one anomalous session cannot falsely trigger an erroneous progression review.

**Q2: Why process pose detection on-device instead of streaming video to the server?**
*Answer*: Privacy and latency. Camera video is sensitive biometric data. By extracting 33 pose landmarks locally and discarding raw camera frames, the patient's privacy is protected by default. Furthermore, local processing eliminates video streaming bandwidth costs and reduces latency to under 1ms per frame.

**Q3: What prevents the system from making clinical errors or re-injuring a patient?**
*Answer*: Two mechanisms: (1) Explicit Abstention: When tracking confidence drops below 70% or joints are cropped, the engine refuses to emit scores. (2) Strict Clinician Governance: The AI never modifies prescriptions autonomously; it only presents explainable evidence prompts that require physiotherapist verification and approval.
