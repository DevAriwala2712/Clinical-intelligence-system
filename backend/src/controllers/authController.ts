// authController.ts
//
// WHAT: the actual logic behind POST /auth/register and POST /auth/login.
// WHY separated from routes.ts: routes.ts just maps a URL+HTTP verb to a
//      function. Keeping the function body in a separate "controller" file
//      keeps routes.ts short and readable (Section 63 data-flow diagram:
//      Flutter -> HTTP request -> Express route -> Controller -> DB -> Response).

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';

const SALT_ROUNDS = 10; // how many times bcrypt "scrambles" the password; 10 is the standard safe default

/**
 * POST /auth/register
 * body: { name, email, password, role: 'patient' | 'clinician' }
 */
export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;

  // ---- validation (Section 131 of spec: never accept obviously invalid values) ----
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are all required' });
  }
  if (role !== 'patient' && role !== 'clinician') {
    return res.status(400).json({ error: "role must be 'patient' or 'clinician'" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  // ---- check the email isn't already taken ----
  const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if ((existingRows as any[]).length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // ---- hash the password. We NEVER store the plain password (Section 61/130). ----
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // ---- insert the new user row ----
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  const userId = (result as any).insertId;

  // ---- create the matching profile row so patient_profiles/clinician_profiles
  //      always has exactly one row per user of that role ----
  if (role === 'patient') {
    await pool.query('INSERT INTO patient_profiles (user_id) VALUES (?)', [userId]);
  } else {
    await pool.query('INSERT INTO clinician_profiles (user_id) VALUES (?)', [userId]);
  }

  const token = signToken(userId, role);
  return res.status(201).json({ token, user: { id: userId, name, email, role } });
}

/**
 * POST /auth/login
 * body: { email, password }
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email]
  );
  const user = (rows as any[])[0];

  // We deliberately give the SAME error for "no such email" and "wrong
  // password" so an attacker can't use this endpoint to discover which
  // emails are registered.
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id, user.role);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

/** Builds a signed JWT containing the user's id and role. */
function signToken(id: number, role: string) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn } as jwt.SignOptions);
}
