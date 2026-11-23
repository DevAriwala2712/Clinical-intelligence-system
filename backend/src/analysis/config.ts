// config.ts
//
// Every threshold the longitudinal analysis and the progression-review rules
// use lives here, in ONE place, with the reason for it next to it.
//
// IMPORTANT: these are engineering defaults chosen to be conservative and
// explainable. They have NOT been clinically validated. A physiotherapist
// must review them before any claim of clinical validity (see
// docs/EVALUATION.md). Nothing here prescribes treatment - the outputs only
// ask a clinician to REVIEW.

export const ANALYSIS_CONFIG = {
  // Trend needs enough assessed sessions to avoid reacting to noise:
  // 3 "recent" sessions compared with the 3 before them.
  window: 3,
  minAssessedSessions: 6,
  // Use at most this many of the latest assessed sessions for the slope.
  maxSessionsForSlope: 10,

  // Improvement / deterioration: BOTH the change in median score and the
  // robust (Theil-Sen) slope must agree, and at least 2 of the 3 recent
  // sessions must be on the right side of the earlier median, so one
  // unusually good (or bad) session cannot create a trend on its own.
  improveDeltaPoints: 5,
  improveSlopePerSession: 1.0,
  recentAgreeCount: 2,

  // Plateau: scores flat across the whole window but still below target.
  // Needs a longer history than a trend (8 sessions).
  plateauDeltaPoints: 3,
  plateauSlopePerSession: 0.5,
  plateauMinSessions: 8,
  targetScore: 85,

  // Inconsistent: spread of scores around their own trend line.
  inconsistentResidualSd: 10,

  // Component (ROM / tempo / control / ...) trend, in "% of repetitions that met target".
  componentDeltaPercent: 20,

  // Pain / difficulty (0-10 self-report, any session type).
  selfReportMinReports: 6,
  selfReportDelta: 1.5,
  painHighSingle: 7,        // a single report this high asks for a review
  painHighMedian: 5,        // median of the last 3 reports

  // Adherence
  adherenceWindowDays: 14,
  adherenceMinDaysObserved: 7,
  adherenceForProgression: 0.7,
  adherenceForPlateauReview: 0.6,

  // Progression-review proposal
  progressMinRecentMedian: 85,
  progressMaxPainMedian: 3,
  progressMaxDifficultyMedian: 6,
  progressMinConfidence: 0.7,
  maxRepetitions: 15,
  maxSets: 4,
  repetitionStep: 2,
  // After a suggestion was decided, wait for this many new assessed sessions
  // before suggesting again for the same exercise (avoids nagging).
  cooldownAssessedSessions: 3,
} as const;
