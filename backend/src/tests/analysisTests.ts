// backend/src/tests/analysisTests.ts
//
// Unit tests for the pure logic: longitudinal analysis, adherence, the
// progression-review rules, upload validation/abstention and the effective
// (clinician-corrected) assessment. No database or server is needed.

import { assertEqual, assertTrue, section } from './testHelpers';
import { analyzeExercise, computeAdherence, SessionPoint } from '../analysis/longitudinal';
import { evaluateProgressionRules } from '../analysis/progressionRules';
import { validateSessionPayload } from '../analysis/sessionValidation';
import { computeEffective } from '../analysis/effective';
import { median, theilSenSlope } from '../analysis/stats';

function pt(i: number, score: number | null, over: Partial<SessionPoint> = {}): SessionPoint {
  const d = new Date(Date.UTC(2026, 0, 1 + i * 2)).toISOString();
  return {
    date: d, status: score === null ? 'LOW_CONFIDENCE' : 'VALID', overallScore: score,
    confidence: score === null ? 0.4 : 0.9, pain: 2, discomfort: 1, difficulty: 4, ...over,
  };
}
const series = (scores: (number | null)[], over: Partial<SessionPoint> = {}) => scores.map((s, i) => pt(i, s, over));

export function runAnalysisTests() {
  // ---------------------------------------------------------------- stats
  section('stats');
  assertEqual(median([3, 1, 2]), 2, 'median of odd list');
  assertEqual(median([1, 2, 3, 4]), 2.5, 'median of even list');
  assertEqual(theilSenSlope([10, 12, 14, 16]), 2, 'Theil-Sen slope of a straight line');
  assertEqual(theilSenSlope([10, 10, 10, 10, 10, 90]), 0, 'Theil-Sen ignores a single extreme point');

  // ---------------------------------------------------------------- longitudinal
  section('longitudinal analysis');
  let r = analyzeExercise(series([70, 72, 74]));
  assertEqual(r.status, 'INSUFFICIENT_DATA', 'fewer than 6 assessed sessions -> INSUFFICIENT_DATA');
  assertEqual(r.trend, null, 'no trend is reported without enough data');
  assertTrue(r.explanation[0].includes('at least 6'), 'insufficient-data result explains itself');

  r = analyzeExercise(series([60, 63, 66, 71, 75, 80, 84, 88]));
  assertEqual(r.trend, 'IMPROVING', 'steady rise over 8 sessions -> IMPROVING');
  assertTrue(r.explanation.some((l) => l.includes('not driven by a single session')), 'improvement is explained');

  r = analyzeExercise(series([70, 70, 70, 70, 70, 96]));
  assertTrue(r.trend !== 'IMPROVING', 'one unusually good session does NOT create an improvement trend');
  assertEqual(r.trend, 'STABLE', 'a single outlier is not mistaken for inconsistency either');

  r = analyzeExercise(series([88, 86, 82, 77, 72, 68, 64, 60]));
  assertEqual(r.trend, 'DETERIORATING', 'steady fall -> DETERIORATING');

  r = analyzeExercise(series([50, 90, 55, 88, 60, 92, 52, 85]));
  assertEqual(r.trend, 'INCONSISTENT', 'large session-to-session swings -> INCONSISTENT');

  r = analyzeExercise(series([70, 71, 70, 69, 71, 70, 70, 71]));
  assertEqual(r.trend, 'PLATEAU', 'flat and below the reference over 8 sessions -> PLATEAU');

  r = analyzeExercise(series([70, 71, 70, 69, 71, 70]));
  assertEqual(r.trend, 'STABLE', 'flat but only 6 sessions -> STABLE, not PLATEAU');

  r = analyzeExercise(series([90, 91, 90, 89, 91, 90, 90, 91]));
  assertEqual(r.trend, 'STABLE_HIGH', 'flat at/above the reference -> STABLE_HIGH');

  r = analyzeExercise(series([70, 72, null, 74, 76, null, 78, 80, 82, 84]));
  assertEqual(r.abstainedSessionCount, 2, 'abstained sessions are counted separately');
  assertEqual(r.assessedSessionCount, 8, 'abstained sessions do not feed the score series');
  assertTrue(r.scoreSeries.every((s) => typeof s.score === 'number'), 'score series never contains a null/fabricated score');

  const withCorrection = series([60, 62, 64, 66, 68, 70]);
  withCorrection[5].correctedScore = 40;
  r = analyzeExercise(withCorrection);
  assertEqual(r.scoreSeries[5].score, 40, 'a clinician-corrected score replaces the automated score');
  assertEqual(r.correctedSessionCount, 1, 'corrected sessions are counted');

  // self-report
  const painRising = series([80, 80, 80, 80, 80, 80, 80, 80]).map((p, i) => ({ ...p, pain: i < 4 ? 1 : 5 }));
  r = analyzeExercise(painRising);
  assertEqual(r.pain.trend, 'RISING', 'rising pain is detected');
  assertTrue(r.painReviewTriggered, 'rising pain asks for a review');

  const spike = series([80, 80, 80]).map((p, i) => ({ ...p, pain: i === 2 ? 8 : 1 }));
  assertTrue(analyzeExercise(spike).painReviewTriggered, 'a single very high pain report asks for a review even with little data');
  assertTrue(!analyzeExercise(series([80, 80, 80])).painReviewTriggered, 'low pain does not trigger a review');

  const comp = series([70, 72, 74, 76, 78, 80]).map((p, i) => ({ ...p, components: { rom: i < 3 ? 30 : 80 } }));
  assertEqual(analyzeExercise(comp).components.rom?.trend, 'IMPROVING', 'component (ROM) trend is reported');

  // ---------------------------------------------------------------- adherence
  section('adherence');
  const now = new Date('2026-03-15T12:00:00Z');
  const start = new Date('2026-02-01T00:00:00Z');
  let a = computeAdherence(['2026-03-02', '2026-03-04', '2026-03-06', '2026-03-09', '2026-03-11', '2026-03-13'].map((d) => d + 'T09:00:00Z'), 3, now, start);
  assertEqual(a.completedDays, 6, 'counts distinct session days in the 14-day window');
  assertEqual(a.expectedDays, 6, '3 sessions/week over 14 days = 6 expected');
  assertEqual(a.rate, 1, 'full adherence = 1');
  assertEqual(a.weekly.length, 4, 'four weekly buckets');

  a = computeAdherence(['2026-03-10T09:00:00Z', '2026-03-10T10:00:00Z'], 3, now, start);
  assertEqual(a.completedDays, 1, 'two records on the same day count as one session day');
  assertEqual(a.rate, 0.17, 'rate = 1/6');

  a = computeAdherence([], 3, now, new Date('2026-03-13T00:00:00Z'));
  assertEqual(a.rate, null, 'a programme younger than 7 days has no adherence rate yet');

  // ---------------------------------------------------------------- progression rules
  section('progression-review rules');
  const good = analyzeExercise(series([70, 74, 78, 84, 88, 90, 91, 92]));
  let s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 10, analysis: good, adherenceRate: 0.9 });
  assertEqual(s.length, 1, 'good quality + adherence -> one review prompt');
  assertEqual(s[0].kind, 'PROGRESS', 'prompt kind is PROGRESS');
  assertEqual(s[0].proposedRepetitions, 12, 'proposes +2 repetitions');
  assertEqual(s[0].proposedSets, 3, 'keeps sets unchanged');
  assertTrue(s[0].reason.includes('Adherence'), 'reason includes adherence evidence');

  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 10, analysis: good, adherenceRate: 0.4 });
  assertEqual(s.length, 0, 'low adherence -> no progression prompt');

  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 10, analysis: good, adherenceRate: null });
  assertEqual(s.length, 0, 'unknown adherence -> no progression prompt');

  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 15, analysis: good, adherenceRate: 0.9 });
  assertEqual(s[0].proposedSets, 4, 'at the repetition ceiling, proposes one more set instead');

  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 4, currentRepetitions: 15, analysis: good, adherenceRate: 0.9 });
  assertEqual(s.length, 0, 'at both ceilings -> nothing to propose');

  const goodButPain = analyzeExercise(series([70, 74, 78, 84, 88, 90, 91, 92]).map((p, i) => ({ ...p, pain: i === 7 ? 8 : 2 })));
  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 10, analysis: goodButPain, adherenceRate: 0.9 });
  assertEqual(s[0].kind, 'REVIEW_PAIN', 'high pain produces a pain review, never a progression');
  assertEqual(s[0].proposedRepetitions, null, 'a pain review proposes no change');

  const lowConf = analyzeExercise(series([70, 74, 78, 84, 88, 90, 91, 92], { confidence: 0.5 }));
  s = evaluateProgressionRules({ exerciseName: 'Sit-to-Stand', currentSets: 3, currentRepetitions: 10, analysis: lowConf, adherenceRate: 0.9 });
  assertEqual(s.length, 0, 'low capture confidence blocks a progression prompt');

  s = evaluateProgressionRules({ exerciseName: 'Squat-to-Chair', currentSets: 3, currentRepetitions: 10, analysis: analyzeExercise(series([88, 86, 82, 77, 72, 68, 64, 60])), adherenceRate: 0.9 });
  assertEqual(s[0].kind, 'REVIEW_DETERIORATION', 'deterioration produces a review prompt');
  assertEqual(s[0].proposedSets, null, 'deterioration review proposes no numbers');

  s = evaluateProgressionRules({ exerciseName: 'Squat-to-Chair', currentSets: 3, currentRepetitions: 10, analysis: analyzeExercise(series([70, 71, 70, 69, 71, 70, 70, 71])), adherenceRate: 0.9 });
  assertEqual(s[0].kind, 'REVIEW_PLATEAU', 'adherent plateau produces a plateau review');
  s = evaluateProgressionRules({ exerciseName: 'Squat-to-Chair', currentSets: 3, currentRepetitions: 10, analysis: analyzeExercise(series([70, 71, 70, 69, 71, 70, 70, 71])), adherenceRate: 0.2 });
  assertEqual(s.length, 0, 'a plateau with poor adherence is not flagged (adherence explains it)');

  s = evaluateProgressionRules({ exerciseName: 'X', currentSets: 3, currentRepetitions: 10, analysis: analyzeExercise(series([95, 95, 95])), adherenceRate: 1 });
  assertEqual(s.length, 0, 'too few sessions -> no prompt');

  // ---------------------------------------------------------------- upload validation
  section('session upload validation and abstention');
  const base = { programExerciseId: 1, sessionDate: '2026-01-01T10:00:00Z', status: 'VALID', overallScore: 80, pain: 2, difficulty: 4 };
  let v = validateSessionPayload(base);
  assertTrue(v.ok, 'a well-formed VALID session passes');

  v = validateSessionPayload({ ...base, pain: 15 });
  assertTrue(!v.ok && v.error.includes('pain'), 'pain above 10 is rejected');
  v = validateSessionPayload({ ...base, pain: 'abc' });
  assertTrue(!v.ok, 'non-numeric pain is rejected');
  v = validateSessionPayload({ ...base, overallScore: 250 });
  assertTrue(!v.ok && v.error.includes('overallScore'), 'overallScore above 100 is rejected');
  v = validateSessionPayload({ ...base, overallScore: undefined });
  assertTrue(!v.ok, 'a VALID session without a score is rejected');
  v = validateSessionPayload({ ...base, pain: undefined, difficulty: undefined });
  assertTrue(!v.ok && v.error.includes('required for an assessed session'), 'missing patient feedback is rejected for an assessed session');
  v = validateSessionPayload({ ...base, status: 'NOPE' });
  assertTrue(!v.ok, 'unknown status is rejected');
  v = validateSessionPayload({ ...base, sessionDate: '2999-01-01' });
  assertTrue(!v.ok && v.error.includes('future'), 'future date is rejected');
  v = validateSessionPayload({ ...base, clientSessionUuid: 'bad id!' });
  assertTrue(!v.ok, 'malformed clientSessionUuid is rejected');
  v = validateSessionPayload({ ...base, repetitions: [{ repetitionNumber: 1 }, { repetitionNumber: 1 }] });
  assertTrue(!v.ok && v.error.includes('duplicate'), 'duplicate repetition numbers are rejected');
  v = validateSessionPayload(null);
  assertTrue(!v.ok, 'null body is rejected');

  // abstained sessions: measurements are DISCARDED
  v = validateSessionPayload({
    programExerciseId: 1, sessionDate: '2026-01-01T10:00:00Z', status: 'LOW_CONFIDENCE',
    abstainReason: 'Left knee not tracked reliably', overallScore: 99,
    repetitions: [{ repetitionNumber: 1, metrics: [{ metricName: 'rom_deg', value: 100 }] }],
    landmarkPoints: [{ timestampMs: 0, landmarkName: 'leftKnee', x: 0.5, y: 0.5, confidence: 0.9 }],
  });
  assertTrue(v.ok, 'an abstained session with a reason is accepted');
  if (v.ok) {
    assertEqual(v.value.overallScore, null, 'an abstained session never stores a score, even if the client sent one');
    assertEqual(v.value.repetitions.length, 0, 'an abstained session drops repetitions/metrics');
    assertEqual(v.value.landmarkPoints.length, 0, 'an abstained session drops landmark data');
  }
  v = validateSessionPayload({ programExerciseId: 1, sessionDate: '2026-01-01T10:00:00Z', status: 'INVALID' });
  assertTrue(!v.ok && v.error.includes('abstainReason'), 'an abstained session without a reason is rejected');
  for (const st of ['INVALID', 'UNSUPPORTED', 'INCOMPLETE', 'LOW_CONFIDENCE', 'ABSTAINED']) {
    const x = validateSessionPayload({ programExerciseId: 1, sessionDate: '2026-01-01T10:00:00Z', status: st, abstainReason: 'why' });
    assertTrue(x.ok, `status ${st} is accepted with a reason and without feedback`);
  }

  v = validateSessionPayload({
    ...base, status: 'PARTIAL', unassessedMetrics: ['symmetry'], assessedMetrics: ['rom_deg', 'tempo_sec'],
    repetitions: [{
      repetitionNumber: 1, startMs: 0, endMs: 3000, angleTrace: [[0, 170], [400, 140], [800, 95]],
      metrics: [{ metricName: 'rom_deg', value: 95, expectedValue: 100, status: 'BELOW_TARGET' }],
      phases: [{ phaseName: 'lowering', startMs: 0, endMs: 1200, minAngle: 85, maxAngle: 172 }],
      errors: [{ errorCode: 'insufficient_rom', phaseName: 'bottom', severity: 'low' }],
    }],
  });
  assertTrue(v.ok, 'a PARTIAL session with phases and errors passes');
  if (v.ok) {
    assertEqual(v.value.unassessedMetrics, 'symmetry', 'unassessed metrics are kept');
    assertEqual(v.value.repetitions[0].phases.length, 1, 'phase-level results are kept');
    assertEqual(v.value.repetitions[0].angleTrace, '[[0,170],[400,140],[800,95]]', 'the angle trace is kept');
    assertEqual(v.value.repetitions[0].errors[0].errorCode, 'insufficient_rom', 'flagged errors are kept');
  }
  v = validateSessionPayload({ ...base, repetitions: [{ repetitionNumber: 1, angleTrace: [[1, 'x']] }] });
  assertTrue(!v.ok, 'a malformed angle trace is rejected');
  v = validateSessionPayload({ ...base, repetitions: [{ repetitionNumber: 1, errors: [{ errorCode: 'Bad Code' }] }] });
  assertTrue(!v.ok, 'malformed error code is rejected');

  // ---------------------------------------------------------------- effective assessment
  section('effective (clinician-corrected) assessment');
  const errs = [{ id: 1, repetitionId: 10, errorCode: 'trunk_lean' }, { id: 2, repetitionId: 10, errorCode: 'too_fast' }];
  const rv = (id: number, action: string, extra: object = {}) => ({
    id, action, errorId: null, repetitionNumber: null, errorCode: null, adjustedScore: null,
    createdAt: `2026-01-0${id}T00:00:00Z`, ...extra,
  });

  let e = computeEffective('VALID', 80, errs, []);
  assertEqual(e.effectiveErrorCount, 2, 'no reviews: effective = original');
  assertEqual(e.effectiveScore, 80, 'no reviews: effective score = automated score');

  e = computeEffective('VALID', 80, errs, [rv(1, 'DISMISS_ERROR', { errorId: 1 })]);
  assertEqual(e.effectiveErrorCount, 1, 'dismissing a false alert lowers the effective error count');
  assertEqual(e.originalErrorCount, 2, 'the original error count is preserved');

  e = computeEffective('VALID', 80, errs, [rv(1, 'DISMISS_ERROR', { errorId: 1 }), rv(2, 'CONFIRM_ERROR', { errorId: 1 })]);
  assertEqual(e.effectiveErrorCount, 2, 'the latest decision on an error wins');

  e = computeEffective('VALID', 80, errs, [rv(1, 'ADJUST_SCORE', { adjustedScore: 65 })]);
  assertEqual(e.effectiveScore, 65, 'an adjusted score becomes the effective score');
  assertEqual(e.originalScore, 80, 'the original score is preserved');

  e = computeEffective('LOW_CONFIDENCE', null, [], [rv(1, 'ADJUST_SCORE', { adjustedScore: 90 })]);
  assertEqual(e.effectiveScore, null, 'a score can never be adjusted onto an abstained session');

  e = computeEffective('VALID', 80, errs, [rv(1, 'ADD_ERROR', { repetitionNumber: 2, errorCode: 'knee_valgus' })]);
  assertEqual(e.effectiveErrorCount, 3, 'a clinician-added error is counted');
  assertEqual(e.addedErrors[0].errorCode, 'knee_valgus', 'the added error is listed');
}
