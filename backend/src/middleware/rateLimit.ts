// rateLimit.ts
//
// A tiny in-memory limiter for the login endpoint, so a password cannot be
// guessed by hammering it. Dependency-free on purpose. It is per-process, which
// is fine for a single-server deployment (documented in ARCHITECTURE.md).

import { Request, Response, NextFunction } from 'express';

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export function rateLimit(opts: { windowMs: number; max: number; keyFn: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.DISABLE_RATE_LIMIT === '1') return next(); // integration tests only
    const now = Date.now();
    const key = opts.keyFn(req);
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > opts.max) {
      res.setHeader('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  };
}

// Keep memory bounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}, 10 * 60 * 1000).unref();
