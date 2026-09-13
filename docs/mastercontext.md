MASTER IMPLEMENTATION PROMPT

Clinician-Calibrated Rehabilitation Quality & Progression System

I am a B.Tech student building a college project.

I am providing you with my current Flutter/Dart code at the end of this prompt. My teacher reviewed the initial concept and explicitly asked us to transform the project into a clinician-calibrated rehabilitation quality and progression system.

You must now take my existing code as the starting point and turn it into a complete, fully working, ready-to-run application, including:

- Patient mobile application
- Physiotherapist/clinician dashboard
- Backend
- Database
- Authentication
- Rehabilitation protocol assignment
- Camera-based exercise recording
- On-device pose estimation
- Movement-quality assessment
- Repetition/phase analysis
- Confidence and abstention
- Patient-reported pain/discomfort/difficulty
- Longitudinal progress tracking
- Therapist review
- Therapist correction
- Therapist approval/rejection of progression suggestions
- Existing useful health, medication and laboratory knowledge features, appropriately reduced in importance

Do NOT simply append these features to the old fitness app.

Reorganize the project around rehabilitation as the central workflow.

---

1. THE MOST IMPORTANT REQUIREMENT

This is a B.Tech project.

I must be able to understand the project and explain the code during my viva.

Therefore:

«Every single line of code that you write must be understandable to me.»

Not merely the important functions.

Not merely the architecture.

Not merely the files.

Every line.

This does NOT mean that the application should have very little code.

The application can contain a large amount of code.

What matters is that the code itself remains understandable.

Therefore:

Prefer

- Simple classes
- Simple functions
- Explicit variables
- Straightforward "if" statements
- Simple loops
- Simple SQL
- Simple REST APIs
- Clear database relationships
- Small files
- Descriptive names
- Comments where useful
- Simple data flow

Avoid

- Unnecessary design patterns
- Over-abstraction
- Complex generic programming
- Advanced state-management architecture
- Dependency injection frameworks
- Microservices
- Event-driven architecture
- GraphQL
- WebSockets
- Kubernetes
- Complex cloud architecture
- Custom ML training
- Custom neural networks
- Custom computer-vision algorithms
- AI agents
- RAG
- Vector databases
- LLM APIs
- Cloud AI APIs
- Unnecessary third-party packages

If a complicated solution and a simple solution can accomplish the same thing:

USE THE SIMPLE SOLUTION.

---

2. IMPORTANT: DO NOT ASK ME REPEATED QUESTIONS

I do not want to waste my daily Claude usage on repeated clarification.

The requirements in this prompt are the specification.

You should make reasonable engineering decisions yourself.

Do not repeatedly ask:

"What feature should I build next?"

"What database should I use?"

"Should I add this?"

"Do you want me to continue?"

Instead:

- Analyze the requirements.
- Analyze my existing code.
- Choose the simplest suitable architecture.
- Implement it.
- Explain your decisions.
- Continue through the project.

Only stop for something that is genuinely impossible or requires information that cannot reasonably be inferred.

Otherwise, make the best reasonable decision yourself.

---

3. THE ACTUAL PROJECT PROBLEM

The project is NOT:

"fitness tracker with medications"

The project is:

«A clinician-assigned home rehabilitation system in which a physiotherapist defines supported movements and progression criteria, the patient performs those movements using a phone camera, the application measures movement quality and consistency, and the clinician reviews the resulting evidence before progression.»

This connected workflow is the central technical contribution.

Everything else should support it.

---

4. PRIMARY USERS

There are two user roles.

ROLE 1 — PATIENT

The patient can:

- Log in
- View assigned rehabilitation program
- View today's prescribed exercises
- Read exercise instructions
- Perform an exercise using the phone camera
- Receive real-time positioning guidance
- Record a rehabilitation session
- Receive a movement-quality assessment when confidence is sufficient
- See repetitions and phases
- See movement-quality metrics
- Record pain/discomfort
- Record perceived difficulty
- Add injury/session notes
- View their historical progress
- View clinician feedback
- View approved program changes
- View their health/medication records when appropriate

The patient must NOT independently modify their rehabilitation prescription.

---

5. ROLE 2 — PHYSIOTHERAPIST / CLINICIAN

The clinician can:

- Log in
- View assigned patients
- Open patient profile
- View patient rehabilitation history
- Create rehabilitation programs
- Select supported exercises
- Define exercise-specific criteria
- Assign exercises to a patient
- Set target repetitions
- Set target sets
- Set allowed/expected movement range
- Set target tempo
- Set quality thresholds
- Review patient sessions
- View movement landmarks
- View movement metrics
- View failed/abstained attempts
- View pain/discomfort reports
- View adherence
- View trends
- View flagged sessions
- Correct an assessment
- Add clinician notes
- Accept/reject a progression suggestion
- Manually modify the program

The clinician remains the final authority.

---

6. CENTRAL WORKFLOW

The complete workflow should be:

CLINICIAN

↓

Creates/selects rehabilitation pathway

↓

Selects 4–5 supported exercises

↓

Defines exercise-specific criteria

↓

Assigns protocol to patient

↓

PATIENT

↓

Opens assigned rehabilitation program

↓

Selects today's exercise

↓

Reads instructions and camera positioning instructions

↓

Opens camera

↓

Application checks:

- Person visible
- Required joints visible
- Camera angle
- Landmark confidence
- Body position

↓

If recording is suitable:

Begin exercise

↓

Detect movement phases

↓

Detect repetitions

↓

Calculate movement metrics

↓

Assess quality

↓

Store session evidence

↓

Patient reports:

- Pain
- Discomfort
- Difficulty
- Injury-related note

↓

Application updates longitudinal progress

↓

If sufficient evidence exists:

Generate a simple progression suggestion

↓

CLINICIAN

↓

Reviews evidence

↓

Reviews landmark trace

↓

Reviews metrics

↓

Reviews pain/adherence

↓

Accepts or rejects progression

↓

If approved:

New program becomes active

This workflow is the heart of the application.

---

7. EXISTING CODE

I will provide my existing code after this prompt.

You MUST first audit it.

Do NOT blindly retain everything.

Identify:

Keep

Parts that are useful.

Modify

Parts that can remain but need changes.

Remove

Parts that contradict the new project direction.

Replace

Parts that are technically or scientifically weak.

For example, my existing medication and blood-report modules should NOT remain the dominant project features.

They should become secondary clinician-visible health context.

The rehabilitation system is the main project.

---

8. CURRENT TECHNOLOGY STACK

Use:

Patient Application

Flutter + Dart

Clinician Dashboard

Flutter Web + Dart

Use the same Flutter ecosystem where practical rather than introducing a separate frontend technology.

This keeps the overall project easier for me to understand.

Backend

Node.js + TypeScript + Express

Server Database

MySQL

Local Patient Database

SQLite

The patient application must be capable of working offline for its core rehabilitation functions.

---

9. OFFLINE + HOSTED REQUIREMENT

The project has two different requirements:

Patient application

Should continue functioning without internet for:

- Previously downloaded/assigned rehabilitation protocol
- Exercise instructions
- Camera
- Pose estimation
- Movement analysis
- Session recording
- Pain/discomfort entry
- Local progress history
- Local knowledge
- Local calculations

Hosted clinician dashboard

Requires internet because the clinician dashboard communicates with the backend.

The patient application should synchronize data with the backend when internet becomes available.

Therefore:

ONLINE:

Patient App
↕
Express Backend
↕
MySQL
↕
Clinician Dashboard

OFFLINE:

Patient App
↓
SQLite
↓
On-device pose model
↓
Local movement analysis
↓
Local session storage

