// quality_scorer.dart
//
// WHAT THIS FILE DOES
// Takes the raw measurements from one repetition (how far it moved, how
// long it took, how shaky it was, etc.) and turns them into a single,
// FULLY EXPLAINABLE quality score out of 100 (Sections 33/80/81: "no
// black box"). Every number that goes into the final score is stored, so
// the clinician can always open "why was this score given?" and see the
// breakdown.
//
// IMPORTANT: this is NOT one generic formula for every exercise (Section
// 14). Which metrics apply, and how much each one is weighted, comes from
// that exercise's `exercise_criteria` rows in the database. This file just
// does the arithmetic once the criteria are known.

/// One named sub-score (e.g. "ROM: 85/100") plus the raw numbers behind it,
/// so the UI can show both the score and the evidence.
class MetricScore {
  final String metricName; // 'rom', 'tempo', 'control', 'symmetry', 'compensation'
  final double observedValue;
  final double targetValue;
  final double score; // 0-100
  final double weight; // 0.0-1.0, how much this contributes to the overall score
  final String status; // 'MET' | 'BELOW_TARGET' | 'ABOVE_TARGET' | 'FLAGGED'

  const MetricScore({
    required this.metricName,
    required this.observedValue,
    required this.targetValue,
    required this.score,
    required this.weight,
    required this.status,
  });
}

class QualityResult {
  final List<MetricScore> metricScores;
  final double overallScore; // weighted sum, 0-100

  const QualityResult({required this.metricScores, required this.overallScore});
}

/// ---- ROM (range of motion) ----
/// Compares the observed peak angle-of-motion against the clinician's
/// target. Getting CLOSER to the target is better; overshooting slightly
/// is not penalized as harshly as falling short (rehab ROM targets are
/// usually a floor to reach, not a ceiling not to cross - Section 27).
MetricScore scoreROM({
  required double observedRomDeg,
  required double targetRomDeg,
  required double weight,
}) {
  double score;
  String status;

  if (observedRomDeg >= targetRomDeg) {
    score = 100; // met or exceeded the target range
    status = 'MET';
  } else {
    // Linear scale: 0 ROM = 0 score, target ROM = 100 score.
    score = (observedRomDeg / targetRomDeg) * 100;
    score = score.clamp(0, 100);
    status = 'BELOW_TARGET';
  }

  return MetricScore(
    metricName: 'rom',
    observedValue: observedRomDeg,
    targetValue: targetRomDeg,
    score: score,
    weight: weight,
    status: status,
  );
}

/// ---- Tempo ----
/// Rehab tempo targets are usually a RANGE (e.g. "2-3 seconds"), not a
/// single number, because both rushing and moving unnaturally slowly are
/// undesirable (Section 28).
MetricScore scoreTempo({
  required double observedSeconds,
  required double minTargetSeconds,
  required double maxTargetSeconds,
  required double weight,
}) {
  double score;
  String status;

  if (observedSeconds >= minTargetSeconds && observedSeconds <= maxTargetSeconds) {
    score = 100;
    status = 'MET';
  } else if (observedSeconds < minTargetSeconds) {
    // Too fast: score falls off the further below the minimum it is.
    score = (observedSeconds / minTargetSeconds) * 100;
    status = 'BELOW_TARGET'; // "faster than target"
  } else {
    // Too slow: score falls off the further above the maximum it is.
    // We cap the "penalty distance" at the max target itself so the score
    // doesn't go needlessly negative for a very slow but still safe rep.
    final double overBy = observedSeconds - maxTargetSeconds;
    score = 100 - (overBy / maxTargetSeconds) * 100;
    status = 'ABOVE_TARGET'; // "slower than target"
  }

  score = score.clamp(0, 100);
  final double targetMidpoint = (minTargetSeconds + maxTargetSeconds) / 2;

  return MetricScore(
    metricName: 'tempo',
    observedValue: observedSeconds,
    targetValue: targetMidpoint,
    score: score,
    weight: weight,
    status: status,
  );
}

