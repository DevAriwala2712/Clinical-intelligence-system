// sessionValidation.ts
//
// Validates a session upload BEFORE the database is touched, and enforces the
// project's central safety rule: only an ASSESSED session (VALID / PARTIAL)
// may carry a score, repetitions, metrics or landmarks. An abstained session
// (LOW_CONFIDENCE / INVALID / UNSUPPORTED / INCOMPLETE / ABSTAINED) is stored
// with its reason only - any measurements the client sent are discarded, so a
// fabricated-looking number can never reach the clinician.
//
// Pure function: no DB, no Express. Unit-tested in analysisTests.ts.

export const ASSESSED_STATUSES = ['VALID', 'PARTIAL'] as const;
export const ABSTAINED_STATUSES = ['LOW_CONFIDENCE', 'INVALID', 'UNSUPPORTED', 'INCOMPLETE', 'ABSTAINED'] as const;
export const ALL_STATUSES = [...ASSESSED_STATUSES, ...ABSTAINED_STATUSES] as const;
export type SessionStatus = (typeof ALL_STATUSES)[number];

export interface MetricIn { metricName: string; value: number; expectedValue: number | null; status: string | null }
export interface PhaseIn { phaseName: string; startMs: number; endMs: number; minAngle: number | null; maxAngle: number | null; status: string | null }
export interface ErrorIn { errorCode: string; phaseName: string | null; severity: 'low' | 'medium' | 'high'; detail: string | null }
export interface RepetitionIn {
  repetitionNumber: number;
  startMs: number | null;
  endMs: number | null;
  angleTrace: string | null; // JSON text of [[tMs, angleDeg], ...]
  metrics: MetricIn[];
  phases: PhaseIn[];
  errors: ErrorIn[];
}
export interface LandmarkIn {
  repetitionNumber: number | null; timestampMs: number; landmarkName: string;
  x: number; y: number; confidence: number; phase: string | null;
}

export interface ValidatedSession {
  programExerciseId: number;
  clientSessionUuid: string | null;
  sessionDate: string; // normalised to 'YYYY-MM-DD HH:MM:SS' (UTC)
  durationSec: number | null;
  status: SessionStatus;
  abstainReason: string | null;
  confidence: number | null;
  setsCompleted: number | null;
  repsCompleted: number | null;
  pain: number | null;
  discomfort: number | null;
  difficulty: number | null;
  injuryNote: string | null;
  overallScore: number | null;
  analysisMethod: 'temporal' | 'threshold' | null;
  captureQuality: string | null; // JSON text
  assessedMetrics: string | null;
  unassessedMetrics: string | null;
  repetitions: RepetitionIn[];
  landmarkPoints: LandmarkIn[];
}

export type ValidationResult = { ok: true; value: ValidatedSession } | { ok: false; error: string };

const MAX_REPS = 200;
const MAX_LANDMARKS = 30000;

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);
const present = (v: unknown) => v !== undefined && v !== null;