When connectivity returns:

SQLite
↓
Synchronization
↓
Backend
↓
MySQL

Do not make the patient's exercise analysis dependent on an internet connection.

---

10. CAMERA REQUIREMENT

The patient must be able to use the phone camera while performing rehabilitation exercises.

Use a stable, maintained Flutter-compatible camera solution.

Flutter has an official "camera" plugin for accessing camera previews and capturing frames/video. Use the current compatible package/version rather than blindly copying an old dependency version.

Before implementing:

- Verify package compatibility with the current stable Flutter version.
- Use the simplest compatible implementation.
- Do not invent APIs or package names.

---

11. POSE ESTIMATION

The system requires body/joint landmarks.

Do NOT build a neural network from scratch.

Do NOT train an ML model.

Use an existing on-device pose estimation model/library capable of operating locally.

A suitable solution may be an established pose-detection system such as Google ML Kit or another stable on-device pose solution, provided it supports the required platforms and current Flutter setup.

ML Kit's pose detection provides 33 body landmarks and landmark confidence values, which are useful for the project's confidence/abstention requirement.

The pose model itself is a pretrained external technology.

I do NOT need to understand the internal neural-network mathematics.

However, I MUST understand:

- What the pose detector receives.
- What it returns.
- What a landmark is.
- What landmark coordinates represent.
- What landmark confidence means.
- How our application uses those landmarks.
- How our application calculates joint angles/distances.
- How our application determines movement phases.
- How our application determines repetitions.
- How our application determines movement quality.
- How the abstention system works.

Do not train anything.

Do not create a custom AI model.

---

12. WHAT COUNTS AS "AI" FOR THIS PROJECT

The pose-estimation model can be treated as a prebuilt AI/ML component.

I should be able to explain it at the appropriate level:

«"The application uses a pretrained on-device pose-estimation model to detect human body landmarks from camera frames. We then use normal mathematical calculations and rule-based rehabilitation criteria to analyze the movement."»

That is enough.

Do NOT introduce an LLM.

Do NOT use ChatGPT/Claude/Gemini APIs.

Do NOT make the application's medical decisions through generative AI.

---

13. MOVEMENT ANALYSIS

The most important technical feature is NOT repetition counting.

It is movement quality.

For every supported rehabilitation exercise:

Define:

- Required body landmarks
- Required camera orientation
- Start position
- End position
- Movement phases
- Repetition boundaries
- Relevant joint angles
- Range of motion
- Tempo
- Control
- Symmetry where applicable
- Exercise-specific compensations

---

14. DO NOT CREATE ONE GENERIC SCORING FORMULA

Different movements require different measurements.

Create an "ExerciseCriteria" structure/table.

For example:

Exercise:

Supported Exercise A

Required landmarks:

Shoulder
Elbow
Wrist

Camera:

Side view

Relevant angle:

Elbow angle

Phases:

Start
Lowering
Bottom
Rising
Finish

ROM target:

Defined by clinician

Tempo:

Defined by clinician

Possible compensation:

Trunk movement

This should be configurable.

---

15. REHABILITATION EXERCISES

Start with only approximately 4–5 carefully selected supported exercises.

Do not attempt to analyze every exercise in existence.

Choose exercises that are technically feasible to analyze reliably using body landmarks.

For example, depending on the final pose capabilities:

- Sit-to-stand
- Knee flexion/extension
- Shoulder flexion
- Bicep curl
- Squat-to-chair

However, select the final exercises based on the accuracy and visibility of the chosen pose system.

Each exercise should have clearly defined supported camera views.

---

16. EXERCISE-SPECIFIC CAMERA SETUP

Before recording, show instructions.

Example:

Camera position

"Place your phone approximately 2–3 metres away."

View

"Use a side view."

Body visibility

"Keep your full body visible."

Lighting

"Make sure the room is well lit."

Background

"Use a clear background."

The exact instructions should be configurable per exercise.

---

17. FRAME / BODY VISIBILITY CHECK

Before allowing assessment:

Check whether the required landmarks are visible with sufficient confidence.

Example:

For a knee exercise:

Required:

- Hip
- Knee
- Ankle

If the knee landmark is unstable:

Do NOT score the movement.

Instead:

"Your knee is not being detected reliably. Move farther from the camera and try again."

---

18. FULL BODY / REQUIRED JOINT CHECK

Do not always require the entire body.

The exercise should define its required landmarks.

For example:

Shoulder exercise

Required:

- Shoulder
- Elbow
- Wrist

Knee exercise

Required:

- Hip
- Knee
- Ankle

This makes the system more accurate and exercise-specific.

---

19. CAMERA ANGLE CHECK

Each exercise has a preferred camera orientation.

Do not try to create complicated computer vision to estimate camera geometry.

Use simple pose-based checks where feasible.

For example:

If the exercise is a side-view knee movement:

Check whether left/right landmarks have an appropriate visibility relationship.

If the criteria cannot reliably determine the view:

ABSTAIN.

Do not guess.

---

20. CONFIDENCE AND ABSTENTION

This is a NON-NEGOTIABLE feature.

The system must be capable of saying:

«"I cannot reliably assess this movement."»

rather than generating a bad score.

Abstain when:

- Required landmarks are missing.
- Landmark confidence is too low.
- Person is partially outside frame.
- Camera angle is unsuitable.
- Multiple people are detected.
- Movement is outside supported conditions.
- Tracking is unstable.
- Recording quality is insufficient.

---

21. CONFIDENCE SCORE

Create a simple confidence calculation.

For example:

Required landmark confidence values

↓

Calculate average/minimum confidence

↓

Compare with clinician/system threshold

Example:

Minimum acceptable confidence = 0.70

If:

minimum landmark confidence < 0.70

then:

ABSTAIN

The exact threshold should be configurable and clearly documented.

Do not make a complicated probabilistic model.

---

22. ABSTENTION OUTPUT

When confidence is insufficient:

DO NOT produce:

- Movement score
- Progression recommendation
- Quality grade

Instead display:

Assessment unavailable

Reason:

"Required landmarks were not detected reliably."

or:

"Camera position is unsuitable."

or:

"Part of your body was outside the frame."

Then allow:

Try again

---

23. MULTIPLE PEOPLE

The system should detect if multiple people are present where the chosen pose solution provides that information.

If the supported implementation cannot reliably isolate the patient:

ABSTAIN.

Do not accidentally assess the wrong person.

---

24. REPETITION DETECTION

Use simple mathematical logic.

For example:

Track an angle through time.

Example:

Knee angle sequence:

170°
160°
140°
120°
140°
160°
170°

Use thresholds to identify:

START
↓
LOWERING
↓
BOTTOM
↓
RISING
↓
COMPLETION

This is a deterministic state machine.

Explain the state machine clearly.

Do NOT use an AI model to count repetitions.

---

25. MOVEMENT PHASES

Each exercise should have defined phases.

Example:

Sit-to-stand

1. Start seated.
2. Rising.
3. Standing.
4. Returning.
5. Seated.

The exact phases should depend on the selected exercise.

Store them in the exercise criteria.

---

26. RANGE OF MOTION

Calculate relevant joint angles.

For example, for three points:

A = hip

B = knee

C = ankle

Calculate angle ABC.

Use a standard geometric formula.

The calculation should be implemented in a small understandable function.

For example:

"calculateAngle(pointA, pointB, pointC)"

Explain the mathematics.

---

27. ROM ASSESSMENT

Compare measured range with clinician-approved criteria.

Example:

Target knee flexion:

120°

Observed:

110°

Then:

"Target range not fully achieved."

