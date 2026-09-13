I understand your concerns, but I want to correct one important interpretation before we continue.

You have interpreted my requirement that "every line of code must be understandable to me" as a reason to reduce the scope of the application.

That is NOT what I meant.

My current understanding of programming/code is a constraint on how you teach and explain the implementation to me, not a constraint on how large, complete, or technically ambitious the final project should be.

My teacher has already reviewed our original project.

He explicitly told us that the original project is too simple and personally sent us an email specifying the additional technical requirements that he expects us to implement.

Therefore, reducing the project back to a small 2-exercise prototype because it is easier for me to understand would directly ignore the feedback from my teacher.

I want you to follow the teacher's requirements.

---

1. DO NOT REDUCE THE PROJECT SCOPE

The teacher's email is the authoritative project requirement.

The project must evolve from our original fitness/health application into:

«Clinician-Calibrated Rehabilitation Quality and Progression System»

The central workflow must be:

Physiotherapist

↓

Creates/selects rehabilitation pathway

↓

Assigns 4–5 supported rehabilitation movements

↓

Patient receives the program

↓

Patient performs exercises using phone camera

↓

On-device pose estimation detects landmarks

↓

System checks body/joint visibility and recording suitability

↓

Movement is divided into phases and repetitions

↓

System evaluates:

- Range of motion
- Tempo
- Control
- Symmetry where applicable
- Exercise-specific compensations

↓

System records:

- Adherence
- Pain/discomfort
- Perceived difficulty
- Injury/session note

↓

System maintains longitudinal movement-quality data

↓

System identifies:

- Improvement
- Deterioration
- Inconsistency
- Possible plateau

↓

Clinician reviews:

- Landmark trace
- Measurements
- Repetition data
- Flagged movement phase
- Confidence
- Patient-reported response

↓

System may suggest progression

↓

Clinician approves/rejects/modifies

↓

Only clinician-approved progression becomes active

That is the project.

Do not simplify this back into a normal fitness tracker.

---

2. MY CURRENT LEVEL OF UNDERSTANDING IS NOT THE PROJECT'S TECHNICAL LIMIT

I want to make this extremely clear.

When I said:

«"I need to understand every single line of code."»

I meant:

Teach me what you build.

I did NOT mean:

«"Only build things that a beginner would normally build."»

I am willing to learn.

If the project requires:

- Camera processing
- Pose estimation
- Landmark geometry
- State machines
- REST APIs
- Authentication
- SQL joins
- Local databases
- Backend communication
- Synchronization
- Data modeling
- Charts
- Longitudinal analysis

then teach me those things.

The application should still be properly implemented.

For example, if you introduce a state machine, don't remove it because it is slightly advanced.

Instead:

1. Explain what a state machine is.
2. Explain why rehabilitation movement analysis needs it.
3. Explain the states.
4. Explain the transitions.
5. Implement it.
6. Explain the code.

Do this throughout the project.

My learning ability should determine your explanations, not the application's capabilities.

---

3. I DO NOT WANT A SMALLER PROJECT

Your recommendation to implement only 2 exercises is reasonable from a software-engineering-risk perspective, but it is not what I am asking you to do.

The teacher specifically said the original project is too simple.

He specifically requested:

- 4–5 supported movements
- Patient application
- Clinician functionality
- Camera
- Movement analysis
- Quality metrics
- Confidence
- Abstention
- Longitudinal analysis
- Clinician review
- Progression suggestions
- Clinician approval/rejection
- Backend
- Fully working application

Therefore, implement those requirements.

If 5 exercises are technically feasible, implement 5.

If a particular exercise is unreliable with the selected pose technology, replace it with another exercise that is more reliably measurable.

Do not reduce the requirement to 2 merely because it is easier.

---

4. I WANT A REAL WORKING APPLICATION

This is extremely important.

I am NOT asking you to simply generate source code.

I want you to produce the project as a proper functional application.

That means:

- Working frontend
- Working backend
- Working database
- Working authentication
- Working navigation
- Working forms
- Working APIs
- Working camera
- Working pose processing
- Working movement analysis
- Working database persistence
- Working clinician dashboard
- Working patient workflow
- Working progression workflow
- Working synchronization if required
- Working error handling
- Working demo data
- Working tests

No fake functionality.

No "coming soon."

No placeholder buttons.

No fake movement-analysis output.

No hardcoded fake clinical results pretending to be calculated.

No pseudocode presented as completed functionality.

---

5. DO EVERYTHING THAT IS WITHIN YOUR CAPABILITIES

I understand that you have environment limitations.

However:

