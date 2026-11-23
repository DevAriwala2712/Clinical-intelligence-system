# Data Privacy, Security, and Consent

## 1. Privacy-Preserving Biomechanical Architecture

In telemedicine and digital physical therapy, patient video streams represent highly sensitive biometric data. The system enforces strict privacy-by-design defaults:

1. **On-Device Edge Processing**:
   - Camera frames are processed entirely in volatile device memory using Google ML Kit Pose Detection.
   - Raw video frames are discarded immediately after 2D coordinate extraction.
   - Only derived spatial coordinates (`x`, `y`), normalized joint angles, temporal metrics, and repetition counts are transmitted to the server.
2. **Zero Permanent Video Storage by Default**:
   - The default value for `patient_profiles.video_upload_consent` is `FALSE`.
   - The backend strictly enforces this: `POST /api/sessions/:id/video` queries the patient profile and returns HTTP `403 Forbidden` if explicit consent is absent.
3. **Explicit Opt-In Protocol**:
   - Patients can toggle raw video recording on or off at any time within their mobile Profile settings (`PUT /api/patients/me/consent`).
   - The timestamp of consent grant or revocation is recorded in `video_consent_updated_at`.

---

## 2. Role-Based Access Control & Multi-Tenancy

The API enforces tenant separation at the database query layer rather than relying on client-side routing:

- **Patient Access Scope**:
  - Authenticated via JWT bearer tokens containing `role: 'patient'`.
  - Can only query their own active program (`GET /api/programs/active`), session history (`GET /api/sessions/mine`), and progress (`GET /api/progress/mine`).
  - Session uploads verify that the `program_exercise_id` belongs to an active program assigned to `req.user.id`.
- **Clinician Access Scope**:
  - Authenticated via JWT bearer tokens containing `role: 'clinician'`.
  - Can only view and edit patients assigned to them (`patient_profiles.clinician_id = req.user.id`).
  - Cross-tenant attempts (e.g. attempting to review a session belonging to another clinician's patient) are rejected with HTTP `403 Forbidden`.
  - Patient stealing guards in `createProgram` and `linkPatient` prevent one clinician from claiming another clinician's patient.

---

## 3. Auditable Clinical Corrections

To protect patient trust and regulatory accountability:
- Automated machine measurements are **never deleted or overwritten**.
- When a clinician corrects an assessment (dismissing a false alert or calibrating a score), a distinct immutable record is written to `clinician_reviews` noting:
  - `clinician_id`
  - Exact timestamp (`created_at`)
  - Target error ID or adjusted score
  - Clinical rationale (`notes`)
- The effective view presents both the original machine calculation and the clinician-calibrated outcome side by side.
