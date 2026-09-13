// exercise_definitions.dart
//
// WHAT THIS FILE DOES
// Defines the 4-5 supported exercises (Section 15). These were chosen
// because each one:
//   1. Can be captured from a single stable camera position.
//   2. Uses landmarks that Google ML Kit Pose Detection actually returns
//      (see the landmark name list below - these are ML Kit's real names,
//      not invented ones, per Section 87's "do not invent package APIs").
//   3. Has a clear, single dominant joint angle to track.
//   4. Has an obvious start/bottom/return phase shape.
//
// ML Kit Pose Detection returns 33 named landmarks, each with (x, y, z)
// and a likelihood/confidence value. The ones this app actually uses:
//   leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist,
//   leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle.
//
// This is metadata only - it is inserted into the exercises and
// exercise_criteria tables by db_helper.dart's seeding step. The clinician
// dashboard can create ADDITIONAL exercises through the Program Builder;
// these five are the built-in, demo-ready starting set.

class ExerciseDefinitionSeed {
  final String name;
  final String description;
  final String instructions;
  final String cameraView; // 'side' | 'front'
  final List<String> requiredLandmarks; // ML Kit landmark names
  final List<String> phases;
  final List<CriterionSeed> criteria;

  const ExerciseDefinitionSeed({
    required this.name,
    required this.description,
    required this.instructions,
    required this.cameraView,
    required this.requiredLandmarks,
    required this.phases,
    required this.criteria,
  });
}

class CriterionSeed {
  final String metricName;
  final double? targetValue;
  final double? minimumValue;
  final double? maximumValue;
  final String unit;
  final double weight;

  const CriterionSeed({
    required this.metricName,
    this.targetValue,
    this.minimumValue,
    this.maximumValue,
    required this.unit,
    required this.weight,
  });
}