Do not use those limitations as a reason to unnecessarily reduce the project.

Use everything available to you to make the project as complete as possible.

You can:

- Design the architecture.
- Write the code.
- Create the database.
- Create the frontend.
- Create the backend.
- Create configuration files.
- Create seed data.
- Create tests.
- Create documentation.
- Create demo accounts/data.
- Create scripts.
- Create project files.
- Analyze dependencies.
- Review your own code.
- Fix inconsistencies.
- Refactor.
- Generate build instructions.
- Generate deployment configuration.
- Validate syntax where your environment permits.
- Run whatever tests/tools are available.
- Inspect generated files.
- Identify potential integration problems.
- Correct them.

Do not stop merely because the complete system is substantial.

---

6. IF FLUTTER IS NOT THE BEST OPTION IN YOUR ACTUAL ENVIRONMENT

I originally specified:

Flutter/Dart

Node.js/Express

MySQL

because that was my initial technology choice.

However, I am giving you permission to make a better technical choice if your environment genuinely supports another stack significantly better.

The priority is:

1. Fully functional application

2. Reliable camera/pose integration

3. Working frontend

4. Working backend

5. Working database

6. Good demonstration

7. Code I can learn and explain

8. Reasonable architecture

Technology choice comes after these requirements.

If Flutter is genuinely the strongest choice available to you:

Use Flutter.

If your environment supports another technology substantially better for producing a working camera + pose + frontend application, you may choose it.

Possible alternatives could include:

- Python
- C++
- Another appropriate framework

But do NOT change technologies just for novelty.

Do NOT move to C++ simply because it is technically powerful.

Do NOT move to Python if that makes the actual mobile application worse.

Choose the stack that gives you the best chance of producing a real working application within your capabilities.

---

7. IMPORTANT: DO NOT CONFUSE "CAN'T TEST HARDWARE HERE" WITH "CAN'T BUILD THE PROJECT"

If your environment cannot physically access a phone camera, that is understandable.

But you can still build:

- Camera abstraction
- Pose-processing pipeline
- Landmark data structures
- Movement-analysis engine
- Exercise criteria
- State machines
- Confidence calculations
- Abstention logic
- Database
- Backend
- Dashboard
- UI
- Tests
- Integration structure

If some hardware-specific component cannot be executed in your environment, clearly isolate it so that it can run on the target device.

Do NOT replace it with fake results.

The final project must contain the real implementation.

---

8. DO NOT GIVE ME AN EXCUSE BASED ON PROJECT SIZE

Yes, the project is large.

That is intentional.

My teacher told us to make it larger because the original application was too simple.

I understand that a professional clinical product would normally require a large team and extensive validation.

This is a college project prototype, not a commercial clinical product.

We are building a technically meaningful prototype demonstrating the architecture and workflow.

Therefore:

Do not say:

"This would take a professional team months."

I understand that.

I still want you to build the project.

Do not substitute project management advice for implementation.

---

9. HOWEVER, DO NOT FAKE CLINICAL VALIDATION

There is one important distinction.

I want a fully working technical prototype.

I do NOT want you to falsely claim:

- Clinical validation
- Medical certification
- Diagnostic accuracy
- Therapeutic effectiveness
- Clinical-grade accuracy

The application should honestly say that movement measurements are computational observations and that clinician approval is required.

The teacher wants the system architecture and functionality.

We do not need to pretend that our B.Tech prototype is an FDA-approved medical device.

---

10. THE APPLICATION'S TECHNICAL CONTRIBUTION

The project should demonstrate:

A. Clinician calibration

The clinician defines movement criteria.

B. On-device pose estimation

Camera → landmarks.

C. Landmark validation

Are required joints visible?

D. Confidence

Are the landmarks reliable?

E. Abstention

If not reliable:

Do not score.

F. Movement segmentation

Divide movement into phases.

G. Repetition detection

Detect actual repetitions.

H. Movement quality

Calculate relevant metrics.

I. Longitudinal analysis

Compare valid sessions over time.

J. Progression suggestion

Suggest clinician review.

K. Clinician decision

Approve/reject/modify.

That is what makes the project technically meaningful.

---

11. THE FOUR/FIVE EXERCISE REQUIREMENT

Implement approximately 4–5 supported exercises.

Do not choose arbitrary exercises just to satisfy the number.

Choose exercises that:

1. Can be captured using a phone camera.
2. Have sufficiently visible landmarks.
3. Can be represented by understandable geometry.
4. Have clear movement phases.
5. Have measurable ROM.
6. Allow repetition detection.
7. Allow at least one meaningful quality metric.
8. Can have an exercise-specific compensation rule.
9. Can have a suitable camera view.

