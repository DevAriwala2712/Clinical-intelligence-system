// effective.ts
//
// The "effective assessment" = the original automated assessment + the
// clinician's corrections, computed on read. The automated rows are NEVER
// edited, so the original can always be compared with the corrected view.
//
// Rules:
//  - the latest DISMISS_ERROR / CONFIRM_ERROR on an error wins
//  - the latest ADJUST_SCORE wins, and is only honoured for an assessed session
//  - ADD_ERROR rows add clinician-identified errors (autoDetected = false)

export interface ErrorRow { id: number; repetitionId: number; errorCode: string }
export interface ReviewRow {
  id: number;
  action: string;
  errorId: number | null;
  repetitionNumber: number | null;
  errorCode: string | null;
  adjustedScore: number | null;
  createdAt: string;
}

export interface EffectiveAssessment {
  originalScore: number | null;
  correctedScore: number | null;
  effectiveScore: number | null;
  originalErrorCount: number;
  effectiveErrorCount: number;
  dismissedErrorIds: number[];
  confirmedErrorIds: number[];
  addedErrors: { reviewId: number; repetitionNumber: number | null; errorCode: string }[];
}

export function computeEffective(
  status: string,
  overallScore: number | null,
  errors: ErrorRow[],
  reviews: ReviewRow[]
): EffectiveAssessment {
  const ordered = [...reviews].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  const assessed = status === 'VALID' || status === 'PARTIAL';

  const decision = new Map<number, 'DISMISS_ERROR' | 'CONFIRM_ERROR'>();
  let corrected: number | null = null;
  const added: EffectiveAssessment['addedErrors'] = [];

  for (const r of ordered) {
    if ((r.action === 'DISMISS_ERROR' || r.action === 'CONFIRM_ERROR') && r.errorId !== null) {
      decision.set(r.errorId, r.action);
    } else if (r.action === 'ADJUST_SCORE' && assessed && r.adjustedScore !== null) {
      corrected = r.adjustedScore;
    } else if (r.action === 'ADD_ERROR' && r.errorCode) {
      added.push({ reviewId: r.id, repetitionNumber: r.repetitionNumber, errorCode: r.errorCode });
    }
  }

  const dismissed = errors.filter((e) => decision.get(e.id) === 'DISMISS_ERROR').map((e) => e.id);
  const confirmed = errors.filter((e) => decision.get(e.id) === 'CONFIRM_ERROR').map((e) => e.id);
  const original = assessed ? overallScore : null;

  return {
    originalScore: original,
    correctedScore: corrected,
    effectiveScore: assessed ? corrected ?? original : null,
    originalErrorCount: errors.length,
    effectiveErrorCount: errors.length - dismissed.length + added.length,
    dismissedErrorIds: dismissed,
    confirmedErrorIds: confirmed,
    addedErrors: added,
  };
}
