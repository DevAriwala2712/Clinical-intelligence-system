// authController.ts
//
// POST /auth/register, POST /auth/login, GET /auth/me.
// Passwords are bcrypt-hashed (never stored or logged in plain text). Login
// gives the same error for "no such email" and "wrong password" so the
// endpoint cannot be used to discover which emails are registered.

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { AuthedRequest } from '../middleware/auth';
import { isEmail } from '../utils/http';

const SALT_ROUNDS = 10;

/**
 * POST /auth/register
 * body: { name, email, password, role: 'patient' | 'clinician', inviteCode? }
 * If CLINICIAN_INVITE_CODE is set on the server, registering as a clinician
 * needs the matching inviteCode - otherwise anyone could self-register as a
 * clinician and claim unassigned patients.
 */
export async function register(req: Request, res: Response) {
  const { name, email, password, role, inviteCode } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are all required' });
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 120) {
    return res.status(400).json({ error: 'name must be 1-120 characters' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'email is not a valid email address' });
  }
  if (role !== 'patient' && role !== 'clinician') {
    return res.status(400).json({ error: "role must be 'patient' or 'clinician'" });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }
  const requiredCode = process.env.CLINICIAN_INVITE_CODE;
  if (role === 'clinician' && requiredCode && inviteCode !== requiredCode) {
    return res.status(403).json({ error: 'A valid invite code is required to register as a clinician' });
  }

  const normalisedEmail = email.trim().toLowerCase();
  const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalisedEmail]);
  if ((existingRows as any[]).length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name.trim(), normalisedEmail, passwordHash, role]
  );
  const userId = (result as any).insertId;

  if (role === 'patient') {
    await pool.query('INSERT INTO patient_profiles (user_id) VALUES (?)', [userId]);
  } else {
    await pool.query('INSERT INTO clinician_profiles (user_id) VALUES (?)', [userId]);
  }

  const token = signToken(userId, role);
  return res.status(201).json({ token, user: { id: userId, name: name.trim(), email: normalisedEmail, role } });
}

/** POST /auth/login  body: { email, password } */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  const user = (rows as any[])[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id, user.role);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

/** GET /auth/me - who am I, plus (for patients) profile and assigned clinician. */
export async function me(req: AuthedRequest, res: Response) {
  const { id } = req.user!;
  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  const user = (rows as any[])[0];
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });

  let profile = null;
  let clinician = null;
  if (user.role === 'patient') {
    const [p] = await pool.query(
      `SELECT pp.age, pp.sex, pp.height_cm AS heightCm, pp.rehab_goal AS rehabGoal,
              pp.injury_history AS injuryHistory, pp.video_upload_consent AS videoUploadConsent,
              pp.video_consent_updated_at AS videoConsentUpdatedAt,
              c.id AS clinicianId, c.name AS clinicianName
       FROM patient_profiles pp LEFT JOIN users c ON c.id = pp.clinician_id
       WHERE pp.user_id = ?`,
      [id]
    );
    const row = (p as any[])[0];
    if (row) {
      const { clinicianId, clinicianName, ...rest } = row;
      profile = { ...rest, videoUploadConsent: !!rest.videoUploadConsent };
      clinician = clinicianId ? { id: clinicianId, name: clinicianName } : null;
    }
  }
  res.json({ user, profile, clinician });
}

function signToken(id: number, role: string) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn } as jwt.SignOptions);
}
