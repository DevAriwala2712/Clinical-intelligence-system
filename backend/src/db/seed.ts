// seed.ts
// Run with: npm run seed
// Populates the MySQL database with demo accounts and the 5-exercise
// catalog (Section 30/116). All demo records are clearly demo data - the
// app itself supports creating real accounts/programs through the normal
// register/createProgram endpoints; this script exists purely so the
// end-to-end demo scenario in Section 116 has something to click through.

import bcrypt from 'bcryptjs';
import { pool } from './pool';

// Same 5 exercises as patient_app/lib/rehab/exercise_definitions.dart -
// kept in sync manually for now (Section 59: MySQL stores the
// synchronized, clinician-side normalized copy of the same catalog).
const exercises = [
  {
    name: 'Sit-to-Stand',
    description: 'Rise from a seated position to standing, then return to sitting.',
    instructions: 'Sit on a stable chair, phone 2-3m away, side-on, full body visible.',
    camera_view: 'side',
    required_landmarks: 'leftHip,leftKnee,leftAnkle',
    phases: 'start_seated,rising,standing,returning,seated',
    criteria: [
      { metric_name: 'rom_deg', target_value: 160, unit: 'degrees', weight: 0.4 },
      { metric_name: 'tempo_min_sec', minimum_value: 1.5, unit: 'seconds', weight: 0.2 },
      { metric_name: 'tempo_max_sec', maximum_value: 4.0, unit: 'seconds', weight: 0.0 },
      { metric_name: 'control_max_jerk_deg', maximum_value: 25, unit: 'degrees/frame', weight: 0.2 },
      { metric_name: 'compensation_trunk_lean_deg', maximum_value: 30, unit: 'degrees', weight: 0.2 },
    ],
  },
  {
    name: 'Seated Knee Flexion',
    description: 'Extend the lower leg straight, then bend the knee back, while seated.',
    instructions: 'Sit side-on to the camera, 2m away, whole leg visible.',
    camera_view: 'side',
    required_landmarks: 'leftHip,leftKnee,leftAnkle,rightHip,rightKnee,rightAnkle',
    phases: 'start_bent,extending,extended,flexing,bent',
    criteria: [
      { metric_name: 'rom_deg', target_value: 120, unit: 'degrees', weight: 0.4 },
      { metric_name: 'tempo_min_sec', minimum_value: 1.5, unit: 'seconds', weight: 0.15 },
      { metric_name: 'tempo_max_sec', maximum_value: 3.5, unit: 'seconds', weight: 0.0 },
      { metric_name: 'control_max_jerk_deg', maximum_value: 20, unit: 'degrees/frame', weight: 0.15 },
      { metric_name: 'symmetry_max_diff_deg', maximum_value: 15, unit: 'degrees', weight: 0.3 },
    ],
  },
  {
    name: 'Shoulder Flexion',
    description: 'Raise the straight arm forward and upward, then lower it back down.',
    instructions: 'Stand facing the camera, 2-3m away, torso and arms visible.',
    camera_view: 'front',
    required_landmarks: 'leftHip,leftShoulder,leftElbow,leftWrist',
    phases: 'start_lowered,raising,raised,lowering,lowered',
    criteria: [
      { metric_name: 'rom_deg', target_value: 150, unit: 'degrees', weight: 0.45 },
      { metric_name: 'tempo_min_sec', minimum_value: 1.5, unit: 'seconds', weight: 0.15 },
      { metric_name: 'tempo_max_sec', maximum_value: 4.0, unit: 'seconds', weight: 0.0 },
      { metric_name: 'control_max_jerk_deg', maximum_value: 25, unit: 'degrees/frame', weight: 0.15 },
      { metric_name: 'compensation_trunk_lean_deg', maximum_value: 20, unit: 'degrees', weight: 0.25 },
    ],
  },
  {
    name: 'Elbow Flexion (Bicep Curl)',
    description: 'Bend the elbow to bring the hand toward the shoulder, then straighten fully.',
    instructions: 'Stand side-on to the camera, arm visible shoulder to hand.',
    camera_view: 'side',
    required_landmarks: 'leftShoulder,leftElbow,leftWrist',
    phases: 'start_extended,curling,flexed,lowering,extended',
    criteria: [
      { metric_name: 'rom_deg', target_value: 130, unit: 'degrees', weight: 0.5 },
      { metric_name: 'tempo_min_sec', minimum_value: 1.0, unit: 'seconds', weight: 0.2 },
      { metric_name: 'tempo_max_sec', maximum_value: 3.0, unit: 'seconds', weight: 0.0 },
      { metric_name: 'control_max_jerk_deg', maximum_value: 30, unit: 'degrees/frame', weight: 0.3 },
    ],
  },
  {
    name: 'Squat-to-Chair',
    description: 'Lower into a controlled squat until lightly touching a chair, then stand back up.',
    instructions: 'Stand in front of a chair, side-on to the camera, 2-3m away.',
    camera_view: 'side',
    required_landmarks: 'leftHip,leftKnee,leftAnkle',
    phases: 'start_standing,lowering,bottom,rising,standing',
    criteria: [
      { metric_name: 'rom_deg', target_value: 100, unit: 'degrees', weight: 0.35 },
      { metric_name: 'tempo_min_sec', minimum_value: 1.5, unit: 'seconds', weight: 0.15 },
      { metric_name: 'tempo_max_sec', maximum_value: 4.0, unit: 'seconds', weight: 0.0 },
      { metric_name: 'control_max_jerk_deg', maximum_value: 25, unit: 'degrees/frame', weight: 0.2 },
      { metric_name: 'compensation_trunk_lean_deg', maximum_value: 25, unit: 'degrees', weight: 0.3 },
    ],
  },
];