Do not automatically diagnose impairment.

The clinician defines the acceptable range.

---

28. TEMPO

Track the duration of movement phases.

For example:

Lowering phase:
2.1 seconds

Rising phase:
1.8 seconds

Compare with clinician's prescribed target.

Example:

Target:

2–3 seconds

Observed:

1.2 seconds

Result:

"Faster than target."

The purpose is rehabilitation movement quality.

---

29. CONTROL

Create a simple measurable control metric.

For example:

- Unstable landmark trajectory
- Excessive sudden angle change
- Jerky movement
- Failure to maintain expected trajectory

Use simple mathematical thresholds.

Do not build machine learning.

---

30. SYMMETRY

Where bilateral exercise analysis is meaningful:

Compare:

Left-side angle

vs.

Right-side angle

For example:

left knee:
118°

right knee:
106°

difference:

12°

Compare with clinician-defined threshold.

If beyond threshold:

Flag possible asymmetry.

Use wording:

"Movement asymmetry detected."

Do NOT say:

"You have an injury."

---

31. EXERCISE-SPECIFIC COMPENSATIONS

Each supported exercise can have simple compensation rules.

Example:

For shoulder flexion:

Expected:

Shoulder angle increases.

Possible compensation:

Excessive trunk lean.

If trunk angle exceeds a predefined threshold:

Flag:

"Possible trunk compensation detected."

This must be presented as a movement observation, not a diagnosis.

---

32. QUALITY METRICS

For each valid repetition, calculate only the metrics relevant to the exercise.

Possible metrics:

Range of motion

Tempo

Control

Symmetry

Exercise-specific compensation

Do not force every exercise to use every metric.

---

33. QUALITY SCORE

Create a transparent score.

For example:

ROM = 40%

Tempo = 20%

Control = 20%

Compensation = 20%

The exact weights should be configurable.

Show the user/clinician how the score was calculated.

Example:

ROM:
85/100

Tempo:
90/100

Control:
80/100

Compensation:
95/100

Overall:

87/100

Do not hide the calculation.

---

34. DO NOT PRETEND THE SCORE IS CLINICAL TRUTH

The system's score should be described as:

"Movement quality score"

Not:

"Clinical diagnosis"

Not:

"Medical recovery score"

Not:

"Probability of recovery"

The clinician remains responsible for interpretation.

---

35. CLINICIAN-CALIBRATED CRITERIA

This is essential.

The therapist should define:

- Target ROM
- Acceptable ROM
- Target tempo
- Acceptable tempo
- Confidence threshold
- Symmetry threshold
- Compensation threshold
- Required repetitions
- Required sets

This prevents the software from inventing rehabilitation targets.

---

36. BASELINE ASSESSMENT

When the patient first starts a rehabilitation pathway:

The clinician can establish a baseline.

Store:

- Baseline ROM
- Baseline quality
- Baseline symmetry
- Baseline tempo
- Pain rating
- Difficulty
- Clinician notes

Future sessions are compared against this baseline.

---

37. PROGRESS ANALYSIS

For each patient, track across sessions:

- Adherence
- Pain
- Difficulty
- ROM
- Tempo
- Control
- Symmetry
- Compensation
- Quality score

Show trends.

Examples:

Quality:

62 → 68 → 71 → 76

ROM:

95° → 102° → 108° → 113°

Pain:

6 → 5 → 4 → 3

These are observations.

Do not claim medical causation.

---

38. IMPROVEMENT / DETERIORATION / PLATEAU

Implement simple rules.

Improvement

If quality increases consistently across a defined number of valid sessions.

Deterioration

If quality decreases consistently.

Plateau

If quality remains approximately unchanged across several valid sessions.

The threshold should be configurable.

Example:

If:

three or more valid sessions

AND

score changes by less than 3 points

then:

"Possible plateau."

Make the rule visible in the documentation.

---

39. INVALID SESSIONS MUST NOT DAMAGE THE TREND

This is very important.

If a session is abstained because of:

- Poor camera angle
- Low landmark confidence
- Body outside frame

do NOT include the session in movement-quality trends.

It can still be stored as an attempt.

Separate:

Valid assessment

from:

Aborted/abstained assessment

---

40. ADHERENCE

Track:

- Assigned sessions
- Completed sessions
- Missed sessions
- Valid recordings
- Abstained recordings

Example:

Assigned:
5

Completed:
4

Valid:
3

Abstained:
1

This gives a more meaningful rehabilitation adherence view.

---

41. PAIN TRACKING

For every session allow:

Pain:

0–10

Discomfort:

0–10

Perceived difficulty:

1–10

Allow optional note:

"Felt discomfort around the knee."

This is patient-reported data.

Do not interpret it diagnostically.

---

42. INJURY / SESSION NOTE

Allow:

- Free-text note
- Optional injury-related note

Display this prominently to the clinician.

Do not automatically diagnose an injury from the text.

---

43. PROGRESSION SUGGESTION

The application may make a simple suggestion for clinician review.

It must NOT prescribe treatment.

Example:

If:

- Multiple valid sessions meet quality threshold.
- ROM target is consistently achieved.
- Pain is stable or improving.
- No major compensation flags.
- Adherence is adequate.

Then:

"Progression may be worth clinician review."

This is a suggestion.

The clinician must approve or reject it.

---

44. NEVER AUTO-PROGRESS

The patient program must NOT automatically change because the algorithm says so.

Flow:

Assessment

↓

System suggests:

"Consider clinician review for progression."

↓

Clinician reviews evidence.

↓

Approve

OR

Reject

OR

Modify manually

Only after approval does the new protocol become active.

---

45. PROGRESSION AUDIT TRAIL

Store:

- Old protocol
- Suggested change
- Reason
- Clinician decision
- Clinician name
- Date
- Optional note

Example:

Suggested:

Increase target ROM from 105° to 115°.

Reason:

"Patient achieved current target in 4 consecutive valid sessions."

Clinician:

Dr. X

Decision:

Approved

Date:

...

---

46. THERAPIST REVIEW SCREEN

The clinician should see:

Patient

Name

Age

Assigned pathway

Current protocol

---

Latest session

Pain

Difficulty

Adherence

---

Movement quality

ROM

Tempo

Control

Symmetry

Compensations

Confidence

---

Landmark trace

Display the movement trajectory/landmark information.

---

Phase analysis

Start

Lowering

Bottom

Rising

Completion

Highlight the problematic phase.

---

Trend

Previous sessions vs current session.

---

System suggestion

"Possible progression review."

Buttons:

Approve

Reject

Modify

---

47. LANDMARK TRACE

Store enough information for the clinician to inspect the movement.

For each analyzed frame, store only the landmarks required for the selected exercise where possible.

Example:

timestamp

knee_x

knee_y

hip_x

hip_y

ankle_x

ankle_y

confidence

angle

phase

This can be visualized later.

Do not store enormous unnecessary video data by default.

---

48. FLAGGED PHASE

If quality is poor:

identify:

- Repetition number
- Phase
- Metric
- Observed value
- Expected value

Example:

Rep 4

Rising phase

Knee angle:

105°

Expected:

115°+

Flag:

Insufficient ROM

This is much more useful than simply saying:

"Score = 62."

---

49. VIDEO STORAGE

Prefer not to upload full videos to the server unless necessary.

For the first version:

Process video/camera frames locally.

Store:

- Metrics
- Landmark traces
- Session metadata
- Optional short evidence clip only if implementation is reliable and storage/privacy is acceptable

The main evidence should be numerical and traceable.

---

50. PRIVACY

Health and rehabilitation information is sensitive.

