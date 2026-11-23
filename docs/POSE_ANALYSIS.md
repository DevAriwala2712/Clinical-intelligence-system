# Pose Analysis, Kinematics, and Quality Scoring

## 1. Landmark Extraction

The system utilizes Google ML Kit Pose Detection, which returns 33 anatomical landmarks in 2D/3D normalized frame coordinates (`[0.0, 1.0]`) alongside visibility confidence ratings.

### Supported Exercises & Anatomical Landmarks

| Exercise | Required Landmarks | Primary Joint Vertex | Camera Orientation |
|---|---|---|---|
| **Sit-to-Stand** | `leftHip`, `leftKnee`, `leftAnkle` (or right) | Knee (`leftKnee`) | Sagittal (Side View) |
| **Seated Knee Flexion** | `leftHip`, `leftKnee`, `leftAnkle`, `rightHip`, `rightKnee`, `rightAnkle` | Knee (`leftKnee` / `rightKnee`) | Sagittal (Side View) |
| **Shoulder Flexion** | `leftHip`, `leftShoulder`, `leftElbow`, `leftWrist` | Shoulder (`leftShoulder`) | Frontal (Front View) |
| **Elbow Flexion (Bicep Curl)** | `leftShoulder`, `leftElbow`, `leftWrist` | Elbow (`leftElbow`) | Sagittal (Side View) |
| **Squat-to-Chair** | `leftHip`, `leftKnee`, `leftAnkle` | Knee (`leftKnee`) | Sagittal (Side View) |

---

## 2. Mathematical Biomechanical Formulations

### Joint Angle Calculation
Given three 2D spatial points $A$ (proximal), $B$ (vertex joint), and $C$ (distal):
1. Vector from joint to proximal: $\vec{u} = A - B = (x_A - x_B, y_A - y_B)$
2. Vector from joint to distal: $\vec{v} = C - B = (x_C - x_B, y_C - y_B)$
3. Dot product: $\vec{u} \cdot \vec{v} = u_x v_x + u_y v_y$
4. Vector magnitudes: $\|\vec{u}\| = \sqrt{u_x^2 + u_y^2}$, $\|\vec{v}\| = \sqrt{v_x^2 + v_y^2}$
5. Enclosed angle:
   $$\theta = \arccos\left(\text{clamp}\left(\frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}, -1.0, 1.0\right)\right) \times \frac{180}{\pi}$$

### Trunk Lean Compensation
Measures trunk departure from verticality using hip and shoulder markers:
$$\theta_{\text{trunk}} = \arctan\left(\frac{|x_{\text{shoulder}} - x_{\text{hip}}|}{|y_{\text{shoulder}} - y_{\text{hip}}|}\right) \times \frac{180}{\pi}$$

### Control & Movement Smoothness (Jerk)
Velocity jerk is estimated via frame-to-frame angular acceleration:
$$J_t = \frac{|\theta_t - \theta_{t-1}|}{\Delta t}$$
Excessive jerk ($> 25^\circ/\text{frame}$) indicates instability, tremors, or ballistic compensation.

---

## 3. Repetition State Machine

Movement repetitions are tracked through a deterministic finite-state automaton:
1. **START**: Patient resting in starting position ($\theta \ge \text{threshold}_{\text{start}}$).
2. **LOWERING / MOVING**: Active descent / concentric phase initiating.
3. **BOTTOM / PEAK**: Terminal inflection point reached ($\theta \le \text{threshold}_{\text{bottom}}$).
4. **RISING / RETURNING**: Return phase toward start position.
5. **COMPLETE**: Angle returns across start threshold; repetition count increments, and metrics are finalized.

---

## 4. Explainable Quality Scoring

Overall quality is calculated as a transparent weighted sum of component criteria:

$$\text{OverallScore} = w_{\text{rom}} S_{\text{rom}} + w_{\text{tempo}} S_{\text{tempo}} + w_{\text{control}} S_{\text{control}} + w_{\text{comp}} S_{\text{comp}}$$

Where:
- **Range of Motion ($S_{\text{rom}}$)**:
  - If $\theta_{\text{observed}} \ge \theta_{\text{target}}$: Score = 100
  - If $\theta_{\text{observed}} < \theta_{\text{target}}$: Score = $\left(\frac{\theta_{\text{observed}}}{\theta_{\text{target}}}\right) \times 100$
- **Tempo ($S_{\text{tempo}}$)**:
  - Full score when repetition duration falls within $[\text{tempo}_{\text{min}}, \text{tempo}_{\text{max}}]$ (e.g. 1.5s - 4.0s).
- **Movement Control ($S_{\text{control}}$)**:
  - Deductions applied proportionally when peak jerk exceeds clinician threshold.
- **Compensation Penalties ($S_{\text{comp}}$)**:
  - Deductions applied for excessive trunk sway, asymmetric weight shift, or valgus collapse.

---

## 5. Explicit Abstention Protocol

The system enforces strict abstention to prevent misleading clinical decisions:

| Status | Trigger Condition | Stored Output |
|---|---|---|
| `VALID` | Setup optimal, confidence $\ge 0.70$, full reps detected | Quality score, metrics, repetition phases, errors |
| `PARTIAL` | High confidence overall, but specific limb occluded | Scored on assessed metrics only; unassessed listed |
| `LOW_CONFIDENCE` | Average tracking confidence $< 0.70$ | **No score**; explanation stored for clinician |
| `INVALID` | Subject out of frame, cropped joints, incorrect distance | **No score**; repositioning guidance provided |
| `INCOMPLETE` | Recording ended without a complete repetition | **No score**; marked incomplete |
| `UNSUPPORTED` | Movement pattern does not match catalog exercise | **No score**; flagged for clinician review |