async function seed() {
  console.log('Seeding database...');

  // ---- Demo accounts ----
  const passwordHash = await bcrypt.hash('DemoPass123', 10);

  const [clinicianResult] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'clinician')",
    ['Dr. Demo', 'clinician@demo.com', passwordHash]
  );
  const clinicianId = (clinicianResult as any).insertId;
  await pool.query('INSERT INTO clinician_profiles (user_id) VALUES (?)', [clinicianId]);

  const [patientResult] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'patient')",
    ['Patient Demo', 'patient@demo.com', passwordHash]
  );
  const patientId = (patientResult as any).insertId;
  await pool.query(
    'INSERT INTO patient_profiles (user_id, age, sex, height_cm, clinician_id) VALUES (?, ?, ?, ?, ?)',
    [patientId, 45, 'female', 165.0, clinicianId]
  );

  // ---- Pathway ----
  const [pathwayResult] = await pool.query(
    'INSERT INTO rehabilitation_pathways (name, description) VALUES (?, ?)',
    ['Knee Mobility Rehabilitation', 'Demo educational pathway for lower-limb mobility. Not a validated clinical protocol - criteria are set per-patient by the treating clinician.']
  );
  const pathwayId = (pathwayResult as any).insertId;

  // ---- Exercises + criteria ----
  const exerciseIds: number[] = [];
  for (const ex of exercises) {
    const [exResult] = await pool.query(
      `INSERT INTO exercises (name, description, instructions, camera_view, required_landmarks, phases)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ex.name, ex.description, ex.instructions, ex.camera_view, ex.required_landmarks, ex.phases]
    );
    const exerciseId = (exResult as any).insertId;
    exerciseIds.push(exerciseId);

    await pool.query('INSERT INTO pathway_exercises (pathway_id, exercise_id) VALUES (?, ?)', [pathwayId, exerciseId]);

    for (const c of ex.criteria) {
      await pool.query(
        `INSERT INTO exercise_criteria (exercise_id, metric_name, target_value, minimum_value, maximum_value, unit, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [exerciseId, c.metric_name, (c as any).target_value ?? null, (c as any).minimum_value ?? null, (c as any).maximum_value ?? null, c.unit, c.weight]
      );
    }
  }

  // ---- Assign the pathway's exercises to the demo patient as a program ----
  const [programResult] = await pool.query(
    `INSERT INTO rehabilitation_programs (patient_id, clinician_id, pathway_id, status, start_date)
     VALUES (?, ?, ?, 'active', CURDATE())`,
    [patientId, clinicianId, pathwayId]
  );
  const programId = (programResult as any).insertId;

  for (const [index, exerciseId] of exerciseIds.entries()) {
    await pool.query(
      `INSERT INTO program_exercises (program_id, exercise_id, \`sets\`, repetitions, order_number)
       VALUES (?, ?, 3, 10, ?)`,
      [programId, exerciseId, index + 1]
    );
  }

  console.log('Seed complete.');
  console.log('Demo clinician login: clinician@demo.com / DemoPass123');
  console.log('Demo patient login:   patient@demo.com / DemoPass123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