Do not unnecessarily store raw camera footage.

Do not send camera frames to cloud AI.

Do not send patient videos to external AI services.

Pose processing should happen locally.

Only synchronize the required rehabilitation evidence with the backend.

---

51. MEDICATION MODULE — REDUCE ITS ROLE

My current application contains medication information.

Keep it, but move it into a secondary clinician-visible area.

Medication history should be:

Optional

Manually entered

Clinician-visible where appropriate

Educational

It must NOT be used to claim:

"Medication caused the patient's movement problem."

It may show:

"Medication history available for clinician context."

Do not build causal medication analysis into rehabilitation progression.

---

52. BLOOD REPORT MODULE — REDUCE ITS ROLE

Keep manual laboratory data as optional health context.

The clinician may view:

- Test
- Result
- Unit
- Reference range
- Date

The application may provide basic educational interpretation.

But do NOT connect laboratory results to rehabilitation outcomes with causal claims.

Do NOT say:

"Your medication caused this movement deterioration because your blood result changed."

That is explicitly outside scope.

---

53. OLD FITNESS FEATURES

The original:

- Calories
- Macros
- Food database
- BMI
- BMR
- TDEE
- Workout tracker

can remain where useful, but they are now secondary.

Transform:

Workout

into:

Rehabilitation

The main activity is now clinician-assigned rehabilitation exercises.

Normal gym workout planning should no longer be the focus.

---

54. MAIN PATIENT NAVIGATION

Use approximately:

Home

Today's rehabilitation overview.

Program

Assigned rehabilitation protocol.

Record

Perform assigned exercise using camera.

Progress

Movement quality and adherence history.

Health

Optional health/medication/lab information.

Avoid a huge number of navigation tabs.

---

55. CLINICIAN NAVIGATION

Use:

Dashboard

Patients

Programs

Sessions

Reports

Knowledge

Keep it simple.

---

56. DATABASE REDESIGN

Audit my existing SQLite schema.

Keep useful tables but add the rehabilitation data model.

At minimum include:

users

id

name

email

password_hash

role

created_at

patient_profiles

user_id

age

sex

height

other relevant data

clinician_profiles

user_id

license/identifier if required for the prototype

rehabilitation_pathways

id

name

description

exercises

id

name

description

instructions

camera_view

required_landmarks

exercise_criteria

id

exercise_id

metric_name

target_value

minimum_value

maximum_value

unit

weight

rehabilitation_programs

id

patient_id

clinician_id

pathway_id

status

start_date

end_date

program_exercises

id

program_id

exercise_id

sets

repetitions

order_number

patient_baselines

id

patient_id

exercise_id

baseline_metrics

baseline_date

rehab_sessions

id

program_exercise_id

session_date

status

confidence

pain

discomfort

difficulty

injury_note

overall_score

session_repetitions

id

session_id

repetition_number

repetition_metrics

id

repetition_id

metric_name

value

expected_value

status

landmark_points

id

session_id

repetition_number

timestamp_ms

landmark_name

x

y

confidence

phase

progression_suggestions

id

program_id

exercise_id

suggestion

reason

status

created_at

clinician_reviews

id

session_id

clinician_id

decision

correction

notes

created_at

program_changes

id

program_id

old_value

new_value

reason

approved_by

approved_at

Also maintain the useful existing:

- medications
- lab markers
- user medications
- user lab results
- sources

where appropriate.

---

57. KEEP THE DATABASE UNDERSTANDABLE

Do not create a giant enterprise database.

Relationships should be easy to understand.

For example:

Patient

↓

Program

↓

Program Exercise

↓

Session

↓

Repetition

↓

Metrics

↓

Landmarks

That should be the main rehabilitation relationship.

---

58. LOCAL SQLITE SCHEMA

The patient application should have a local SQLite copy of:

- Current user
- Assigned rehabilitation program
- Exercise definitions
- Exercise criteria
- Knowledge articles
- Medication knowledge
- Relevant lab knowledge
- Session records
- Progress records

Do not put everything into one JSON field.

Use relational SQLite tables.

---

59. MYSQL SCHEMA

MySQL stores the synchronized clinician-side records.

The server should contain the corresponding normalized tables.

---

60. SYNCHRONIZATION

Implement a simple synchronization mechanism.

When online:

Local unsynchronized records

↓

POST to backend

↓

Backend validates

↓

MySQL stores data

↓

Local record marked synchronized

Keep synchronization simple.

Do not create a complicated conflict-resolution engine.

For conflicts:

Prefer clinician-approved server data for rehabilitation-program changes.

---

61. AUTHENTICATION

Two roles:

Patient

Clinician

After login:

Patient → Patient application.

Clinician → Clinician dashboard.

Use normal authentication.

Store passwords securely.

Do not store plaintext passwords.

---

62. BACKEND API

Create understandable REST endpoints.

Examples:

POST /auth/register

POST /auth/login

GET /patients

GET /patients/:id

GET /programs

POST /programs

PUT /programs/:id

GET /programs/:id/exercises

POST /sessions

POST /sessions/:id/metrics

GET /patients/:id/sessions

GET /patients/:id/progress

GET /patients/:id/labs

GET /patients/:id/medications

POST /progression-suggestions

POST /progression-suggestions/:id/approve

POST /progression-suggestions/:id/reject

Keep endpoints simple.

---

63. API DATA FLOW

For every API request, I should understand:

Flutter

↓

HTTP request

↓

Express route

↓

Controller

↓

Database query

↓

Response

↓

Flutter

Explain this.

Do not hide this behind unnecessary frameworks.

---

64. ON-DEVICE MOVEMENT ANALYSIS ARCHITECTURE

Use:

Camera

↓

Pose detector

↓

Landmarks

↓

Required landmark validation

↓

Confidence check

↓

Coordinate normalization

↓

Joint-angle calculations

↓

Movement phase detection

↓

Repetition detection

↓

Metric calculation

↓

Exercise-specific rule checks

↓

Quality score

↓

Abstention OR valid result

This is the core technical pipeline.

---

65. COORDINATE NORMALIZATION

Where appropriate, normalize landmark coordinates so the system is less sensitive to:

- Camera resolution
- Person's distance from camera
- Frame dimensions

Keep the implementation understandable.

Explain why normalization is used.

---

66. JOINT ANGLE FUNCTION

Create a simple reusable function:

"calculateAngle(A, B, C)"

Explain:

- Vector BA
- Vector BC
- Dot product
- Magnitudes
- arccos
- Result in degrees

Do not use a mysterious package to calculate basic geometry if it can reasonably be written in a few understandable lines.

---

67. MOVEMENT STATE MACHINE

Implement a simple state machine.

For example:

START
  ↓
MOVING_DOWN
  ↓
BOTTOM
  ↓
MOVING_UP
  ↓
COMPLETE

The exact states depend on the exercise.

Store the current phase.

When the angle crosses a threshold:

Change phase.

When the complete movement returns to the start state:

Count repetition.

The state machine must be easy for me to explain.

---

68. TEMPORAL SMOOTHING

Raw landmarks may jump slightly between frames.

Use a simple smoothing method if necessary.

For example:

Moving average over the last N measurements.

Explain:

"Instead of using one noisy value, we average recent values to make the movement signal more stable."

Do not use an advanced filtering algorithm unless absolutely necessary.

---

69. LANDMARK CONFIDENCE

Use the pose detector's confidence information where available.

For every required landmark:

Check confidence.

If any critical landmark falls below threshold for too much of the recording:

Mark the assessment unreliable.

Do NOT manufacture a score.

---

70. RECORDING QUALITY

Create an assessment quality state:

VALID

