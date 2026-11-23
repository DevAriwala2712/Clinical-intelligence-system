// capture_quality.dart
//
// Validates camera setup and landmark tracking quality before and during assessment.
// Enforces Section 7: Reliability, Confidence, and Explicit Abstention.
// Never generates fabricated scores when camera positioning or visibility is invalid.

import 'dart:math';
import 'geometry.dart';
import 'confidence.dart';

class CameraQualityCheck {
  final bool isReady;
  final String status; // 'VALID', 'LOW_CONFIDENCE', 'INVALID', 'UNSUPPORTED'
  final String? message;
  final Map<String, bool> jointsVisible;
  final double averageConfidence;
  final Map<String, dynamic> metadata;

  const CameraQualityCheck({
    required this.isReady,
    required this.status,
    this.message,
    required this.jointsVisible,
    required this.averageConfidence,
    this.metadata = const {},
  });
}

class CaptureQualityValidator {
  static const double kMinConfidence = 0.70;
  static const double kMinSubjectHeightRatio = 0.40; // Subject should take up at least 40% of vertical frame
  static const double kMaxSubjectHeightRatio = 0.95; // Too close if > 95%

  /// Evaluates camera setup suitability given the detected landmarks map and expected camera view ('side' | 'front').
  static CameraQualityCheck evaluateSetup({
    required List<String> requiredLandmarks,
    required String cameraView,
    required Map<String, Point2D> landmarks,
    required LandmarkConfidenceMap confidences,
  }) {
    final Map<String, bool> visibility = {};
    final List<double> confList = [];

    // 1. Joint visibility & confidence check
    for (final name in requiredLandmarks) {
      final point = landmarks[name];
      final conf = confidences[name] ?? 0.0;
      final isVisible = point != null && conf >= kMinConfidence;
      visibility[name] = isVisible;
      if (conf > 0) confList.add(conf);
    }

    final double avgConf = confList.isNotEmpty
        ? confList.reduce((a, b) => a + b) / confList.length
        : 0.0;

    // Check for missing critical joints
    final missing = visibility.entries.where((e) => !e.value).map((e) => e.key).toList();
    if (missing.isNotEmpty) {
      return CameraQualityCheck(
        isReady: false,
        status: 'INVALID',
        message: 'Missing required joints: ${missing.join(', ')}. Please position the camera so your full body is visible.',
        jointsVisible: visibility,
        averageConfidence: avgConf,
        metadata: {'missingLandmarks': missing, 'cameraView': cameraView},
      );
    }

    // Check overall confidence threshold
    if (avgConf < kMinConfidence) {
      return CameraQualityCheck(
        isReady: false,
        status: 'LOW_CONFIDENCE',
        message: 'Tracking confidence is too low (${(avgConf * 100).toInt()}%). Check lighting and ensure you contrast with the background.',
        jointsVisible: visibility,
        averageConfidence: avgConf,
        metadata: {'confidence': avgConf, 'cameraView': cameraView},
      );
    }

    // 2. Framing / Distance validation using bounding box
    final yValues = landmarks.values.map((p) => p.y).toList();
    final minY = yValues.reduce(min);
    final maxY = yValues.reduce(max);
    final double subjectHeight = (maxY - minY).abs();

    if (subjectHeight < kMinSubjectHeightRatio) {
      return CameraQualityCheck(
        isReady: false,
        status: 'INVALID',
        message: 'You are too far from the camera. Please step closer (approx. 2 metres).',
        jointsVisible: visibility,
        averageConfidence: avgConf,
        metadata: {'subjectHeight': subjectHeight, 'cameraView': cameraView},
      );
    }

    if (subjectHeight > kMaxSubjectHeightRatio) {
      return CameraQualityCheck(
        isReady: false,
        status: 'INVALID',
        message: 'You are too close to the camera. Please step back so your full body is in frame.',
        jointsVisible: visibility,
        averageConfidence: avgConf,
        metadata: {'subjectHeight': subjectHeight, 'cameraView': cameraView},
      );
    }

    // 3. Camera view check (approximate heuristic: side view vs front view)
    if (cameraView == 'front' && landmarks.containsKey('leftShoulder') && landmarks.containsKey('rightShoulder')) {
      final double shoulderDiffX = (landmarks['leftShoulder']!.x - landmarks['rightShoulder']!.x).abs();
      if (shoulderDiffX < 0.08) {
        return CameraQualityCheck(
          isReady: false,
          status: 'INVALID',
          message: 'This exercise requires a FRONT-ON camera view. Please face the camera directly.',
          jointsVisible: visibility,
          averageConfidence: avgConf,
          metadata: {'shoulderDiffX': shoulderDiffX, 'cameraView': cameraView},
        );
      }
    }

    // All setup criteria passed
    return CameraQualityCheck(
      isReady: true,
      status: 'VALID',
      message: 'Positioning and tracking quality optimal. You may begin the exercise.',
      jointsVisible: visibility,
      averageConfidence: avgConf,
      metadata: {'subjectHeight': subjectHeight, 'cameraView': cameraView, 'checks': 'all_passed'},
    );
  }
}
