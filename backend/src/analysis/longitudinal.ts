// longitudinal.ts
//
// Turns a patient's history for ONE exercise into an explainable trend:
// improving / deteriorating / inconsistent / plateau / stable, plus how pain,
// difficulty and each movement-quality component are changing.
//
// Design rules (from the project brief):
//  - never call something a trend from one unusually good session
//  - say "insufficient data" instead of guessing
//  - only sessions that were actually ASSESSED (VALID / PARTIAL with a score)
//    feed the quality trend; abstained sessions never contribute a number
//  - the clinician's corrected score (if any) replaces the automated one
//  - every result carries plain-language `explanation` lines
//
// This module is pure (no DB, no Express) so it is unit-tested directly.

import { ANALYSIS_CONFIG as C } from './config';
import { median, mean, theilSenSlope, theilSenResiduals, robustSpread, round } from './stats';

export type Trend = 'IMPROVING' | 'DETERIORATING' | 'INCONSISTENT' | 'PLATEAU' | 'STABLE' | 'STABLE_HIGH';
export type SelfReportTrend = 'RISING' | 'FALLING' | 'STABLE';
export type ComponentTrend = 'IMPROVING' | 'DETERIORATING' | 'STABLE';

export const COMPONENT_KEYS = ['rom', 'tempo', 'control', 'symmetry', 'compensation'] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

/** One stored session, already joined with its reviews/metrics by the controller. */
export interface SessionPoint {
  date: string;                    // ISO timestamp
  status: string;                  // VALID | PARTIAL | LOW_CONFIDENCE | ...
  overallScore: number | null;     // automated score (null unless VALID/PARTIAL)
  correctedScore?: number | null;  // clinician's ADJUST_SCORE, if any
  confidence: number | null;
  pain: number | null;
  discomfort: number | null;
  difficulty: number | null;
  /** % of repetitions that met the target for each component (0-100), when assessed. */
  components?: Partial<Record<ComponentKey, number>>;
}

export interface ScorePoint { date: string; score: number; corrected: boolean }

export interface SelfReportAnalysis {
  trend: SelfReportTrend | null;
  recentMedian: number | null;
  earlierMedian: number | null;
  reports: number;
}

export interface AnalysisResult {
  status: 'OK' | 'INSUFFICIENT_DATA';
  trend: Trend | null;
  assessedSessionCount: number;
  totalSessionCount: number;
  abstainedSessionCount: number;
  minSessionsRequired: number;
  scoreSeries: ScorePoint[];
  recentMedian: number | null;
  earlierMedian: number | null;
  slopePerSession: number | null;
  residualSd: number | null;
  recentConfidenceMin: number | null;
  components: Partial<Record<ComponentKey, { trend: ComponentTrend; recent: number; earlier: number }>>;
  pain: SelfReportAnalysis;
  difficulty: SelfReportAnalysis;
  painReviewTriggered: boolean;
  correctedSessionCount: number;
  explanation: string[];
  caveats: string[];
}

const ASSESSED = new Set(['VALID', 'PARTIAL']);

export function effectiveScore(p: SessionPoint): number | null {
  if (!ASSESSED.has(p.status)) return null;
  const s = p.correctedScore ?? p.overallScore;
  return typeof s === 'number' ? s : null;
}

function selfReport(values: (number | null)[]): SelfReportAnalysis {
  const reports = values.filter((v): v is number => typeof v === 'number');
  const out: SelfReportAnalysis = { trend: null, recentMedian: null, earlierMedian: null, reports: reports.length };
  if (reports.length < C.selfReportMinReports) {
    out.recentMedian = round(median(reports.slice(-C.window)));
    return out;
  }
  const recent = reports.slice(-C.window);
  const earlier = reports.slice(-2 * C.window, -C.window);
  const rm = median(recent) as number;
  const em = median(earlier) as number;
  out.recentMedian = round(rm);
  out.earlierMedian = round(em);
  const delta = rm - em;
  out.trend = delta >= C.selfReportDelta ? 'RISING' : delta <= -C.selfReportDelta ? 'FALLING' : 'STABLE';
  return out;
}

/** Pain asks for a clinician review when a recent report is very high, the recent median is high, or it is clearly rising. */
export function painNeedsReview(pain: SelfReportAnalysis, lastReports: number[]): boolean {
  const lastTwo = lastReports.slice(-2);
  if (lastTwo.some((v) => v >= C.painHighSingle)) return true;
  const lastThree = lastReports.slice(-C.window);
  if (lastThree.length >= C.window) {
    const m = median(lastThree) as number;
    if (m >= C.painHighMedian) return true;
  }
  return pain.trend === 'RISING' && (pain.recentMedian ?? 0) >= 4;
}