Enough evidence exists.

ABSTAINED

Insufficient evidence.

INCOMPLETE

User stopped recording too early.

INVALID

Unsupported condition.

This should be stored in the session.

---

71. CLINICIAN CORRECTION

A clinician should be able to select:

System assessment:

"Poor ROM"

Then change it to:

"Acceptable"

and add:

"Small deviation acceptable for this patient."

Store this correction.

Do not silently overwrite the original machine-generated result.

Keep:

Original assessment

+ 

Clinician correction

This creates an audit trail.

---

72. CLINICIAN APPROVAL

Progression suggestion states:

PENDING

APPROVED

REJECTED

MODIFIED

Only approved/modified progression becomes part of the active program.

---

73. PATIENT VIEW

The patient should not see confusing internal technical details.

The patient can see:

- Session completed
- Movement quality
- Repetitions
- Basic feedback
- Pain
- Difficulty
- Progress

Do not show raw mathematical debugging information unless desired.

---

74. CLINICIAN VIEW

The clinician should see more detailed information:

- Confidence
- Landmark traces
- Phase boundaries
- Raw metrics
- Flags
- Repetition-level results
- Trends
- Patient-reported pain
- Assessment history
- Clinician corrections

This creates a meaningful difference between patient and clinician interfaces.

---

75. KNOWLEDGE SYSTEM

Keep the existing health knowledge system but make rehabilitation knowledge more important.

Add:

Rehabilitation knowledge

- ROM
- Tempo
- Movement control
- Compensation
- Exercise phases
- Adherence
- Recovery
- Pain reporting
- Progression principles
- Why clinician review matters

This should be stored locally.

---

76. SOURCES

For medical/rehabilitation knowledge:

Store:

- Source
- Source URL
- Evidence level
- Last reviewed
- Knowledge version

Do not invent sources.

Do not present generic AI-generated text as medical fact.

---

77. MEDICAL DISCLAIMER

Include:

«"This application supports rehabilitation tracking and movement assessment. It does not diagnose injuries or medical conditions and does not replace assessment or treatment by a qualified healthcare professional."»

Also:

«"Progression suggestions are recommendations for clinician review only. Rehabilitation programs are controlled by the treating clinician."»

---

78. CAMERA SAFETY

Before recording:

Display:

"Perform the exercise only as instructed by your clinician."

"If you experience significant pain, stop the exercise and contact your healthcare professional."

Do not encourage pushing through pain.

---

79. NO AUTOMATIC MEDICAL DECISIONS

The system must never:

- Diagnose injury
- Diagnose disease
- Automatically prescribe rehabilitation
- Automatically increase exercise difficulty
- Automatically decrease exercise difficulty
- Tell the patient to ignore pain
- Tell the patient they are medically recovered

It can measure and flag.

The clinician decides.

---

80. QUALITY SCORE TRANSPARENCY

The clinician should be able to open:

Why was this score given?

And see:

ROM:
85

Tempo:
90

Control:
78

Symmetry:
92

Compensation:
88

Then the weighting.

Example:

Overall:

85.5

All calculations must be visible and deterministic.

---

81. NO BLACK BOX

For every movement score:

The clinician should know:

Input

↓

Calculation

↓

Rule

↓

Output

For example:

Observed ROM = 108°

Target ROM = 120°

ROM score = ...

No unexplained machine-learning score.

---

82. PROJECT COMPLEXITY

The project is allowed to be technically substantial because the teacher explicitly said the previous project was too simple.

However:

Do not make it unnecessarily complicated.

The sophistication should come from the connected rehabilitation workflow.

Not from complicated software architecture.

The technically impressive aspects should be:

- On-device pose estimation
- Landmark-based geometry
- Movement phase detection
- Repetition segmentation
- Quality metrics
- Abstention
- Clinician calibration
- Longitudinal analysis
- Therapist review
- Progression approval
- Patient/clinician role separation

Those are enough.

---

83. NO SOCIAL FEATURES

Do NOT add:

- Friends
- Public profiles
- Leaderboards
- Competition
- Public rankings
- Likes
- Followers
- Social feed
- Points based on pain
- Points based on recovery

These are explicitly out of scope.

---

84. NO FEATURE FOUNTAIN

Do NOT turn the application into:

- Fitness social network
- Calorie super-app
- Medication marketplace
- Telemedicine platform
- Doctor booking application
- E-commerce application
- General wellness platform

The single connected rehabilitation problem is the priority.

---

85. TECHNICAL QUALITY

The final project must be:

- Fully runnable
- Functional
- No placeholder buttons
- No fake API responses
- No fake pose results
- No hardcoded patient progress pretending to be real
- No broken navigation
- No unexplained missing screens
- No dummy functionality presented as complete

If demo data is used:

Clearly label it as demo data.

---

86. PACKAGE REQUIREMENTS

Keep dependencies limited.

Only use packages that genuinely solve necessary problems.

Likely categories:

- Camera
- On-device pose estimation
- SQLite
- HTTP networking
- Secure local storage/authentication support
- Charts

Before adding each dependency:

Explain:

- Why it is needed.
- What part of the application uses it.
- Whether it works offline.
- Whether it supports the required platform.
- What important API we use.

Use current stable compatible versions.

Do not copy outdated package versions from old tutorials.

---

87. CAMERA / POSE PACKAGE RULE

Do not invent package APIs.

Check the current documentation for the chosen package.

The current Flutter documentation confirms that plugins can expose platform capabilities such as the camera, and that plugin versions/compatibility matter.

If the first pose package has poor compatibility with the current Flutter version, choose another stable solution rather than forcing an incompatible dependency.

The final project must actually compile.

---

88. ERROR HANDLING

Handle:

- Camera unavailable
- Permission denied
- Pose detector initialization failure
- No person detected
- Multiple people
- Low landmark confidence
- Required landmark missing
- Wrong camera view
- User outside frame
- Recording too short
- Database failure
- Network unavailable
- Synchronization failure
- Authentication failure

Every failure should have a simple user-readable message.

---

89. OFFLINE ERROR BEHAVIOR

If internet disappears while the patient is exercising:

The exercise should continue.

The result should be stored locally.

Later:

Synchronize automatically/manual when online.

Do not make the patient repeat the session simply because the server was unavailable.

---

90. SYNCHRONIZATION STATUS

Show:

Synced

Waiting to sync

Sync failed

This should be understandable.

---

91. DATA OWNERSHIP

Patient data must belong to the correct patient.

A clinician must only see patients assigned to that clinician in the prototype.

A patient must not be able to access another patient's data.

Use backend authorization checks.

Do not rely only on Flutter screen restrictions.

---

92. DATABASE RELATIONSHIPS

Make sure the backend verifies ownership.

Example:

Patient A requests Patient B's session.

Backend:

Reject.

Do not trust IDs supplied by the frontend.

---

93. CLINICIAN PROGRAM ASSIGNMENT

The clinician can:

1. Select patient.
2. Select rehabilitation pathway.
3. Select supported exercises.
4. Set target sets/reps.
5. Set exercise criteria.
6. Add notes.
7. Assign.

Patient then receives the protocol.

---

94. REHABILITATION PATHWAY

Create a small number of demo pathways.

For example:

Knee Mobility Rehabilitation

Shoulder Mobility Rehabilitation

Lower-Limb Functional Rehabilitation

These are demo educational pathways.

Do NOT represent them as medically validated treatment protocols.

The clinician should define/approve the specific criteria.

---

95. BASELINE

Before normal tracking:

Clinician can record baseline session.

This gives the system something to compare future sessions against.

---

96. LONGITUDINAL DASHBOARD