/// ---- Control ----
/// Measures how SMOOTH the movement was, using the standard deviation of
/// frame-to-frame angle changes during the rep. A controlled movement
/// changes angle gradually; a jerky one has sudden spikes (Section 29).
/// [angleDeltas] = the difference between consecutive smoothed-angle
/// readings across the whole repetition.
MetricScore scoreControl({
  required List<double> angleDeltas,
  required double maxAcceptableJerkDeg,
  required double weight,
}) {
  if (angleDeltas.isEmpty) {
    return MetricScore(
      metricName: 'control',
      observedValue: 0,
      targetValue: maxAcceptableJerkDeg,
      score: 0,
      weight: weight,
      status: 'FLAGGED',
    );
  }

  // Largest single frame-to-frame jump = the "jerkiest" moment in the rep.
  final double maxJerk = angleDeltas.map((d) => d.abs()).reduce((a, b) => a > b ? a : b);

  double score;
  String status;
  if (maxJerk <= maxAcceptableJerkDeg) {
    score = 100;
    status = 'MET';
  } else {
    score = (maxAcceptableJerkDeg / maxJerk) * 100;
    status = 'FLAGGED';
  }
  score = score.clamp(0, 100);

  return MetricScore(
    metricName: 'control',
    observedValue: maxJerk,
    targetValue: maxAcceptableJerkDeg,
    score: score,
    weight: weight,
    status: status,
  );
}

/// ---- Symmetry ----
/// Compares left-side vs right-side angle for bilateral exercises
/// (Section 30). Only meaningful for exercises where both sides should
/// move the same amount (e.g. squat-to-chair), not single-limb exercises.
MetricScore scoreSymmetry({
  required double leftAngleDeg,
  required double rightAngleDeg,
  required double maxAcceptableDifferenceDeg,
  required double weight,
}) {
  final double difference = (leftAngleDeg - rightAngleDeg).abs();

  double score;
  String status;
  if (difference <= maxAcceptableDifferenceDeg) {
    score = 100;
    status = 'MET';
  } else {
    score = (maxAcceptableDifferenceDeg / difference) * 100;
    score = score.clamp(0, 100);
    status = 'FLAGGED'; // "Movement asymmetry detected" - never "you have an injury"
  }

  return MetricScore(
    metricName: 'symmetry',
    observedValue: difference,
    targetValue: maxAcceptableDifferenceDeg,
    score: score,
    weight: weight,
    status: status,
  );
}

/// ---- Compensation ----
/// A yes/no-style flag for an exercise-specific "cheat" movement, e.g.
/// trunk lean during shoulder flexion (Section 31). Because it's a flag
/// rather than a continuous measurement, the score is binary: 100 if the
/// compensation angle stayed under the threshold, a fixed penalty if not.
MetricScore scoreCompensation({
  required double observedCompensationAngleDeg,
  required double maxAcceptableAngleDeg,
  required double weight,
  required String compensationLabel, // e.g. 'trunk_lean'
}) {
  final bool flagged = observedCompensationAngleDeg > maxAcceptableAngleDeg;

  return MetricScore(
    metricName: 'compensation_$compensationLabel',
    observedValue: observedCompensationAngleDeg,
    targetValue: maxAcceptableAngleDeg,
    score: flagged ? 40 : 100, // fixed penalty rather than a sliding scale, since this is a binary flag
    weight: weight,
    status: flagged ? 'FLAGGED' : 'MET',
  );
}

/// ---- Combine everything ----
/// Takes whichever MetricScores apply to THIS exercise (not every exercise
/// uses every metric - Section 32) and combines them into one overall
/// score using each metric's configured weight. Weights should sum to 1.0
/// across the metrics actually used; if they don't, we normalize so the
/// result still lands in the 0-100 range.
QualityResult combineScores(List<MetricScore> scores) {
  final double totalWeight = scores.fold(0.0, (sum, m) => sum + m.weight);

  if (totalWeight == 0) {
    // No weighted metrics were provided - cannot compute a meaningful score.
    return QualityResult(metricScores: scores, overallScore: 0);
  }

  final double weightedSum = scores.fold(0.0, (sum, m) => sum + (m.score * m.weight));
  final double overall = weightedSum / totalWeight;

  return QualityResult(metricScores: scores, overallScore: overall);
}
