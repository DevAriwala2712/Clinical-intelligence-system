// progressionRules.ts
//
// Decides whether the longitudinal evidence justifies ASKING A CLINICIAN to
// review a programme. It never changes a programme: the result is only ever
// stored as a PENDING suggestion, and only an approval by the treating
// clinician (progressionController) changes sets/repetitions.
//
// Four kinds of review prompt:
//   PROGRESS              - consistently good, pain-free-ish, adherent -> consider a small increase
//   REVIEW_DETERIORATION  - quality is getting worse
//   REVIEW_PLATEAU        - adherent but flat and below the reference
//   REVIEW_PAIN           - a high or rising pain report
// Pain is checked first and suppresses PROGRESS: we never suggest increasing
// load while pain is the problem.

import { ANALYSIS_CONFIG as C } from './config';
import { AnalysisResult } from './longitudinal';

export type SuggestionKind = 'PROGRESS' | 'REVIEW_DETERIORATION' | 'REVIEW_PLATEAU' | 'REVIEW_PAIN';

export interface CandidateSuggestion {
  kind: SuggestionKind;
  suggestion: string;
  reason: string;
  proposedSets: number | null;
  proposedRepetitions: number | null;
}

export interface RuleInput {
  exerciseName: string;
  currentSets: number;
  currentRepetitions: number;
  analysis: AnalysisResult;
  adherenceRate: number | null;
}

export function evaluateProgressionRules(input: RuleInput): CandidateSuggestion[] {
  const { analysis: a, exerciseName: name, adherenceRate } = input;
  const out: CandidateSuggestion[] = [];
  const evidence = [...a.explanation];
  if (adherenceRate !== null) evidence.push(`Adherence over the last ${C.adherenceWindowDays} days: ${Math.round(adherenceRate * 100)}%.`);
  const reason = evidence.join(' ');

  if (a.painReviewTriggered) {
    out.push({
      kind: 'REVIEW_PAIN',
      suggestion: `Review ${name}: recent pain reports are high or rising. Consider whether the programme should be adjusted.`,
      reason,
      proposedSets: null,
      proposedRepetitions: null,
    });
    return out; // never propose progression while pain is flagged
  }

  if (a.status !== 'OK') return out;

  if (a.trend === 'DETERIORATING') {
    out.push({
      kind: 'REVIEW_DETERIORATION',
      suggestion: `Review ${name}: movement quality has declined over recent sessions.`,
      reason,
      proposedSets: null,
      proposedRepetitions: null,
    });
    return out;
  }

  if (a.trend === 'PLATEAU' && adherenceRate !== null && adherenceRate >= C.adherenceForPlateauReview) {
    out.push({
      kind: 'REVIEW_PLATEAU',
      suggestion: `Review ${name}: quality has plateaued below the reference despite regular practice. Consider whether the exercise or its criteria need changing.`,
      reason,
      proposedSets: null,
      proposedRepetitions: null,
    });
    return out;
  }

  const trendOk = a.trend === 'IMPROVING' || a.trend === 'STABLE_HIGH' || a.trend === 'STABLE';
  const scoreOk = (a.recentMedian ?? 0) >= C.progressMinRecentMedian;
  const painOk = (a.pain.recentMedian ?? 0) <= C.progressMaxPainMedian && a.pain.trend !== 'RISING';
  const diffOk = (a.difficulty.recentMedian ?? 0) <= C.progressMaxDifficultyMedian;
  const adherenceOk = adherenceRate !== null && adherenceRate >= C.adherenceForProgression;
  const confOk = a.recentConfidenceMin !== null && a.recentConfidenceMin >= C.progressMinConfidence;

  if (trendOk && scoreOk && painOk && diffOk && adherenceOk && confOk) {
    let proposedSets: number | null = null;
    let proposedReps: number | null = null;
    let text: string;
    if (input.currentRepetitions < C.maxRepetitions) {
      proposedReps = Math.min(C.maxRepetitions, input.currentRepetitions + C.repetitionStep);
      proposedSets = input.currentSets;
      text = `Consider progressing ${name} from ${input.currentSets} x ${input.currentRepetitions} to ${proposedSets} x ${proposedReps}.`;
    } else if (input.currentSets < C.maxSets) {
      proposedSets = input.currentSets + 1;
      proposedReps = input.currentRepetitions;
      text = `Consider progressing ${name} from ${input.currentSets} x ${input.currentRepetitions} to ${proposedSets} x ${proposedReps}.`;
    } else {
      return out; // already at the configured ceiling: nothing sensible to propose
    }
    out.push({ kind: 'PROGRESS', suggestion: text, reason, proposedSets, proposedRepetitions: proposedReps });
  }
  return out;
}