function str(v: unknown, max: number): string | null {
  if (!present(v)) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

/** MySQL DATETIME text (UTC) from any parseable date. */
export function toMysqlDateTime(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function intInRange(v: unknown, lo: number, hi: number, label: string): string | null {
  if (!present(v)) return null;
  if (!isInt(v) || v < lo || v > hi) return `${label} must be a whole number between ${lo} and ${hi}`;
  return null;
}

export function validateSessionPayload(body: any, now: Date = new Date()): ValidationResult {
  if (!isObj(body)) return { ok: false, error: 'Request body must be a JSON object' };
  const b = body;

  if (!isInt(b.programExerciseId) || b.programExerciseId <= 0) {
    return { ok: false, error: 'programExerciseId, sessionDate, and status are required' };
  }
  if (typeof b.sessionDate !== 'string' || !b.status) {
    return { ok: false, error: 'programExerciseId, sessionDate, and status are required' };
  }
  const sessionDate = toMysqlDateTime(b.sessionDate);
  if (!sessionDate) return { ok: false, error: 'sessionDate is not a valid date' };
  if (new Date(b.sessionDate).getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    return { ok: false, error: 'sessionDate cannot be in the future' };
  }
  if (!(ALL_STATUSES as readonly string[]).includes(b.status)) {
    return { ok: false, error: `status must be one of ${ALL_STATUSES.join(', ')}` };
  }
  const status = b.status as SessionStatus;
  const assessed = (ASSESSED_STATUSES as readonly string[]).includes(status);

  let clientSessionUuid: string | null = null;
  if (present(b.clientSessionUuid)) {
    if (typeof b.clientSessionUuid !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(b.clientSessionUuid)) {
      return { ok: false, error: 'clientSessionUuid must be 8-64 letters, digits, dashes or underscores' };
    }
    clientSessionUuid = b.clientSessionUuid;
  }

  // ---- patient self-report ranges (kept exact for the existing security tests) ----
  if (present(b.pain) && (typeof b.pain !== 'number' || b.pain < 0 || b.pain > 10)) {
    return { ok: false, error: 'pain must be a number between 0 and 10' };
  }
  if (present(b.discomfort) && (typeof b.discomfort !== 'number' || b.discomfort < 0 || b.discomfort > 10)) {
    return { ok: false, error: 'discomfort must be a number between 0 and 10' };
  }
  if (present(b.difficulty) && (typeof b.difficulty !== 'number' || b.difficulty < 1 || b.difficulty > 10)) {
    return { ok: false, error: 'difficulty must be a number between 1 and 10' };
  }
  if (present(b.confidence) && (!isNum(b.confidence) || b.confidence < 0 || b.confidence > 1)) {
    return { ok: false, error: 'confidence must be a number between 0 and 1' };
  }
  for (const [label, v, hi] of [
    ['durationSec', b.durationSec, 4 * 60 * 60],
    ['setsCompleted', b.setsCompleted, 50],
    ['repsCompleted', b.repsCompleted, 1000],
  ] as [string, unknown, number][]) {
    const e = intInRange(v, 0, hi, label);
    if (e) return { ok: false, error: e };
  }

  // ---- the central rule: only assessed sessions carry a score ----
  if (assessed) {
    if (!isNum(b.overallScore) || b.overallScore < 0 || b.overallScore > 100) {
      return { ok: false, error: 'overallScore must be a number between 0 and 100 for a VALID session' };
    }
    if (!present(b.pain) || !present(b.difficulty)) {
      return { ok: false, error: 'pain and difficulty ratings are required for an assessed session' };
    }
  } else {
    const reason = str(b.abstainReason, 255);
    if (!reason) return { ok: false, error: 'abstainReason is required when the session was not assessed' };
  }

  let analysisMethod: ValidatedSession['analysisMethod'] = null;
  if (present(b.analysisMethod)) {
    if (b.analysisMethod !== 'temporal' && b.analysisMethod !== 'threshold') {
      return { ok: false, error: "analysisMethod must be 'temporal' or 'threshold'" };
    }
    analysisMethod = b.analysisMethod;
  }

  let captureQuality: string | null = null;
  if (present(b.captureQuality)) {
    if (!isObj(b.captureQuality)) return { ok: false, error: 'captureQuality must be an object' };
    captureQuality = JSON.stringify(b.captureQuality);
    if (captureQuality.length > 8000) return { ok: false, error: 'captureQuality is too large' };
  }

  const metricList = (v: unknown): string | null => {
    if (!Array.isArray(v)) return null;
    const names = v.filter((x) => typeof x === 'string' && /^[a-z_]{1,40}$/.test(x));
    return names.length ? names.join(',').slice(0, 255) : null;
  };

  // ---- repetitions / phases / errors (assessed sessions only) ----
  const repetitions: RepetitionIn[] = [];
  if (assessed && present(b.repetitions)) {
    if (!Array.isArray(b.repetitions) || b.repetitions.length > MAX_REPS) {
      return { ok: false, error: `repetitions must be an array of at most ${MAX_REPS} items` };
    }
    const seen = new Set<number>();
    for (const r of b.repetitions) {
      if (!isObj(r) || !isInt(r.repetitionNumber) || r.repetitionNumber < 1) {
        return { ok: false, error: 'each repetition needs a positive integer repetitionNumber' };
      }
      if (seen.has(r.repetitionNumber)) return { ok: false, error: `duplicate repetitionNumber ${r.repetitionNumber}` };
      seen.add(r.repetitionNumber);

      const metrics: MetricIn[] = [];
      for (const m of Array.isArray(r.metrics) ? r.metrics.slice(0, 20) : []) {
        if (!isObj(m) || typeof m.metricName !== 'string' || !m.metricName || m.metricName.length > 60 || !isNum(m.value)) {
          return { ok: false, error: 'each metric needs a metricName and a numeric value' };
        }
        metrics.push({
          metricName: m.metricName,
          value: m.value,
          expectedValue: isNum(m.expectedValue) ? m.expectedValue : null,
          status: str(m.status, 30),
        });
      }

      const phases: PhaseIn[] = [];
      for (const p of Array.isArray(r.phases) ? r.phases.slice(0, 12) : []) {
        if (!isObj(p) || typeof p.phaseName !== 'string' || !p.phaseName || !isNum(p.startMs) || !isNum(p.endMs) || p.endMs < p.startMs) {
          return { ok: false, error: 'each phase needs a phaseName and startMs <= endMs' };
        }
        phases.push({
          phaseName: p.phaseName.slice(0, 40),
          startMs: Math.round(p.startMs),
          endMs: Math.round(p.endMs),
          minAngle: isNum(p.minAngle) ? p.minAngle : null,
          maxAngle: isNum(p.maxAngle) ? p.maxAngle : null,
          status: str(p.status, 30),
        });
      }

      const errors: ErrorIn[] = [];
      for (const e of Array.isArray(r.errors) ? r.errors.slice(0, 12) : []) {
        if (!isObj(e) || typeof e.errorCode !== 'string' || !/^[a-z_]{1,60}$/.test(e.errorCode)) {
          return { ok: false, error: 'each error needs a lowercase_snake_case errorCode' };
        }
        const sev = present(e.severity) ? e.severity : 'medium';
        if (sev !== 'low' && sev !== 'medium' && sev !== 'high') {
          return { ok: false, error: "error severity must be 'low', 'medium' or 'high'" };
        }
        errors.push({ errorCode: e.errorCode, phaseName: str(e.phaseName, 40), severity: sev, detail: str(e.detail, 255) });
      }

      let angleTrace: string | null = null;
      if (present(r.angleTrace)) {
        const t = r.angleTrace;
        if (
          !Array.isArray(t) || t.length > 600 ||
          !t.every((q: unknown) => Array.isArray(q) && q.length === 2 && isNum(q[0]) && isNum(q[1]))
        ) {
          return { ok: false, error: 'angleTrace must be an array of at most 600 [timestampMs, angleDeg] pairs' };
        }
        angleTrace = JSON.stringify(t);
      }

      repetitions.push({
        repetitionNumber: r.repetitionNumber,
        startMs: isNum(r.startMs) ? Math.round(r.startMs) : null,
        endMs: isNum(r.endMs) ? Math.round(r.endMs) : null,
        angleTrace,
        metrics, phases, errors,
      });
    }
  }

  // ---- landmark trace (assessed sessions only) ----
  const landmarkPoints: LandmarkIn[] = [];
  if (assessed && present(b.landmarkPoints)) {
    if (!Array.isArray(b.landmarkPoints) || b.landmarkPoints.length > MAX_LANDMARKS) {
      return { ok: false, error: `landmarkPoints must be an array of at most ${MAX_LANDMARKS} items` };
    }
    for (const p of b.landmarkPoints) {
      if (
        !isObj(p) || !isNum(p.timestampMs) || p.timestampMs < 0 ||
        typeof p.landmarkName !== 'string' || !p.landmarkName || p.landmarkName.length > 40 ||
        !isNum(p.x) || !isNum(p.y) || !isNum(p.confidence) || p.confidence < 0 || p.confidence > 1
      ) {
        return { ok: false, error: 'each landmark point needs timestampMs, landmarkName, numeric x/y and confidence 0-1' };
      }
      landmarkPoints.push({
        repetitionNumber: isInt(p.repetitionNumber) ? p.repetitionNumber : null,
        timestampMs: Math.round(p.timestampMs),
        landmarkName: p.landmarkName,
        x: p.x, y: p.y, confidence: p.confidence,
        phase: str(p.phase, 40),
      });
    }
  }

  return {
    ok: true,
    value: {
      programExerciseId: b.programExerciseId,
      clientSessionUuid,
      sessionDate,
      durationSec: isNum(b.durationSec) ? b.durationSec : null,
      status,
      abstainReason: assessed ? null : str(b.abstainReason, 255),
      confidence: isNum(b.confidence) ? b.confidence : null,
      setsCompleted: isNum(b.setsCompleted) ? b.setsCompleted : null,
      repsCompleted: isNum(b.repsCompleted) ? b.repsCompleted : null,
      pain: isNum(b.pain) ? b.pain : null,
      discomfort: isNum(b.discomfort) ? b.discomfort : null,
      difficulty: isNum(b.difficulty) ? b.difficulty : null,
      injuryNote: str(b.injuryNote, 1000),
      overallScore: assessed ? (b.overallScore as number) : null, // never stored for abstained sessions
      analysisMethod,
      captureQuality,
      assessedMetrics: metricList(b.assessedMetrics),
      unassessedMetrics: metricList(b.unassessedMetrics),
      repetitions,
      landmarkPoints,
    },
  };
}