final List<ExerciseDefinitionSeed> seedExercises = [
  // 1. SIT-TO-STAND - one of the most clinically standard functional
  // rehab measures (used in real physiotherapy as the "5x sit-to-stand
  // test"). Side view, hip/knee/ankle angle.
  ExerciseDefinitionSeed(
    name: 'Sit-to-Stand',
    description: 'Rise from a seated position to standing, then return to sitting.',
    instructions: 'Sit on a stable chair with feet flat on the floor. '
        'Place the phone about 2-3 metres away, side-on to you, at seat height. '
        'Keep your full body visible in frame throughout.',
    cameraView: 'side',
    requiredLandmarks: ['leftHip', 'leftKnee', 'leftAnkle'],
    phases: ['start_seated', 'rising', 'standing', 'returning', 'seated'],
    criteria: [
      CriterionSeed(metricName: 'rom_deg', targetValue: 160, unit: 'degrees', weight: 0.4),
      CriterionSeed(metricName: 'tempo_min_sec', minimumValue: 1.5, unit: 'seconds', weight: 0.2),
      CriterionSeed(metricName: 'tempo_max_sec', maximumValue: 4.0, unit: 'seconds', weight: 0.0),
      CriterionSeed(metricName: 'control_max_jerk_deg', maximumValue: 25, unit: 'degrees/frame', weight: 0.2),
      CriterionSeed(metricName: 'confidence_min', minimumValue: 0.70, unit: 'ratio', weight: 0.0),
      CriterionSeed(metricName: 'compensation_trunk_lean_deg', maximumValue: 30, unit: 'degrees', weight: 0.2),
    ],
  ),

  // 2. KNEE FLEXION/EXTENSION - seated, side view. Common post-surgical
  // knee rehab movement.
  ExerciseDefinitionSeed(
    name: 'Seated Knee Flexion',
    description: 'While seated, extend the lower leg straight, then bend the knee back.',
    instructions: 'Sit on a chair with your side to the camera, about 2 metres away. '
        'Make sure your whole leg, from hip to ankle, is visible.',
    cameraView: 'side',
    requiredLandmarks: ['leftHip', 'leftKnee', 'leftAnkle', 'rightHip', 'rightKnee', 'rightAnkle'],
    phases: ['start_bent', 'extending', 'extended', 'flexing', 'bent'],
    criteria: [
      CriterionSeed(metricName: 'rom_deg', targetValue: 120, unit: 'degrees', weight: 0.4),
      CriterionSeed(metricName: 'tempo_min_sec', minimumValue: 1.5, unit: 'seconds', weight: 0.15),
      CriterionSeed(metricName: 'tempo_max_sec', maximumValue: 3.5, unit: 'seconds', weight: 0.0),
      CriterionSeed(metricName: 'control_max_jerk_deg', maximumValue: 20, unit: 'degrees/frame', weight: 0.15),
      CriterionSeed(metricName: 'symmetry_max_diff_deg', maximumValue: 15, unit: 'degrees', weight: 0.3),
      CriterionSeed(metricName: 'confidence_min', minimumValue: 0.70, unit: 'ratio', weight: 0.0),
    ],
  ),

  // 3. SHOULDER FLEXION - standing, front-facing camera. Elbow/shoulder/hip angle.
  ExerciseDefinitionSeed(
    name: 'Shoulder Flexion',
    description: 'Raise the straight arm forward and upward, then lower it back down.',
    instructions: 'Stand facing the camera, about 2-3 metres away. '
        'Keep your torso and both arms visible in frame.',
    cameraView: 'front',
    requiredLandmarks: ['leftHip', 'leftShoulder', 'leftElbow', 'leftWrist'],
    phases: ['start_lowered', 'raising', 'raised', 'lowering', 'lowered'],
    criteria: [
      CriterionSeed(metricName: 'rom_deg', targetValue: 150, unit: 'degrees', weight: 0.45),
      CriterionSeed(metricName: 'tempo_min_sec', minimumValue: 1.5, unit: 'seconds', weight: 0.15),
      CriterionSeed(metricName: 'tempo_max_sec', maximumValue: 4.0, unit: 'seconds', weight: 0.0),
      CriterionSeed(metricName: 'control_max_jerk_deg', maximumValue: 25, unit: 'degrees/frame', weight: 0.15),
      CriterionSeed(metricName: 'compensation_trunk_lean_deg', maximumValue: 20, unit: 'degrees', weight: 0.25),
    ],
  ),

  // 4. BICEP CURL (rehab-paced, no/low weight) - standing, side view. Elbow angle.
  ExerciseDefinitionSeed(
    name: 'Elbow Flexion (Bicep Curl)',
    description: 'Bend the elbow to bring the hand toward the shoulder, then straighten fully.',
    instructions: 'Stand with your side to the camera, arm visible from shoulder to hand.',
    cameraView: 'side',
    requiredLandmarks: ['leftShoulder', 'leftElbow', 'leftWrist'],
    phases: ['start_extended', 'curling', 'flexed', 'lowering', 'extended'],
    criteria: [
      CriterionSeed(metricName: 'rom_deg', targetValue: 130, unit: 'degrees', weight: 0.5),
      CriterionSeed(metricName: 'tempo_min_sec', minimumValue: 1.0, unit: 'seconds', weight: 0.2),
      CriterionSeed(metricName: 'tempo_max_sec', maximumValue: 3.0, unit: 'seconds', weight: 0.0),
      CriterionSeed(metricName: 'control_max_jerk_deg', maximumValue: 30, unit: 'degrees/frame', weight: 0.3),
    ],
  ),

  // 5. SQUAT-TO-CHAIR - standing, side view. Hip/knee/ankle angle,
  // bilateral, similar to sit-to-stand but performed standing-first.
  ExerciseDefinitionSeed(
    name: 'Squat-to-Chair',
    description: 'Lower into a controlled squat until lightly touching a chair, then stand back up.',
    instructions: 'Stand in front of a stable chair, side-on to the camera, about 2-3 metres away.',
    cameraView: 'side',
    requiredLandmarks: ['leftHip', 'leftKnee', 'leftAnkle'],
    phases: ['start_standing', 'lowering', 'bottom', 'rising', 'standing'],
    criteria: [
      CriterionSeed(metricName: 'rom_deg', targetValue: 100, unit: 'degrees', weight: 0.35),
      CriterionSeed(metricName: 'tempo_min_sec', minimumValue: 1.5, unit: 'seconds', weight: 0.15),
      CriterionSeed(metricName: 'tempo_max_sec', maximumValue: 4.0, unit: 'seconds', weight: 0.0),
      CriterionSeed(metricName: 'control_max_jerk_deg', maximumValue: 25, unit: 'degrees/frame', weight: 0.2),
      CriterionSeed(metricName: 'compensation_trunk_lean_deg', maximumValue: 25, unit: 'degrees', weight: 0.3),
    ],
  ),
];
