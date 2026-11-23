// baseline_comparison.dart
//
// Section 8: Technical Evaluation and Baselines.
// Compares:
//   Baseline 1: Simple Instantaneous Angle-Threshold Method
//   Baseline 2: Temporal Movement-Analysis Method
// Measures:
//   - Repetition segmentation accuracy
//   - Error-detection precision & recall
//   - False alert rate
//   - Abstention quality
//   - Processing latency per frame (ms)

import 'dart:math';
import 'geometry.dart';
import 'confidence.dart';
import 'movement_analyzer.dart';
import 'capture_quality.dart';

class EvaluationMetrics {
  final String method;
  final int repetitionsDetected;
  final int trueRepetitions;
  final double segmentationAccuracy;
  final int truePositiveErrors;
  final int falsePositiveErrors;
  final int falseNegativeErrors;
  final double precision;
  final double recall;
  final double falseAlertRate;
  final double averageLatencyMs;
  final bool correctlyAbstained;

  EvaluationMetrics({
    required this.method,
    required this.repetitionsDetected,
    required this.trueRepetitions,
    required this.segmentationAccuracy,
    required this.truePositiveErrors,
    required this.falsePositiveErrors,
    required this.falseNegativeErrors,
    required this.precision,
    required this.recall,
    required this.falseAlertRate,
    required this.averageLatencyMs,
    required this.correctlyAbstained,
  });

  Map<String, dynamic> toJson() => {
    'method': method,
    'repetitionsDetected': repetitionsDetected,
    'trueRepetitions': trueRepetitions,
    'segmentationAccuracy': segmentationAccuracy,
    'truePositiveErrors': truePositiveErrors,
    'falsePositiveErrors': falsePositiveErrors,
    'falseNegativeErrors': falseNegativeErrors,
    'precision': precision,
    'recall': recall,
    'falseAlertRate': falseAlertRate,
    'averageLatencyMs': averageLatencyMs,
    'correctlyAbstained': correctlyAbstained,
  };
}

class BaselineComparator {
  /// Evaluates both methods on identical frame stream.
  static Map<String, EvaluationMetrics> runComparison({
    required List<Map<String, dynamic>> recordedFrames,
    required int groundTruthRepetitions,
    required List<String> groundTruthErrors,
    required bool shouldAbstain,
    required List<Map<String, dynamic>> criteria,
  }) {
    // 1. Run Baseline 1 (Threshold)
    final b1Metrics = _runMethod(
      method: 'threshold',
      frames: recordedFrames,
      groundTruthRepetitions: groundTruthRepetitions,
      groundTruthErrors: groundTruthErrors,
      shouldAbstain: shouldAbstain,
      criteria: criteria,
    );

    // 2. Run Baseline 2 (Temporal)
    final b2Metrics = _runMethod(
      method: 'temporal',
      frames: recordedFrames,
      groundTruthRepetitions: groundTruthRepetitions,
      groundTruthErrors: groundTruthErrors,
      shouldAbstain: shouldAbstain,
      criteria: criteria,
    );

    return {
      'baseline1_threshold': b1Metrics,
      'baseline2_temporal': b2Metrics,
    };
  }

  static EvaluationMetrics _runMethod({
    required String method,
    required List<Map<String, dynamic>> frames,
    required int groundTruthRepetitions,
    required List<String> groundTruthErrors,
    required bool shouldAbstain,
    required List<Map<String, dynamic>> criteria,
  }) {
    final analyzer = MovementAnalyzer(
      exerciseName: 'Sit-to-Stand',
      engineKey: 'sit_to_stand',
      requiredLandmarks: ['leftHip', 'leftKnee', 'leftAnkle'],
      criteria: criteria,
      analysisMethod: method,
    );

    final stopwatch = Stopwatch();
    int totalElapsedMicros = 0;

    for (final f in frames) {
      final landmarks = (f['landmarks'] as Map<String, dynamic>).map(
        (k, v) => MapEntry(k, Point2D((v['x'] as num).toDouble(), (v['y'] as num).toDouble())),
      );
      final confidences = (f['confidences'] as Map<String, dynamic>).map(
        (k, v) => MapEntry(k, (v as num).toDouble()),
      );
      final timestamp = DateTime.fromMillisecondsSinceEpoch(f['timestampMs'] as int);

      stopwatch.start();
      analyzer.processFrame(
        landmarks: landmarks,
        confidences: confidences,
        timestamp: timestamp,
      );
      stopwatch.stop();
      totalElapsedMicros += stopwatch.elapsedMicroseconds;
      stopwatch.reset();
    }

    final cameraCheck = CameraQualityCheck(
      isReady: !shouldAbstain,
      status: shouldAbstain ? 'INVALID' : 'VALID',
      message: shouldAbstain ? 'Subject out of frame' : null,
      jointsVisible: {'leftHip': true, 'leftKnee': true, 'leftAnkle': true},
      averageConfidence: shouldAbstain ? 0.45 : 0.92,
    );

    final outcome = analyzer.finalizeSession(cameraCheck: cameraCheck);

    final int detectedReps = outcome.repetitions.length;
    final double segAcc = groundTruthRepetitions > 0
        ? (1.0 - (detectedReps - groundTruthRepetitions).abs() / groundTruthRepetitions).clamp(0.0, 1.0)
        : 1.0;

    final detectedErrorCodes = outcome.repetitions.expand((r) => r.errors.map((e) => e['errorCode'] as String)).toSet();

    int tp = 0;
    int fp = 0;
    for (final err in detectedErrorCodes) {
      if (groundTruthErrors.contains(err)) {
        tp++;
      } else {
        fp++;
      }
    }
    final int fn = groundTruthErrors.where((e) => !detectedErrorCodes.contains(e)).length;

    final double precision = (tp + fp) > 0 ? tp / (tp + fp) : 1.0;
    final double recall = (tp + fn) > 0 ? tp / (tp + fn) : 1.0;
    final double falseAlertRate = (tp + fp) > 0 ? fp / (tp + fp) : 0.0;
    final double avgLatencyMs = frames.isNotEmpty ? (totalElapsedMicros / frames.length) / 1000.0 : 0.0;
    final bool abstainedCorrectly = shouldAbstain ? outcome.status != 'VALID' : outcome.status == 'VALID';

    return EvaluationMetrics(
      method: method,
      repetitionsDetected: detectedReps,
      trueRepetitions: groundTruthRepetitions,
      segmentationAccuracy: segAcc,
      truePositiveErrors: tp,
      falsePositiveErrors: fp,
      falseNegativeErrors: fn,
      precision: precision,
      recall: recall,
      falseAlertRate: falseAlertRate,
      averageLatencyMs: avgLatencyMs,
      correctlyAbstained: abstainedCorrectly,
    );
  }
}