The clinician should see graphs such as:

Movement Quality

Session 1
Session 2
Session 3
Session 4

ROM

Pain

Adherence

Confidence

Number of valid sessions

This is the project's longitudinal component.

---

97. FLAG SYSTEM

Flag:

- Low confidence
- Poor camera setup
- Missing landmarks
- Low ROM
- High compensation
- High asymmetry
- Unusually fast/slow tempo
- Increased pain
- Deteriorating quality
- Possible plateau

Flags are observations.

They do not constitute diagnoses.

---

98. PAIN + QUALITY MUST REMAIN SEPARATE

Do not calculate:

"Pain is 6 therefore movement score is 40."

Pain is a separate patient-reported variable.

The clinician sees both.

The application can flag:

"Pain increased compared with previous session."

But does not assume why.

---

99. PROGRESSION RULE

A sample progression rule can be:

IF:

valid sessions >= 3

AND

average movement quality >= configured threshold

AND

ROM target met consistently

AND

no major compensation flag

AND

pain has not worsened significantly

THEN:

create:

"Consider clinician review for progression."

Make this a configurable rule.

Do not automatically change the program.

---

100. PLATEAU RULE

Example:

If the last 4 valid sessions have movement quality within ±3 points:

Flag:

"Possible plateau."

Again:

This means the recorded metric has not changed significantly.

It does not mean biological recovery has stopped.

---

101. DETERIORATION RULE

Example:

If movement quality drops significantly over consecutive valid sessions:

Flag:

"Movement quality has decreased compared with recent sessions."

Do not say:

"Your injury is getting worse."

---

102. IMPROVEMENT RULE

Example:

If movement quality increases over several valid sessions:

"Movement quality has improved across recent valid sessions."

Do not say:

"Your injury has healed."

---

103. REPORTING

Clinician can open a patient progress report containing:

- Program
- Exercises
- Session adherence
- Quality trends
- ROM trends
- Pain trend
- Difficulty trend
- Flags
- Clinician notes
- Progression decisions

Do not make the report excessively complicated.

---

104. PATIENT PROGRESS

Patient sees:

- Sessions completed
- Movement-quality trend
- ROM trend where appropriate
- Pain trend
- Difficulty trend
- Clinician comments

Avoid presenting medical conclusions.

---

105. EXISTING "Calculations" CLASS

Audit the current "calculations.dart".

Keep useful functions but correct any scientifically weak assumptions.

Do not blindly preserve the existing statements about:

- Universal calorie deficits
- Universal macro targets
- Body-fat estimates
- Universal lab ranges

Make the limitations clear.

---

106. IMPORTANT: AUDIT THE CURRENT MEDICATION DATA

My existing medication seed data is a prototype and contains statements such as "Moderate" evidence and generic source descriptions.

Do NOT assume it is production-quality.

Before integrating it:

1. Check the internal consistency.
2. Identify unsupported or overconfident claims.
3. Remove questionable interaction claims if they cannot be supported.
4. Use authoritative references where possible.
5. Do not falsely label information as "High" evidence.
6. Store source information honestly.

For example:

If a relationship is uncertain:

Evidence level:

"Limited"

rather than pretending certainty.

---

107. IMPORTANT: AUDIT CURRENT LAB DATA

My existing lab seed data uses generic reference ranges.

Do not present these as universal clinical cutoffs.

Keep them as:

Typical/reference information

and require the user's actual laboratory range for individual interpretation where available.

This is especially important for:

- Hemoglobin
- Vitamin D
- Lipids
- TSH
- Creatinine
- Other markers with context-dependent interpretation

---

108. MEDICATION AND LABS ARE SECONDARY

The central database relationship should now be:

Patient

↓

Rehabilitation Program

↓

Exercise

↓

Session

↓

Movement Evidence

↓

Progress

↓

Clinician Decision

Medication and laboratory records sit beside this as optional clinical context.

---

109. APPLICATION SCREEN MAP

PATIENT

Authentication

- Login
- Register

Home

- Today's protocol
- Next session
- Recent progress
- Pain
- Latest clinician message

Program

- Assigned pathway
- Exercises
- Criteria
- Instructions

Record Exercise

- Setup instructions
- Camera preview
- Landmark overlay
- Recording
- Live quality/setup feedback
- Assessment
- Retry if abstained

Session Result

- Valid/abstained
- Quality
- Repetitions
- ROM
- Tempo
- Control
- Flags
- Pain
- Difficulty

Progress

- Quality graph
- ROM graph
- Pain graph
- Adherence

Health

- Measurements
- Labs
- Medications

Knowledge

- Rehabilitation
- Fitness
- Nutrition
- Medication

---

110. CLINICIAN SCREEN MAP

Login

Dashboard

- Patient count
- Sessions awaiting review
- Flagged sessions
- Pending progression suggestions

Patients

Patient Detail

- Profile
- Active program
- Session history
- Trends
- Health context

Program Builder

- Pathway
- Exercise selection
- Sets
- Reps
- Criteria

Session Review

- Landmark trace
- Metrics
- Phase timeline
- Flags
- Confidence
- Patient-reported response

Progression

- Suggestion
- Evidence
- Approve
- Reject
- Modify

Knowledge

- Rehabilitation information
- Medication information
- Lab information

---

111. UI STYLE

Use a professional healthcare/rehabilitation aesthetic.

Do NOT make it:

- Gaming-like
- Neon
- Futuristic
- Over-animated
- Social-media-like

Use:

- Clean typography
- Clear status indicators
- Simple charts
- Good spacing
- Accessible color contrast
- Dark/light theme if easy to support

Healthcare applications should prioritize clarity.

---

112. CAMERA UI

During exercise:

Show:

Required view

Body outline/landmark overlay

Detection status

Examples:

"Person detected"

"Move farther away"

"Left knee not detected"

"Camera angle acceptable"

"Ready"

Do not overwhelm the patient.

---

113. RECORDING STATES

Use:

SETUP

READY

RECORDING

ANALYZING

VALID

ABSTAINED

ERROR

This should be obvious in the UI.

---

114. SESSION DATA

Every session should contain enough information to answer:

- When?
- Which exercise?
- Which program?
- Which patient?
- Was it valid?
- Why did it abstain?
- Confidence?
- How many repetitions?
- What was ROM?
- What was tempo?
- What was control?
- What compensation occurred?
- Pain?
- Difficulty?
- Clinician correction?
- Was progression suggested?
- Was progression approved?

---

115. CLINICIAN EVIDENCE VIEW

A clinician should NOT have to trust the score blindly.

They should be able to inspect:

Score

↓

Underlying metrics

↓

Flagged phase

↓

Landmark trajectory

↓

Patient-reported response

This is what makes it a clinician-calibrated system rather than a black box.

---

116. PROJECT DEMONSTRATION SCENARIO

Create demo data for:

Clinician

Dr. Demo

Patient

Patient Demo

Program

Knee Mobility Rehabilitation

Exercises

4–5 supported movements

Then demonstrate:

1. Clinician assigns program.
2. Patient logs in.
3. Patient opens exercise.
4. Camera starts.
5. Pose landmarks appear.
6. Correct camera setup is detected.
7. Patient performs repetitions.
8. Application detects phases.
9. Metrics are calculated.
10. Session receives a quality score.
11. Pain/difficulty entered.
12. Progress updates.
13. Clinician opens dashboard.
14. Clinician reviews the session.
15. Clinician sees flagged repetition.
16. System suggests progression review.
17. Clinician approves or rejects.
18. Patient sees updated approved program.

This must work end-to-end.

---

117. DEMO FAILURE SCENARIO