export function analyzeExercise(points: SessionPoint[]): AnalysisResult {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const assessed = sorted.filter((p) => effectiveScore(p) !== null);
  const scoreSeries: ScorePoint[] = assessed.map((p) => ({
    date: p.date,
    score: effectiveScore(p) as number,
    corrected: p.correctedScore !== undefined && p.correctedScore !== null,
  }));
  const correctedSessionCount = scoreSeries.filter((s) => s.corrected).length;

  // Self-reports (pain / difficulty) are valid even for abstained sessions: the
  // patient still did the exercise and told us how it felt.
  const painValues = sorted.map((p) => p.pain);
  const painReports = painValues.filter((v): v is number => typeof v === 'number');
  const pain = selfReport(painValues);
  const difficulty = selfReport(sorted.map((p) => p.difficulty));
  const painReviewTriggered = painNeedsReview(pain, painReports);

  const caveats = [
    'Scores are produced by an automated movement analysis and have not been clinically validated.',
  ];
  if (correctedSessionCount > 0) {
    caveats.push(`${correctedSessionCount} session score(s) in this series were corrected by a clinician and are shown as corrected.`);
  }

  const base: AnalysisResult = {
    status: 'INSUFFICIENT_DATA',
    trend: null,
    assessedSessionCount: assessed.length,
    totalSessionCount: sorted.length,
    abstainedSessionCount: sorted.length - assessed.length,
    minSessionsRequired: C.minAssessedSessions,
    scoreSeries,
    recentMedian: null,
    earlierMedian: null,
    slopePerSession: null,
    residualSd: null,
    recentConfidenceMin: null,
    components: {},
    pain,
    difficulty,
    painReviewTriggered,
    correctedSessionCount,
    explanation: [],
    caveats,
  };

  if (base.abstainedSessionCount > 0) {
    caveats.push(`${base.abstainedSessionCount} session(s) were not assessable (unreliable recording) and are excluded from the quality trend.`);
  }

  if (assessed.length < C.minAssessedSessions) {
    base.explanation.push(
      `Only ${assessed.length} assessed session(s) so far; at least ${C.minAssessedSessions} are needed before a quality trend is reported.`
    );
    return base;
  }

  const used = scoreSeries.slice(-C.maxSessionsForSlope);
  const scores = used.map((s) => s.score);
  const recent = scores.slice(-C.window);
  const earlier = scores.slice(-2 * C.window, -C.window);
  const recentMedian = median(recent) as number;
  const earlierMedian = median(earlier) as number;
  const delta = recentMedian - earlierMedian;
  const slope = theilSenSlope(scores) as number;
  const residualSd = robustSpread(theilSenResiduals(scores)) as number;
  const recentAbove = recent.filter((s) => s > earlierMedian).length;
  const recentBelow = recent.filter((s) => s < earlierMedian).length;

  let trend: Trend;
  const why: string[] = [];

  if (residualSd >= C.inconsistentResidualSd) {
    trend = 'INCONSISTENT';
    why.push(`Scores vary widely from session to session (spread about ${residualSd.toFixed(1)} points around the trend line), so no direction is reported.`);
  } else if (delta >= C.improveDeltaPoints && slope >= C.improveSlopePerSession && recentAbove >= C.recentAgreeCount) {
    trend = 'IMPROVING';
    why.push(`Median score rose from ${earlierMedian.toFixed(0)} to ${recentMedian.toFixed(0)} (+${delta.toFixed(0)}), trend about ${slope >= 0 ? '+' : ''}${slope.toFixed(1)} points per session.`);
    why.push(`${recentAbove} of the last ${C.window} sessions were above the earlier median, so this is not driven by a single session.`);
  } else if (delta <= -C.improveDeltaPoints && slope <= -C.improveSlopePerSession && recentBelow >= C.recentAgreeCount) {
    trend = 'DETERIORATING';
    why.push(`Median score fell from ${earlierMedian.toFixed(0)} to ${recentMedian.toFixed(0)} (${delta.toFixed(0)}), trend about ${slope.toFixed(1)} points per session.`);
    why.push(`${recentBelow} of the last ${C.window} sessions were below the earlier median.`);
  } else if (Math.abs(delta) < C.plateauDeltaPoints && Math.abs(slope) < C.plateauSlopePerSession) {
    if (recentMedian >= C.targetScore) {
      trend = 'STABLE_HIGH';
      why.push(`Scores are steady at a median of ${recentMedian.toFixed(0)}, at or above the ${C.targetScore} reference.`);
    } else if (assessed.length >= C.plateauMinSessions) {
      trend = 'PLATEAU';
      why.push(`Scores have stayed flat (median ${earlierMedian.toFixed(0)} then ${recentMedian.toFixed(0)}) over ${assessed.length} assessed sessions and are below the ${C.targetScore} reference.`);
    } else {
      trend = 'STABLE';
      why.push(`Scores are flat (median ${recentMedian.toFixed(0)}). ${C.plateauMinSessions} assessed sessions are needed before calling it a plateau.`);
    }
  } else {
    trend = 'STABLE';
    why.push(`Median score moved from ${earlierMedian.toFixed(0)} to ${recentMedian.toFixed(0)}, which is not a large or consistent enough change to call a trend.`);
  }

  // Component trends (share of repetitions that met target)
  const components: AnalysisResult['components'] = {};
  for (const key of COMPONENT_KEYS) {
    const series = assessed
      .map((p) => p.components?.[key])
      .filter((v): v is number => typeof v === 'number');
    if (series.length < C.minAssessedSessions) continue;
    const r = mean(series.slice(-C.window)) as number;
    const e = mean(series.slice(-2 * C.window, -C.window)) as number;
    const d = r - e;
    components[key] = {
      trend: d >= C.componentDeltaPercent ? 'IMPROVING' : d <= -C.componentDeltaPercent ? 'DETERIORATING' : 'STABLE',
      recent: round(r, 0) as number,
      earlier: round(e, 0) as number,
    };
  }

  const confs = assessed.slice(-C.window).map((p) => p.confidence).filter((v): v is number => typeof v === 'number');

  why.unshift(`Based on ${assessed.length} assessed sessions (comparing the latest ${C.window} with the ${C.window} before).`);
  if (pain.trend === 'RISING') why.push(`Reported pain is rising (median ${pain.earlierMedian} to ${pain.recentMedian}).`);
  if (pain.trend === 'FALLING') why.push(`Reported pain is falling (median ${pain.earlierMedian} to ${pain.recentMedian}).`);
  if (difficulty.trend === 'RISING') why.push(`Perceived difficulty is rising (median ${difficulty.earlierMedian} to ${difficulty.recentMedian}).`);
  if (difficulty.trend === 'FALLING') why.push(`Perceived difficulty is falling (median ${difficulty.earlierMedian} to ${difficulty.recentMedian}).`);
  if (painReviewTriggered) why.push('A recent pain report is high enough that a clinician review is suggested.');

  return {
    ...base,
    status: 'OK',
    trend,
    recentMedian: round(recentMedian),
    earlierMedian: round(earlierMedian),
    slopePerSession: round(slope, 2),
    residualSd: round(residualSd),
    recentConfidenceMin: confs.length ? Math.min(...confs) : null,
    components,
    explanation: why,
  };
}

