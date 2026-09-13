// auth.ts
//
// WHAT: Express "middleware" functions. Middleware runs BEFORE the route's
//       main handler, and can either let the request continue (by calling
//       next()) or stop it (e.g. by sending a 401 error).
//
// WHY: Every rehab/patient/program endpoint needs to know WHO is calling it
//      (so a patient can't read another patient's data - Section 91/92 of
//      the spec) and WHAT ROLE they have (a patient shouldn't be able to
//      hit clinician-only routes). Instead of repeating that check in every
//      single controller, we write it once here and attach it to routes.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// We extend Express's Request type so TypeScript knows req.user can exist
// after our middleware runs. Without this, TypeScript would complain that
// "user" is not a known property of Request.
export interface AuthedRequest extends Request {
  user?: { id: number; role: 'patient' | 'clinician' };
}

/**
 * requireAuth
 * Reads the "Authorization: Bearer <token>" header, verifies the JWT
 * signature using our server secret, and if valid, attaches the decoded
 * { id, role } onto req.user so later code knows who is making the request.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization; // e.g. "Bearer eyJhbGciOi..."

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length); // strip the "Bearer " prefix

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as { id: number; role: 'patient' | 'clinician' };
    req.user = decoded;
    next(); // token is valid -> let the request continue to the actual route
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireRole
 * A "middleware factory": you call requireRole('clinician') and it RETURNS
 * a middleware function customized to that role. This lets us write
 * router.get('/patients', requireAuth, requireRole('clinician'), handler)
 */
export function requireRole(role: 'patient' | 'clinician') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: `This endpoint requires role: ${role}` });
    }
    next();
  };
}
