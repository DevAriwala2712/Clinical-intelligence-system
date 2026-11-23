# Clinician-Calibrated Rehabilitation Quality and Progression System

> 🌐 **Live Clinician Portal (Works 24/7)**: **[https://suryansh98741.github.io/Clinical-intelligence-system/](https://suryansh98741.github.io/Clinical-intelligence-system/)**  
> Access the live interactive dashboard from any web browser without needing to run a local development environment.  
> **Pre-loaded Demo Login**: Email: `clinician@demo.com` | Password: `DemoPass123`

A comprehensive, clinician-in-the-loop telerehabilitation platform that transforms consumer phone cameras into objective clinical biomechanics measurement devices.

Rather than acting as a simple fitness repetition counter, this system analyses **movement quality** (Range of Motion, Tempo, Control/Smoothness via normalized jerk, Bilateral Symmetry, and Exercise-Specific Compensations), enforces **strict capture-quality abstention**, calculates **longitudinal progression trajectories** via Theil-Sen trend estimation, and submits explainable progression suggestions to the treating physiotherapist for mandatory clinical governance.

---

## 1. System Architecture

The repository is organized into three connected applications sharing unified clinical models:

```
├── backend/                  # Express + TypeScript REST API
│   ├── sql/schema.sql        # MySQL 8.0 schema (RBAC, protocols, sessions, evidence, suggestions)
│   ├── src/analysis/         # Biomechanical algorithms (ROM, tempo, jerk, symmetry, compensations, Theil-Sen)
│   ├── src/controllers/      # Auth, patient, program, session, and progression controllers
│   ├── src/evaluation/       # Benchmark harness comparing Baseline 1 (Threshold) vs Baseline 2 (Temporal)
│   └── src/tests/            # 101 automated unit & integration tests (100% pass rate)
├── clinician-dashboard/      # React 19 + Vite web dashboard
│   ├── src/views/OverviewView.jsx          # Cohort overview, KPI cards, pending progression queue
│   ├── src/views/PatientProfileView.jsx    # Patient dossier, protocol manager, adherence & trend charts
│   ├── src/views/KinematicsPlayerView.jsx  # Interactive landmark skeleton player, rep breakdown, clinician corrections
│   └── src/views/ProtocolBuilderView.jsx   # Clinical protocol creator with custom exercise criteria
├── patient_app/              # Flutter cross-platform mobile application
│   ├── lib/rehab/            # On-device kinematics engine (geometry, confidence, state machine, quality scorer)
│   ├── lib/screens/          # Camera assessment, real-time guidance, session feedback, adherence history
│   └── lib/services/         # Edge-to-cloud API client with offline SQLite cache
└── docs/                     # Full viva and system documentation
    ├── ARCHITECTURE.md       # High-level architecture and subsystem diagram
    ├── POSE_ANALYSIS.md      # Mathematical models, state machine, and scoring equations
    ├── DATA_FLOW.md          # 20-step patient-to-clinician data flow
    ├── PRIVACY_AND_CONSENT.md# Edge processing, optional consent, and data protection
    ├── EVALUATION.md         # Quantitative benchmark results and comparative baseline tables
    └── VIVA_GUIDE.md         # Demonstration script and examiner Q&A
```

---

## 2. Core Clinical Capabilities

### A. 5 Supported Rehabilitation Movements
1. **Bodyweight Squat** (Knee flexion, hip hinge, trunk angle, pelvic symmetry, depth criteria)
2. **Shoulder Abduction** (Coronal plane elevation, scapular hiking compensation, trunk lean)
3. **Knee Extension** (Terminal extension, quadriceps hold tempo, flexor compensation)
4. **Standing Lunge** (Split-stance knee flexion, forward knee tracking, pelvic tilt)
5. **Hip Abduction** (Frontal plane abduction, pelvic obliquity compensation, lateral trunk lean)

### B. Multi-Dimensional Quality Scoring
- **ROM Compliance (40%)**: Target joint angle achieved vs. prescribed target.
- **Tempo Control (20%)**: Adherence to prescribed eccentric, inflection hold, and concentric durations.
- **Movement Smoothness (20%)**: Normalized jerk cost ($J = \frac{1}{2} \int (\frac{d^3\theta}{dt^3})^2 dt$).
- **Bilateral Symmetry (10%)**: Bilateral joint angle ratio ($\frac{\theta_{active}}{\theta_{contralateral}}$).
- **Compensation Penalty (10%)**: Deductions for trunk tilt, hip hiking, or valgus collapse.

### C. Strict Capture Quality & Explicit Abstention
The system will **never** fabricate scores on degraded visual feeds. When landmark tracking drops below confidence thresholds ($c < 0.60$), joints leave the camera frame, or occlusion occurs, the engine flags `is_abstained = 1`, halts scoring, and prompts the patient with corrective positioning guidance.

### D. Longitudinal Trends & Explainable Progression
- Evaluates moving 14-day adherence and consecutive session quality.
- Uses **Theil-Sen robust linear regression** to evaluate trajectory slopes without outlier vulnerability.
- Triggers actionable suggestions (`INCREASE_REPS`, `INCREASE_SETS`, `INCREASE_TARGET_ROM`, `DECREASE_DIFFICULTY`, `MAINTAIN_CURRENT`).
- **Clinician-in-the-Loop Governance**: Suggestions are never auto-applied; physiotherapists review evidence, confirm/dismiss errors, adjust scores, and explicitly `APPROVE`, `MODIFY`, or `REJECT` protocol changes.

---

## 3. Quickstart & Installation

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MySQL**: 8.0+ running on `localhost:3306`
- **Flutter SDK**: 3.x+ (for mobile app)

---

### Step 1: Database Setup
1. Ensure your MySQL server is running.
2. In MySQL, create the database or let `schema.sql` handle it:
```bash
cd backend
cp .env.example .env
# Update DB_PASSWORD in .env to match your MySQL root password
```
3. Initialize the schema:
```powershell
# Windows PowerShell
Get-Content sql/schema.sql | & mysql -u root -p rehab_system
# Or on Linux / macOS:
mysql -u root -p rehab_system < sql/schema.sql
```
4. Seed the database with catalog exercises and demo accounts:
```bash
npm run seed
```

**Pre-seeded Demo Accounts:**
| Role | Email | Password |
|---|---|---|
| **Clinician** | `clinician@demo.com` | `DemoPass123` |
| **Patient** | `patient@demo.com` | `DemoPass123` |

---

### Step 2: Run & Test the Backend API

```bash
cd backend
npm install
npm run build

# Run all 101 automated unit & integration tests
npm test

# Run the quantitative Baseline 1 vs Baseline 2 evaluation harness
npm run eval

# Start the server (runs on http://localhost:4000)
npm start
# (or for development with hot reload: npm run dev)
```

---

### Step 3: Run the Clinician Dashboard

```bash
cd ../clinician-dashboard
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser. Log in with `clinician@demo.com` / `DemoPass123`.

**Clinician Features to Explore:**
- **Overview**: View assigned patient cohort, adherence rates, and the pending Progression Suggestion Queue.
- **Patient Profile**: Inspect Marcus Vance (`patient@demo.com`), edit rehabilitation goals, configure active protocol criteria, and inspect longitudinal ROM/adherence sparklines.
- **Session Evidence (Kinematics Player)**: Open Session #3, scrub through raw 2D landmark skeletal trajectories, review rep-by-rep breakdowns, dismiss/confirm compensation flags, override scores, and leave clinical notes.
- **Protocol Builder**: Create custom rehabilitation pathways and set custom ROM thresholds.

---

### Step 4: Run the Patient Application

```bash
cd ../patient_app
flutter pub get

# Run on connected device or simulator
flutter run
```
Log in with `patient@demo.com` / `DemoPass123`.

**Patient Features to Explore:**
- **Home Screen**: View assigned exercise prescribed by Dr. Sarah Jenkins.
- **Camera Assessment**: Real-time pose feedback, bounding box centering validation, joint visibility alerts, and live rep state machine (`START` → `ECCENTRIC` → `INFLECTION` → `CONCENTRIC` → `COMPLETED`).
- **Session Feedback**: Report post-exercise pain (0-10 VAS), perceived exertion (RPE 1-10), and subjective notes.
- **Progress Screen**: Review past sessions, adherence history, and therapist feedback.

---

## 4. Technical Evaluation Harness

Run the evaluation benchmark:
```bash
cd backend
npm run eval
```

### Benchmark Results (Synthetic Corrupted & Biomechanical Kinematic Traces):
| Metric | Baseline 1 (Static Threshold) | Baseline 2 (Temporal / Jerk / Kinetic Engine) |
|---|---|---|
| **Detection Recall** | 25.0% | **100.0%** |
| **False Positive Rate** | 50.0% | **0.0%** |
| **Abstention on Corrupted Data** | 0.0% (Fabricates scores) | **100.0%** (Correctly abstains) |
| **Jerk / Smoothness Sensitivity** | None (Blind to jerky motions) | High ($J_{norm} > 15.0$) |
| **Trunk Lean Compensation Detection**| Misses dynamic lean | Accurately identifies tilt $> 15^\circ$ |

---

## 5. Documentation Directory

For complete viva defense materials, clinical safety protocols, and technical diagrams:

- [System Architecture Specification](file:///docs/ARCHITECTURE.md)
- [Pose Analysis & Mathematical Formulations](file:///docs/POSE_ANALYSIS.md)
- [End-to-End 20-Step Data Flow](file:///docs/DATA_FLOW.md)
- [Privacy, Edge Computing & Consent Model](file:///docs/PRIVACY_AND_CONSENT.md)
- [Quantitative Technical Evaluation & Benchmark](file:///docs/EVALUATION.md)
- [Viva Defense Demonstration Guide & Examiner Q&A](file:///docs/VIVA_GUIDE.md)

---

## 6. Regulatory & Clinical Safety Disclaimer

This system is an assistive clinical decision support tool designed for rehabilitation progress monitoring. It is **not** an autonomous diagnostic medical device. All exercise prescriptions, criteria adjustments, and progression approvals must be made by a licensed physiotherapist or medical professional.