Also demonstrate abstention.

Example:

Patient moves partially outside frame.

Application:

"Assessment unavailable: required landmarks are not visible."

Patient retries.

This is important because the teacher explicitly requested confidence/abstention.

---

118. TEST CASES

Create tests for:

Camera

- Permission denied
- Camera unavailable

Pose

- No person
- Required landmark missing
- Low confidence
- Multiple people
- Person outside frame

Movement

- Valid repetition
- Incomplete repetition
- Wrong phase order
- Insufficient ROM
- Excessive compensation
- Abnormal tempo

Progress

- Improvement
- Deterioration
- Plateau

Program

- Assignment
- Approval
- Rejection
- Modification

Security

- Patient cannot access another patient
- Clinician cannot modify unauthorized patient
- Invalid token rejected

---

119. UNIT TEST EXAMPLE

Test:

"calculateAngle()"

Input:

Known coordinates.

Expected:

Known angle.

Test:

"calculateTrainingVolume()"

Test:

"classifyLabResult()"

Test:

"calculateMovementQuality()"

Test:

"shouldAbstain()"

Test:

"detectPhase()"

Test:

"detectRepetition()"

Each function should have simple inputs and expected outputs.

---

120. DOCUMENTATION

Create:

README.md

Include:

- Project purpose
- Features
- Architecture
- Setup
- Flutter installation
- Backend setup
- MySQL setup
- SQLite setup
- Running patient app
- Running clinician dashboard
- Camera permissions
- Pose model setup
- Demo credentials
- Testing

---

121. CREATE "ARCHITECTURE.md"

Explain:

Patient App

↓

Local SQLite

↓

Offline movement analysis

↓

Sync API

↓

Express

↓

MySQL

↓

Clinician Dashboard

Explain each component in simple language.

---

122. CREATE "POSE_ANALYSIS.md"

Explain:

- What pose estimation means.
- What landmarks are.
- What confidence means.
- Which landmarks each supported exercise uses.
- How angles are calculated.
- How phases are detected.
- How repetitions are detected.
- How ROM is calculated.
- How tempo is calculated.
- How control is calculated.
- How symmetry is calculated.
- How compensations are detected.
- How quality score is calculated.
- When the system abstains.

This document must be understandable by me.

---

123. CREATE "MEDICAL_SAFETY.md"

Explain:

- This is not a diagnostic system.
- The clinician controls rehabilitation.
- Medication information is educational.
- Lab interpretation is educational.
- Progression suggestions require clinician approval.
- The system can abstain.
- The system does not claim causation.

---

124. CREATE "AI_USAGE.md"

This is required because my teacher requires AI use.

Document genuine AI-assisted development.

For example:

- Architecture design
- Database design
- UI generation
- Code generation
- Debugging
- Test creation
- Documentation
- Code review
- Explanation of APIs

The final application itself does not use an LLM.

The pose-estimation model is an external pretrained on-device ML component.

Explain this distinction clearly.

---

125. CREATE "VIVA_GUIDE.md"

For every important part of the application, provide:

What is it?

Why did we use it?

How does it work?

What input does it receive?

What output does it produce?

What are its limitations?

What could go wrong?

How do we handle the failure?

Include:

- Flutter
- Dart
- SQLite
- Node.js
- Express
- REST
- MySQL
- Authentication
- Camera
- Pose estimation
- Landmarks
- Joint angles
- State machines
- Repetition detection
- ROM
- Tempo
- Quality score
- Confidence
- Abstention
- Synchronization
- Clinician approval

---

126. LINE-BY-LINE TEACHING

Whenever you create code during development:

Do NOT dump hundreds of lines.

For every manageable code block:

First explain the concept.

Then:

Show the code.

Then:

Explain EVERY LINE.

For example:

final double angle = calculateAngle(
  hip,
  knee,
  ankle,
);

Explain:

"final"

"double"

"angle"

"="

"calculateAngle"

"hip"

"knee"

"ankle"

";"

Nothing should remain unexplained.

---

127. THIRD-PARTY LIBRARIES

For a third-party package, I do not need to understand the internal implementation of the package.

However, I must understand:

- Why we selected it.
- What its API does.
- What our code passes to it.
- What it returns.
- What errors it can produce.
- How our code handles those errors.

Do not pretend we wrote the ML model ourselves.

---

128. SIMPLE ML EXPLANATION

For the pose model, my viva explanation should be approximately:

«"We use a pretrained on-device pose-estimation model. The camera provides frames, the model detects body landmarks, and our own program performs the rehabilitation calculations using those landmarks. We did not train the model ourselves."»

That should be sufficient.

Do not create custom ML training.

---

129. NO CLOUD AI

Camera frames must NOT be:

- Uploaded to Claude
- Uploaded to OpenAI
- Uploaded to Gemini
- Sent to a third-party AI server

Pose processing should happen on the device.

This is important for privacy and offline operation.

---

130. SECURITY

Implement:

- Password hashing
- Authentication tokens
- Role-based access
- Authorization checks
- Input validation
- Secure API routes

Do not expose:

- Passwords
- Authentication tokens
- Sensitive patient data

in logs.

---

131. DATA VALIDATION

Validate:

- Age
- Height
- Weight
- Sets
- Repetitions
- Pain scale
- Difficulty scale
- Lab results
- Dates
- Exercise criteria
- Confidence thresholds

Do not accept obviously invalid values.

---

132. DATABASE VALIDATION

Use:

- Primary keys
- Foreign keys
- NOT NULL where appropriate
- Unique constraints where appropriate

Ensure patient/program/session relationships cannot become inconsistent.

---

133. NO HARDCODED USER DATA

Demo users may be seeded.

But the actual application must read patient/program/session information from the database.

Do not make the UI pretend that:

"Patient A has quality 82"

just because that text was hardcoded in the screen.

---

134. NO FAKE CAMERA ANALYSIS

Do not create a fake camera screen that simply returns prewritten scores.

The camera must actually produce frames.

The pose detector must actually process them.

The movement-analysis code must actually calculate the result.

If the pose detector cannot confidently analyze the exercise:

ABSTAIN.

---

135. NO FAKE CLINICIAN DASHBOARD

The clinician dashboard must actually retrieve data from the backend.

Changes made by the clinician must be saved.

The patient application must receive approved program changes after synchronization.

---

136. END-TO-END REQUIREMENT

The final application should support:

Clinician:

Create patient

↓

Assign program

↓

Patient receives program

↓

Patient records session

↓

Session saved locally

↓

Session syncs

↓

Clinician sees session

↓

Clinician reviews

↓

Clinician approves progression

↓

Patient receives approved update

This is the minimum complete loop.

---

137. IF INTERNET IS AVAILABLE

Synchronize normally.

138. IF INTERNET IS UNAVAILABLE

Patient can continue using previously downloaded information.

Store changes locally.

Show:

"Pending synchronization."

When connectivity returns:

Synchronize.

---

139. CLINICIAN DASHBOARD HOSTING

Prepare the Flutter web dashboard so it can be built for hosting.

Backend should also be deployment-ready.

Provide:

- Production build commands
- Environment variable structure
- MySQL configuration
- CORS configuration
- Authentication configuration
- Deployment instructions

Do not require a complicated cloud provider.

---

140. LOCAL DEVELOPMENT

The complete project should run locally.

Provide exact commands for:

Flutter patient app

Flutter web dashboard

Node backend

MySQL

Database initialization

Seed data

Testing

---

141. DO NOT LEAVE "TODO"

Do not leave:

TODO: implement this

for a required feature.

Do not leave:

return fakeData;

for a required feature.