For each exercise, explicitly define:

- Required landmarks
- Camera view
- Start state
- End state
- Phases
- ROM metric
- Tempo metric
- Control metric
- Symmetry metric if relevant
- Compensation metric
- Confidence requirements
- Abstention conditions

---

12. I WANT THE CURRENT CODE USED AS A FOUNDATION

I already gave you:

- "schema.dart"
- "seed_medications.dart"
- "seed_lab_markers.dart"
- "db_helper.dart"
- "calculations.dart"

Do NOT throw all of this away.

Audit it.

Keep what is useful.

Modify what needs modification.

Move medication/lab functionality to secondary clinician-visible health context as my teacher requested.

Expand the database with rehabilitation entities.

Correct scientifically weak assumptions.

---

13. THE EXISTING FITNESS SYSTEM SHOULD EVOLVE

The old application contained:

- Food
- Calories
- BMI
- BMR
- TDEE
- Macros
- Measurements
- Medication
- Laboratory reports
- Workouts

Do not make these the primary focus anymore.

The application should now be:

Rehabilitation-first

with:

Health/fitness knowledge as supporting functionality.

The old "workout planner" should become:

Clinician-assigned rehabilitation protocol.

---

14. I WANT BOTH SIDES

Do not build only the patient application.

I need:

Patient application

AND

Clinician dashboard

They must communicate through the backend.

The clinician should actually be able to:

- Create/assign a rehabilitation program.
- Select exercises.
- Set criteria.
- Review sessions.
- See metrics.
- See trends.
- See landmark traces.
- See flags.
- Review progression suggestions.
- Approve/reject progression.

The patient should actually receive the clinician-approved program.

---

15. BACKEND IS REQUIRED

My teacher specifically said:

«"Teacher wants a fully working app with both front end and back end."»

Therefore, do NOT remove the backend simply because SQLite would be easier.

Implement:

Frontend

↓

Backend API

↓

Database

for the connected clinician workflow.

At the same time, keep patient-side local storage where necessary for offline operation.

---

16. DATABASE

Use a proper relational database.

MySQL is preferred if practical.

SQLite can be used locally on the patient device.

The architecture should support:

Patient local data

↕

Synchronization API

↕

MySQL

↕

Clinician dashboard

---

17. OFFLINE REQUIREMENT

The core patient rehabilitation workflow should not collapse when the internet disappears.

At minimum:

- Previously assigned program remains available.
- Exercise instructions remain available.
- Camera works.
- Pose analysis works.
- Movement analysis works.
- Sessions can be stored locally.
- Pain/difficulty can be recorded.
- Progress can be viewed locally.

When internet returns:

Synchronize.

---

18. NO AI CHATBOT

Do NOT introduce an LLM.

The user should not ask:

"What is wrong with me?"

and receive an AI-generated medical answer.

Knowledge should remain deterministic and locally stored.

---

19. PRETRAINED POSE MODEL IS ACCEPTABLE

Using a pretrained pose-estimation model is acceptable.

I do not expect us to train a neural network.

Use an appropriate on-device pose-estimation solution.

The application architecture should be:

Camera

↓

Pose model

↓

Landmarks

↓

Our mathematics

↓

Our rules

↓

Movement quality

↓

Clinician review

The pose model is the ML component.

The rehabilitation analysis surrounding it is our application logic.

---

20. CONFIDENCE/ABSTENTION MUST BE REAL

Do not simply display a fake confidence percentage.

It should actually be calculated from available landmark confidence/tracking information and/or measurable recording conditions.

If evidence is inadequate:

ABSTAIN.

Example:

Required landmark confidence:

0.42

Threshold:

0.70

Result:

ABSTAIN

Reason:

"Required landmark confidence is too low."

No movement-quality score should be generated.

---

21. MOVEMENT QUALITY MUST BE MORE THAN REP COUNT

For every supported movement, use appropriate measurable variables.

Examples:

ROM

Maximum/minimum joint angle.

Tempo

Duration of movement phases.

Control

Variation/smoothness/stability of angle trajectory.

Symmetry

Difference between left and right measurements.

Compensation

Exercise-specific deviation from expected movement.

Not every exercise must use every metric.

---

22. MAKE THE ALGORITHM EXPLAINABLE

I need to be able to explain:

Camera frame

↓

Landmark coordinates

↓

Joint angle

↓

Phase

↓

Repetition

↓

Metric

↓

Threshold

↓

Score

The code should make this chain obvious.

---

23. PROGRESSION SYSTEM

The application may say:

