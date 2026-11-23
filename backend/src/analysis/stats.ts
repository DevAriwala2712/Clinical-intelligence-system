// stats.ts - tiny, dependency-free statistics helpers used by the longitudinal analysis.

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values) as number;
  const variance = values.reduce((a, b) => a + (b - m) * (b - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Theil-Sen slope: the MEDIAN of the slopes between every pair of points.
 * Unlike a least-squares line, one extreme session barely moves it, which is
 * exactly the behaviour we want ("don't declare improvement from one good day").
 * x is the session index (0,1,2,...), y the score.
 */
export function theilSenSlope(y: number[]): number | null {
  if (y.length < 2) return null;
  const slopes: number[] = [];
  for (let i = 0; i < y.length; i++) {
    for (let j = i + 1; j < y.length; j++) {
      slopes.push((y[j] - y[i]) / (j - i));
    }
  }
  return median(slopes);
}

/** Residuals of y around the Theil-Sen line (intercept = median of y - slope*x). */
export function theilSenResiduals(y: number[]): number[] {
  const slope = theilSenSlope(y);
  if (slope === null) return [];
  const intercept = median(y.map((v, i) => v - slope * i)) as number;
  return y.map((v, i) => v - (intercept + slope * i));
}

/**
 * Robust spread: 1.4826 x the median absolute deviation. Behaves like a
 * standard deviation for well-behaved data, but a single outlier does not
 * inflate it - so one odd session is not mistaken for "inconsistent".
 */
export function robustSpread(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = median(values) as number;
  return 1.4826 * (median(values.map((v) => Math.abs(v - m))) as number);
}

export function round(value: number | null, digits = 1): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const f = Math.pow(10, digits);
  return Math.round(value * f) / f;
}