// ----------------------------------------------------------------------------
// Adherence
// ----------------------------------------------------------------------------

export interface WeekAdherence { weekStart: string; completedDays: number; expectedDays: number }
export interface Adherence {
  windowDays: number;
  expectedDays: number;
  completedDays: number;
  rate: number | null; // 0..1, null when the programme is too new to judge
  weekly: WeekAdherence[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Monday (UTC) of the week containing d, as YYYY-MM-DD. */
function weekStartKey(d: Date): string {
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return dayKey(new Date(d.getTime() - day * DAY_MS));
}

/**
 * Adherence is measured in SESSION DAYS: a day counts as completed when the
 * patient submitted at least one exercise record that day (an abstained
 * recording still counts - the patient did the exercise).
 */
export function computeAdherence(
  sessionDates: string[],
  sessionsPerWeek: number,
  now: Date,
  programStart: Date | null
): Adherence {
  const windowDays = C.adherenceWindowDays;
  const windowStart = new Date(now.getTime() - (windowDays - 1) * DAY_MS);
  const effectiveStart = programStart && programStart > windowStart ? programStart : windowStart;
  const observedDays = Math.max(0, Math.floor((now.getTime() - effectiveStart.getTime()) / DAY_MS) + 1);

  const days = new Set<string>();
  for (const iso of sessionDates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    days.add(dayKey(d));
  }

  const startKey = dayKey(effectiveStart);
  const endKey = dayKey(now);
  const completed = [...days].filter((k) => k >= startKey && k <= endKey).length;
  const expected = Math.round(((sessionsPerWeek * observedDays) / 7) * 10) / 10;

  const rate =
    observedDays < C.adherenceMinDaysObserved || expected <= 0 ? null : Math.min(1, completed / expected);

  // last 4 weeks (full weeks, Monday-based), oldest first
  const thisWeek = new Date(weekStartKey(now) + 'T00:00:00Z');
  const weekly: WeekAdherence[] = [];
  for (let i = 3; i >= 0; i--) {
    const ws = new Date(thisWeek.getTime() - i * 7 * DAY_MS);
    const wsKey = dayKey(ws);
    const weKey = dayKey(new Date(ws.getTime() + 6 * DAY_MS));
    weekly.push({
      weekStart: wsKey,
      completedDays: [...days].filter((k) => k >= wsKey && k <= weKey).length,
      expectedDays: sessionsPerWeek,
    });
  }

  return {
    windowDays,
    expectedDays: expected,
    completedDays: completed,
    rate: rate === null ? null : Math.round(rate * 100) / 100,
    weekly,
  };
}
