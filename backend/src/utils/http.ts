// http.ts - small shared helpers for the controllers.

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4 does NOT catch a rejected promise from an `async` route handler:
 * without this wrapper a database error would be an unhandled rejection and
 * crash the whole process. Every route is wrapped so the error reaches the
 * central error handler in server.ts instead.
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Parses a route/query value into a positive integer, or null. */
export function parseId(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const isObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Trims a free-text field; empty/non-string -> null; truncates to `max`. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

/** Safe JSON.parse for stored JSON text columns. */
export function parseJson<T = any>(text: unknown): T | null {
  if (typeof text !== 'string' || text.length === 0) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

export const toIso = (d: unknown): string | null =>
  d instanceof Date ? d.toISOString() : typeof d === 'string' ? d : null;