Do not leave placeholder screens.

---

142. IF SOMETHING CANNOT BE FULLY IMPLEMENTED

Do NOT fake it.

Instead:

1. Implement the closest genuinely working version.
2. Clearly document the limitation.
3. Do not pretend the feature is more accurate than it is.

For example:

If a particular camera-angle check cannot be reliably determined:

Use the measurable landmark/confidence checks that actually work.

Then abstain when the camera suitability cannot be established.

---

143. ACCURACY PRINCIPLE

For rehabilitation:

A wrong score is worse than no score.

Therefore:

VALID HIGH-CONFIDENCE ASSESSMENT

is better than:

LOW-CONFIDENCE ESTIMATE

And:

ABSTENTION

is better than:

FALSE PRECISION.

---

144. CLINICIAN-CALIBRATION PRINCIPLE

The system does not decide what "good rehabilitation" universally means.

The clinician defines:

- Target movement
- Target ROM
- Acceptable range
- Tempo
- Quality thresholds
- Progression criteria

The software measures against those criteria.

This is the fundamental design philosophy.

---

145. FINAL ARCHITECTURE

The final architecture should conceptually be:

                ┌──────────────────────┐
                │   Clinician Dashboard│
                │      Flutter Web     │
                └──────────┬───────────┘
                           │
                           │ REST
                           │
                ┌──────────▼───────────┐
                │      Express API     │
                │ Node.js + TypeScript  │
                └──────────┬───────────┘
                           │
                           │ SQL
                           │
                ┌──────────▼───────────┐
                │       MySQL          │
                └──────────────────────┘

┌──────────────────────────────────────────────┐
│              PATIENT FLUTTER APP             │
│                                              │
│  UI                                          │
│   ↓                                          │
│  Local SQLite                                │
│   ↓                                          │
│  Camera                                      │
│   ↓                                          │
│  On-device Pose Estimation                   │
│   ↓                                          │
│  Landmarks                                   │
│   ↓                                          │
│  Geometry / Angles                           │
│   ↓                                          │
│  Phase Detection                             │
│   ↓                                          │
│  Repetition Detection                        │
│   ↓                                          │
│  Movement Quality Rules                      │
│   ↓                                          │
│  Confidence / Abstention                     │
│   ↓                                          │
│  Session Evidence                             │
└──────────────────────────────────────────────┘

When online:

Patient App ↔️ Express ↔️ MySQL ↔️ Clinician Dashboard

---

146. DEVELOPMENT ORDER

Build in this exact general order:

PHASE 1

Audit existing code.

Explain:

- What can stay.
- What must change.
- What must be removed.
- What must be corrected.

PHASE 2

Design final database.

PHASE 3

Create backend authentication and roles.

PHASE 4

Create clinician dashboard.

PHASE 5

Create rehabilitation program management.

PHASE 6

Create patient program view.

PHASE 7

Create camera functionality.

PHASE 8

Integrate on-device pose detection.

PHASE 9

Implement required landmark validation.

PHASE 10

Implement confidence/abstention.

PHASE 11

Implement joint-angle calculations.

PHASE 12

Implement phase detection.

PHASE 13

Implement repetition detection.

PHASE 14

Implement ROM/tempo/control/symmetry/compensation metrics.

PHASE 15

Implement movement quality scoring.

PHASE 16

Implement session storage.

PHASE 17

Implement pain/difficulty/injury notes.

PHASE 18

Implement longitudinal trends.

PHASE 19

Implement progression suggestions.

PHASE 20

Implement clinician review and approval.

PHASE 21

Implement synchronization.

PHASE 22

Integrate secondary medication/lab knowledge.

PHASE 23

Testing.

PHASE 24

Offline testing.

PHASE 25

Final UI/UX polish.

PHASE 26

Documentation.

PHASE 27

Viva preparation.

---

147. FINAL ACCEPTANCE TEST

The project is NOT finished until this entire scenario works:

Step 1

Start backend.

Step 2

Start MySQL.

Step 3

Open clinician dashboard.

Step 4

Create/login as clinician.

Step 5

Create/login as patient.

Step 6

Clinician assigns rehabilitation pathway.

Step 7

Patient receives assigned program.

Step 8

Patient opens exercise.

Step 9

Camera opens.

Step 10

Pose landmarks appear.

Step 11

Application validates required joints.

Step 12

Application checks confidence.

Step 13

Patient performs exercise.

Step 14

Application identifies phases.

Step 15

Application identifies repetitions.

Step 16

Application calculates movement metrics.

Step 17

Application calculates quality.

Step 18

Application can abstain when evidence is insufficient.

Step 19

Patient enters pain/difficulty.

Step 20

Session is stored locally.

Step 21

Session synchronizes to backend.

Step 22

Clinician sees the session.

Step 23

Clinician sees metrics.

Step 24

Clinician sees landmark trace.

Step 25

Clinician sees flagged phase.

Step 26

Longitudinal graph updates.

Step 27

System may create progression suggestion.

Step 28

Clinician approves/rejects.

Step 29

Approved change appears in patient's program.

Step 30

Patient can continue with the updated clinician-approved program.

---

148. FINAL QUALITY BAR

This project should NOT look like:

"A fitness app with a camera."

It should look like:

«A clinician-supervised rehabilitation measurement and progression system.»

The technical contribution should clearly be:

Clinician-defined rehabilitation criteria

+ 

On-device pose landmarks

+ 

Movement phase/repetition analysis

+ 

Movement quality metrics

+ 

Confidence and abstention

+ 

Longitudinal evidence

+ 

Clinician review

+ 

Clinician-approved progression

That is the project.

---

149. FINAL NON-NEGOTIABLE RULES

Remember all of these:

1. The rehabilitation workflow is the center of the application.
2. Do not turn it back into a generic fitness tracker.
3. The patient does not prescribe their own rehabilitation.
4. The clinician controls the program.
5. The system measures movement; it does not diagnose.
6. Progression is never automatic.
7. Every progression suggestion requires clinician approval.
8. A wrong movement score is worse than no score.
9. Use confidence and abstention.
10. Do not score unsupported cases.
11. Do not pretend pose estimation is perfect.
12. Use a pretrained on-device pose model rather than training an AI model.
13. Do not send patient video to cloud AI.
14. Camera analysis should work offline.
15. Patient core functionality should work offline.
16. Store health information carefully.
17. Medication and laboratory data are secondary context.
18. Do not claim medication caused an outcome.
19. Do not diagnose.
20. Do not prescribe.
21. Do not add social features.
22. Do not add unnecessary features.
23. Do not use unnecessary technologies.
24. Do not introduce an architecture I cannot explain.
25. Explain every line of code I am expected to submit.
26. Do not dump huge unexplained files.
27. Do not fabricate data or functionality.
28. Do not leave required functionality as TODOs.
29. Do not repeatedly ask me what to build next.
30. Build the complete working project.

---

150. START NOW

I will now provide my existing code.

Your first task is to audit the existing code against this specification.

Do not throw away useful work.

Explain:

1. What we can keep.

2. What must be modified.

3. What should be removed.

4. What is currently technically incorrect.

5. What new components are required.

6. What the final architecture will be.

Then begin converting the project into the complete working application.

Do not stop at architecture.

Do not stop at pseudocode.

Do not give me only snippets.

The goal is a fully working patient application + clinician dashboard + backend + database, with the complete rehabilitation workflow described above.

Build it incrementally, but continue through all required phases without repeatedly asking for permission.

---

EXISTING CODE STARTS BELOW

[PASTE MY CURRENT CODE HERE]

EXISTING CODE ENDS HERE