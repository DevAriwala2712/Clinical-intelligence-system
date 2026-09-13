// confidence.dart
//
// WHAT THIS FILE DOES
// This is the "should we trust this measurement?" gatekeeper (Sections
// 19-23 of the spec). Every frame the pose model gives us comes with a
// confidence value per landmark (how sure the model is that it correctly
// found that point). Before we calculate ANY angle or score, we check
// whether the landmarks we need are actually reliable.
//
// DESIGN PRINCIPLE: "a wrong score is worse than no score" (Section 143).
// This file's only job is deciding VALID vs ABSTAIN. It never invents a
// number to paper over missing data.

/// One frame's worth of landmark data from the pose model, simplified to
/// just what confidence-checking needs: a name -> confidence value map.
/// e.g. { "hip": 0.91, "knee": 0.44, "ankle": 0.88 }
typedef LandmarkConfidenceMap = Map<String, double>;

/// The result of a confidence check: either the session can proceed, or it
/// must abstain with a specific, patient-readable reason.
class ConfidenceResult {
  final bool isReliable;
  final double averageConfidence; // stored on the session row regardless of outcome
  final String? abstainReason; // null if isReliable is true
  const ConfidenceResult({
    required this.isReliable,
    required this.averageConfidence,
    this.abstainReason,
  });
}

/// Minimum confidence a single required landmark must have to be trusted.
/// This is the number from Section 21's example. It is intentionally a
/// named constant (not buried in an if-statement) so it's easy to find,
/// justify in the viva, and tune later.
const double kMinimumLandmarkConfidence = 0.70;

/// Checks whether the landmarks REQUIRED for a specific exercise are all
/// visible and confident enough to proceed with scoring.
///
/// [requiredLandmarks] comes from the exercise's definition, e.g.
/// ['hip', 'knee', 'ankle'] for a knee exercise (Section 18).
/// [frame] is the confidence values the pose model gave us this frame.
ConfidenceResult checkFrameConfidence({
  required List<String> requiredLandmarks,
  required LandmarkConfidenceMap frame,
}) {
  final List<double> requiredConfidences = [];

  for (final landmarkName in requiredLandmarks) {
    final double? confidence = frame[landmarkName];

    // The landmark wasn't returned by the pose model at all -> definitely abstain.
    if (confidence == null) {
      return ConfidenceResult(
        isReliable: false,
        averageConfidence: 0.0,
        abstainReason: 'Required landmark "$landmarkName" was not detected. '
            'Move so your full body is visible to the camera.',
      );
    }
    requiredConfidences.add(confidence);
  }

  // The average is stored for display/analytics, but the DECISION is based
  // on the MINIMUM confidence, not the average. This matters: if 4 out of 5
  // required landmarks are perfectly tracked and 1 is at 0.2 confidence, a
  // high average would hide the fact that one critical joint is unreliable.
  final double average =
      requiredConfidences.reduce((a, b) => a + b) / requiredConfidences.length;
  final double minimum = requiredConfidences.reduce((a, b) => a < b ? a : b);

  if (minimum < kMinimumLandmarkConfidence) {
    return ConfidenceResult(
      isReliable: false,
      averageConfidence: average,
      abstainReason: 'A required joint is not being tracked reliably '
          '(confidence ${minimum.toStringAsFixed(2)}, need at least '
          '${kMinimumLandmarkConfidence.toStringAsFixed(2)}). '
          'Move to better lighting or step back so your full body is visible.',
    );
  }

  return ConfidenceResult(isReliable: true, averageConfidence: average);
}

/// Checks whether more than one person appears to be in frame.
/// [detectedPersonCount] should come directly from however many separate
/// pose results the plugin returned for this frame. If the chosen pose
/// package cannot separate multiple people, this should always be called
/// with 1 and the limitation documented (Section 23 / Section 142).
ConfidenceResult checkSinglePerson(int detectedPersonCount) {
  if (detectedPersonCount == 0) {
    return const ConfidenceResult(
      isReliable: false,
      averageConfidence: 0.0,
      abstainReason: 'No person detected in frame.',
    );
  }
  if (detectedPersonCount > 1) {
    return const ConfidenceResult(
      isReliable: false,
      averageConfidence: 0.0,
      abstainReason: 'More than one person was detected. '
          'Please make sure only you are visible to the camera.',
    );
  }
  return const ConfidenceResult(isReliable: true, averageConfidence: 1.0);
}

/// A whole RECORDING (many frames) is only VALID if a large enough fraction
/// of its frames passed the per-frame confidence check. A single bad frame
/// in an otherwise good recording shouldn't throw away the whole session,
/// but a recording that was unreliable most of the time should abstain.
///
/// [reliableFrameCount] / [totalFrameCount] must be >= this fraction.
const double kMinimumReliableFrameFraction = 0.80;

ConfidenceResult checkRecordingConfidence({
  required int reliableFrameCount,
  required int totalFrameCount,
  required double averageConfidenceAcrossFrames,
}) {
  if (totalFrameCount == 0) {
    return const ConfidenceResult(
      isReliable: false,
      averageConfidence: 0.0,
      abstainReason: 'No usable frames were recorded.',
    );
  }

  final double reliableFraction = reliableFrameCount / totalFrameCount;

  if (reliableFraction < kMinimumReliableFrameFraction) {
    return ConfidenceResult(
      isReliable: false,
      averageConfidence: averageConfidenceAcrossFrames,
      abstainReason: 'Tracking was unstable for too much of the recording '
          '(reliable for ${(reliableFraction * 100).toStringAsFixed(0)}% of frames, '
          'need at least ${(kMinimumReliableFrameFraction * 100).toStringAsFixed(0)}%). '
          'Try again with steadier framing.',
    );
  }

  return ConfidenceResult(
    isReliable: true,
    averageConfidence: averageConfidenceAcrossFrames,
  );
}