«"Current performance meets the configured progression criteria. Clinician review recommended."»

It must NOT say:

«"You should increase your rehabilitation exercise."»

The clinician makes the decision.

---

24. LONGITUDINAL ANALYSIS

Use actual stored sessions.

Do not hardcode charts.

For example:

Session 1:
68

Session 2:
72

Session 3:
74

Session 4:
79

Calculate the trend from the database.

Support:

- Improvement
- Deterioration
- Inconsistency
- Plateau

using explicit rules.

---

25. INVALID DATA

Do not use abstained sessions to calculate movement-quality trends.

Store them separately.

For example:

Session:

ABSTAINED

Reason:

Low landmark confidence

This is useful evidence for the clinician but should not be treated as a valid movement-quality score.

---

26. CLINICIAN CORRECTION

If the system says:

"Poor ROM"

the clinician must be able to correct it.

The database should retain:

System result

+ 

Clinician correction

+ 

Clinician note

+ 

Timestamp

Do not overwrite the original result.

---

27. PROGRESSION AUDIT TRAIL

Store:

- Suggestion
- Evidence/reason
- Clinician decision
- Modification
- Date
- Clinician

This demonstrates proper clinician oversight.

---

28. HEALTH/MEDICATION INFORMATION

Keep the existing knowledge system.

But it is now secondary.

The clinician may see:

Medications

Laboratory results

Measurements

alongside rehabilitation information.

Do NOT claim:

"Medication X caused movement deterioration."

Do NOT claim:

"Blood marker Y caused poor rehabilitation."

These are outside scope.

---

29. APPLICATION MUST LOOK FINISHED

I want:

- Professional UI
- Empty states
- Loading states
- Error states
- Validation
- Navigation
- Forms
- Charts
- Confirmation dialogs
- Camera permissions
- Retry flows
- Session summaries
- Clinician review workflow

Not just raw functionality.

---

30. DEMO MODE

Create a complete seeded demonstration environment.

For example:

Clinician:

"clinician@demo.com"

Patient:

"patient@demo.com"

with appropriate safe demo passwords documented separately.

Seed:

- Patient
- Clinician
- Rehabilitation pathway
- 4–5 exercises
- Assigned program
- Criteria
- Historical sessions
- Example progress
- Example progression suggestion

BUT clearly label seeded records as demo data.

The actual application must also support creating new records.

---

31. REAL DATA FLOW

The demonstration must prove that the application is not a collection of disconnected screens.

For example:

Clinician changes exercise criterion

↓

Backend saves change

↓

Patient synchronizes

↓

Patient sees updated criterion

↓

Patient performs session

↓

Session stored

↓

Clinician dashboard receives it

↓

Clinician reviews it

↓

Clinician approves progression

↓

Patient receives approved update

This should actually work.

---

32. YOUR IMPLEMENTATION RESPONSIBILITY

Do not simply tell me:

"Here is how you could build it."

I already know the project is large.

I want you to build it.

Generate the actual project files.

When possible, create the complete project structure and files rather than making me manually copy fragments.

---

33. SELF-REVIEW YOUR OWN IMPLEMENTATION

Before declaring the project complete, perform a self-audit.

Check:

Frontend

- Does navigation work?
- Are forms connected?
- Are API calls connected?
- Are errors handled?

Backend

- Do routes exist?
- Do controllers work?
- Are database queries valid?
- Is authentication enforced?
- Is authorization enforced?

Database

- Are foreign keys correct?
- Are relationships correct?
- Are indexes useful?
- Can the required workflow be represented?

Pose

- Is the model actually integrated?
- Are landmarks used?
- Is confidence used?
- Can the system abstain?

Movement

- Are phases detected?
- Are repetitions detected?
- Are metrics calculated?

Clinician

- Can programs be assigned?
- Can sessions be reviewed?
- Can progression be approved/rejected?

Patient

- Can assigned programs be performed?
- Can sessions be stored?
- Can progress be viewed?

Offline

- Does local storage work?
- Does movement analysis work without internet?
- Are unsynced sessions retained?

---

34. DO NOT CLAIM TESTING YOU DID NOT PERFORM

This is important.

If you could not physically test a camera on a phone, say:

"Camera hardware integration requires final-device testing."

Do not say:

"Tested successfully on Android."

unless you actually tested it.

Likewise, if you cannot launch MySQL in your environment, provide the actual schema/setup and validate everything you can validate locally.

Be honest about what was and wasn't tested.

But still implement it.

---

35. WHEN YOU CANNOT TEST SOMETHING

Do not respond:

"I can't do this."

Instead:

1. Implement the component as correctly as possible.
2. Isolate the untestable hardware/environment dependency.
3. Create mocks/unit tests where appropriate.
4. Provide exact steps for final-device verification.
5. Continue implementing everything else.

Do not reduce the entire project because one component requires physical hardware.

---

36. I WANT THE BEST PRACTICAL VERSION, NOT THE SMALLEST VERSION

You should optimize for:

maximum useful functionality that remains technically coherent.

Not:

minimum code required to claim the feature exists.

If something can be implemented properly, implement it.

If something genuinely cannot be implemented reliably, create a clean abstraction and document the limitation.

---

37. DO NOT OVERENGINEER EITHER

I am NOT asking you to create an enterprise healthcare platform.

Avoid:

- Microservices
- Kubernetes
- Complex event systems
- Distributed tracing
- Huge architecture frameworks
- Advanced cloud infrastructure
- Custom ML training
- AI agents

The project should be substantial because of its actual rehabilitation functionality, not because of unnecessary software complexity.

---

38. MY LEARNING MODE

From this point onward, use this teaching style:

Build professionally.

Explain pedagogically.

That means:

You can use professional implementation techniques.

But after implementing them, explain them in simple language.

For example:

If you create:

"RehabilitationSessionService"

explain:

- Why the class exists.
- What data it receives.
- What it does.
- What it returns.
- Which database tables it touches.
- Which screen calls it.

Then explain the code line by line where appropriate.

---

39. DON'T MAKE ME CHOOSE BETWEEN FEATURES

Do not repeatedly ask:

"Do you want authentication?"

"Do you want charts?"

"Do you want offline support?"

"Should I implement the dashboard?"

The answer is already:

YES, if it is part of the specification.

Make reasonable implementation decisions yourself.

---

40. IF YOU HAVE TO PRIORITIZE

If you encounter an unavoidable implementation limitation, prioritize in this exact order:

Priority 1

Working rehabilitation workflow.

Priority 2

Camera + pose + movement analysis.

Priority 3

Confidence/abstention.

Priority 4

Clinician review/progression.

Priority 5

Patient/clinician backend.

Priority 6

Offline persistence/synchronization.

Priority 7

Secondary medication/lab/fitness features.

Priority 8

Visual polish.

Do not sacrifice the core rehabilitation system for cosmetic features.

---

41. FINAL PRODUCT DEFINITION

The final product should be described as:

«A clinician-supervised rehabilitation platform that uses on-device pose estimation and transparent movement-analysis algorithms to measure exercise quality, detect unreliable assessments, track longitudinal progress, and provide clinician-reviewable progression suggestions.»

Not:

"AI doctor."

Not:

"AI fitness coach."

Not:

"general fitness tracker."

---

42. WHAT I EXPECT FROM YOU NOW

Do NOT respond with another feasibility analysis.

Do NOT tell me that this is too large.

Do NOT recommend shrinking it.

Do NOT tell me that a real team would take months.

I already understand that.

Instead:

Step 1

Audit the code I supplied.

Step 2

Create the final architecture.

Step 3

Choose the best practical technology stack based on what you can actually support.

Step 4

Create the complete project structure.

Step 5

Implement the backend.

Step 6

Implement the database.

Step 7

Implement the patient application.

Step 8

Implement the clinician dashboard.

Step 9

Implement camera + pose estimation.

Step 10

Implement movement analysis.

Step 11

Implement confidence/abstention.

Step 12

Implement longitudinal progress.

Step 13

Implement clinician review.

Step 14

Implement progression approval.

Step 15

Integrate the existing medication/lab foundation appropriately.

Step 16

Add tests.

Step 17

Self-review the entire project.

Step 18

Fix obvious inconsistencies and errors.

Step 19

Create complete setup/run instructions.

Step 20

Create the documentation/viva material.

---

43. MOST IMPORTANT FINAL INSTRUCTION

Do not confuse "I need to understand the code" with "the application must be simple."

I want:

«A sophisticated project implemented using understandable code.»

Not:

«A simple project because sophisticated code might be difficult for me.»

Teach me the sophisticated parts.

My teacher has already told us the project needs to be bigger.

I am explicitly asking you to take the full requirement seriously and build the strongest working college-project version you can.

You have permission to make engineering decisions without asking me for confirmation at every step.

Use your capabilities fully.

Build the actual application, not merely a proposal for an application.

If your environment prevents you from physically testing a particular hardware component, isolate that limitation and continue building everything else.

Do not reduce the scope.

Do not substitute advice for implementation.

Do not give me another feasibility lecture.

Let's build the project.