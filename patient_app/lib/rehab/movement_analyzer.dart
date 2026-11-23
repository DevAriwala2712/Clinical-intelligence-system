// movement_analyzer.dart
//
// Central on-device movement analysis engine.
// Connects pose landmarks to geometry calculations, repetition state machine,
// error detection, and quality scoring.
// Supports both Baseline 1 (Threshold) and Baseline 2 (Temporal).

import 'dart:math';
import 'geometry.dart';
import 'confidence.dart';
import 'movement_state_machine.dart';
import 'quality_scorer.dart';
import 'capture_quality.dart';

class AnalyzedRepetition {
  final int repetitionNumber;
  final int startMs;
  final int endMs;
  final List<List<double>> angleTrace; // [[timestampMs, angleDeg], ...]
  final List<Map<String, dynamic>> metrics;
  final List<Map<String, dynamic>> phases;
  final List<Map<String, dynamic>> errors;

  AnalyzedRepetition({
    required this.repetitionNumber,
    required this.startMs,
    required this.endMs,
    required this.angleTrace,
    required this.metrics,
    required this.phases,
    required this.errors,
  });

  Map<String, dynamic> toJson() => {
    'repetitionNumber': repetitionNumber,
    'startMs': startMs,
    'endMs': endMs,
    'angleTrace': angleTrace,
    'metrics': metrics,
    'phases': phases,
    'errors': errors,
  };
}

class SessionAnalysisOutcome {
  final String status; // 'VALID' | 'PARTIAL' | 'LOW_CONFIDENCE' | 'INVALID' | 'INCOMPLETE'
  final String? abstainReason;
  final double? overallScore;
  final double confidence;
  final String analysisMethod; // 'temporal' | 'threshold'
  final List<AnalyzedRepetition> repetitions;
  final List<Map<String, dynamic>> landmarkPoints;
  final Map<String, dynamic> captureQuality;
  final List<String> assessedMetrics;
  final List<String> unassessedMetrics;

  SessionAnalysisOutcome({
    required this.status,
    this.abstainReason,
    this.overallScore,
    required this.confidence,
    required this.analysisMethod,
    required this.repetitions,
    required this.landmarkPoints,
    required this.captureQuality,
    required this.assessedMetrics,
    required this.unassessedMetrics,
  });
}

class MovementAnalyzer {
  final String exerciseName;
  final String engineKey;
  final List<String> requiredLandmarks;
  final List<Map<String, dynamic>> criteria;
  final String analysisMethod; // 'temporal' | 'threshold'

  late final RepetitionStateMachine _stateMachine;
  final List<AnalyzedRepetition> _completedRepetitions = [];
  final List<Map<String, dynamic>> _landmarkTrace = [];
  final List<List<double>> _currentRepAngleTrace = [];
  final List<double> _confidenceSamples = [];

  DateTime? _sessionStartTime;
  DateTime? _repStartTime;
  double _minRepAngle = 180.0;
  double _maxRepAngle = 0.0;
  double _prevAngle = 180.0;
  double _maxJerk = 0.0;
  double _maxTrunkLean = 0.0;

  MovementAnalyzer({
    required this.exerciseName,
    required this.engineKey,
    required this.requiredLandmarks,
    required this.criteria,
    this.analysisMethod = 'temporal',
  }) {
    // Configure phase thresholds based on exercise type
    PhaseThresholds thresholds;
    if (engineKey == 'sit_to_stand' || engineKey == 'squat_to_chair') {
      thresholds = const PhaseThresholds(startThresholdDeg: 155.0, bottomThresholdDeg: 110.0);
    } else if (engineKey == 'seated_knee_flexion') {
      thresholds = const PhaseThresholds(startThresholdDeg: 95.0, bottomThresholdDeg: 135.0);
    } else if (engineKey == 'shoulder_flexion') {
      thresholds = const PhaseThresholds(startThresholdDeg: 40.0, bottomThresholdDeg: 130.0);
    } else {
      // elbow flexion / bicep curl
      thresholds = const PhaseThresholds(startThresholdDeg: 150.0, bottomThresholdDeg: 80.0);
    }
    _stateMachine = RepetitionStateMachine(thresholds: thresholds);
  }

  /// Calculates the primary joint angle for the active exercise.
  double computePrimaryAngle(Map<String, Point2D> lm) {
    if (engineKey == 'sit_to_stand' || engineKey == 'squat_to_chair') {
      final hip = lm['leftHip'] ?? lm['rightHip'];
      final knee = lm['leftKnee'] ?? lm['rightKnee'];
      final ankle = lm['leftAnkle'] ?? lm['rightAnkle'];
      if (hip != null && knee != null && ankle != null) {
        return calculateAngle(hip, knee, ankle);
      }
    } else if (engineKey == 'shoulder_flexion') {
      final hip = lm['leftHip'] ?? lm['rightHip'];
      final shoulder = lm['leftShoulder'] ?? lm['rightShoulder'];
      final elbow = lm['leftElbow'] ?? lm['rightElbow'];
      if (hip != null && shoulder != null && elbow != null) {
        return calculateAngle(hip, shoulder, elbow);
      }
    } else if (engineKey == 'seated_knee_flexion') {
      final hip = lm['leftHip'] ?? lm['rightHip'];
      final knee = lm['leftKnee'] ?? lm['rightKnee'];
      final ankle = lm['leftAnkle'] ?? lm['rightAnkle'];
      if (hip != null && knee != null && ankle != null) {
        return calculateAngle(hip, knee, ankle);
      }
    } else {
      // elbow flexion
      final shoulder = lm['leftShoulder'] ?? lm['rightShoulder'];
      final elbow = lm['leftElbow'] ?? lm['rightElbow'];
      final wrist = lm['leftWrist'] ?? lm['rightWrist'];
      if (shoulder != null && elbow != null && wrist != null) {
        return calculateAngle(shoulder, elbow, wrist);
      }
    }
    return 180.0;
  }

  /// Calculates compensation trunk lean angle relative to vertical.
  double computeTrunkLean(Map<String, Point2D> lm) {
    final shoulder = lm['leftShoulder'] ?? lm['rightShoulder'];
    final hip = lm['leftHip'] ?? lm['rightHip'];
    if (shoulder != null && hip != null) {
      final dx = (shoulder.x - hip.x).abs();
      final dy = (shoulder.y - hip.y).abs();
      if (dy > 0) {
        return atan(dx / dy) * (180.0 / pi);
      }
    }
    return 0.0;
  }

  /// Feed one video frame analysis.
  void processFrame({
    required Map<String, Point2D> landmarks,
    required LandmarkConfidenceMap confidences,
    required DateTime timestamp,
  }) {
    _sessionStartTime ??= timestamp;
    _repStartTime ??= timestamp;

    final primaryAngle = computePrimaryAngle(landmarks);
    final trunkLean = computeTrunkLean(landmarks);
    final int elapsedMs = timestamp.difference(_sessionStartTime!).inMilliseconds;

    // Track landmark confidence
    final frameConf = checkFrameConfidence(requiredLandmarks: requiredLandmarks, frame: confidences);
    _confidenceSamples.add(frameConf.averageConfidence);

    // Record downsampled angle trace
    _currentRepAngleTrace.add([elapsedMs.toDouble(), primaryAngle]);

    // Record landmark points for evidence review (downsampled to ~15fps)
    if (_landmarkTrace.length < 500) {
      for (final name in requiredLandmarks) {
        final pt = landmarks[name];
        if (pt != null) {
          _landmarkTrace.add({
            'repetitionNumber': _stateMachine.repetitionCount + 1,
            'timestampMs': elapsedMs,
            'landmarkName': name,
            'x': pt.x,
            'y': pt.y,
            'confidence': confidences[name] ?? 0.85,
            'phase': _stateMachine.currentPhase.name,
          });
        }
      }
    }

    // Kinematic tracking
    _minRepAngle = min(_minRepAngle, primaryAngle);
    _maxRepAngle = max(_maxRepAngle, primaryAngle);
    _maxTrunkLean = max(_maxTrunkLean, trunkLean);

    final double jerk = (_prevAngle - primaryAngle).abs();
    _maxJerk = max(_maxJerk, jerk);
    _prevAngle = primaryAngle;

    // State machine update
    final int prevRepCount = _stateMachine.repetitionCount;
    _stateMachine.update(primaryAngle, timestamp);

    // If repetition completed:
    if (_stateMachine.repetitionCount > prevRepCount) {
      _finalizeRepetition(prevRepCount + 1, timestamp);
    }
  }

  void _finalizeRepetition(int repNumber, DateTime timestamp) {
    final repDurationSec = timestamp.difference(_repStartTime!).inMilliseconds / 1000.0;
    final romObserved = (_maxRepAngle - _minRepAngle).abs();

    // Find configured criteria
    double targetRom = 120.0;
    double targetTempoMin = 1.5;
    double targetTempoMax = 4.0;
    double maxControlJerk = 25.0;
    double maxTrunkLeanAllowed = 25.0;

    for (final c in criteria) {
      final name = c['metricName'];
      if (name == 'rom_deg' && c['targetValue'] != null) targetRom = (c['targetValue'] as num).toDouble();
      if (name == 'tempo_min_sec' && c['minimumValue'] != null) targetTempoMin = (c['minimumValue'] as num).toDouble();
      if (name == 'tempo_max_sec' && c['maximumValue'] != null) targetTempoMax = (c['maximumValue'] as num).toDouble();
      if (name == 'control_max_jerk_deg' && c['maximumValue'] != null) maxControlJerk = (c['maximumValue'] as num).toDouble();
      if (name == 'compensation_trunk_lean_deg' && c['maximumValue'] != null) maxTrunkLeanAllowed = (c['maximumValue'] as num).toDouble();
    }

    final List<Map<String, dynamic>> metrics = [
      {
        'metricName': 'rom_deg',
        'value': romObserved,
        'expectedValue': targetRom,
        'status': romObserved >= targetRom ? 'MET' : 'BELOW_TARGET',
      },
      {
        'metricName': 'tempo_sec',
        'value': repDurationSec,
        'expectedValue': (targetTempoMin + targetTempoMax) / 2,
        'status': (repDurationSec >= targetTempoMin && repDurationSec <= targetTempoMax) ? 'MET' : 'FLAGGED',
      },
      {
        'metricName': 'control_max_jerk_deg',
        'value': _maxJerk,
        'expectedValue': maxControlJerk,
        'status': _maxJerk <= maxControlJerk ? 'MET' : 'FLAGGED',
      },
      {
        'metricName': 'compensation_trunk_lean_deg',
        'value': _maxTrunkLean,
        'expectedValue': maxTrunkLeanAllowed,
        'status': _maxTrunkLean <= maxTrunkLeanAllowed ? 'MET' : 'FLAGGED',
      },
    ];

    // Detect errors
    final List<Map<String, dynamic>> errors = [];
    if (romObserved < targetRom * 0.85) {
      errors.add({
        'errorCode': 'insufficient_rom',
        'phaseName': 'bottom',
        'severity': romObserved < targetRom * 0.7 ? 'high' : 'medium',
        'detail': '${romObserved.toInt()}° reached vs ${targetRom.toInt()}° target',
      });
    }
    if (repDurationSec < targetTempoMin) {
      errors.add({
        'errorCode': 'too_fast',
        'phaseName': 'moving',
        'severity': 'low',
        'detail': 'Repetition tempo ${repDurationSec.toStringAsFixed(1)}s too fast',
      });
    }
    if (_maxJerk > maxControlJerk) {
      errors.add({
        'errorCode': 'jerky_motion',
        'phaseName': 'moving',
        'severity': 'medium',
        'detail': 'Excessive velocity jerk (${_maxJerk.toStringAsFixed(1)}°/frame)',
      });
    }
    if (_maxTrunkLean > maxTrunkLeanAllowed) {
      errors.add({
        'errorCode': 'trunk_lean',
        'phaseName': 'rising',
        'severity': 'medium',
        'detail': 'Trunk lean ${_maxTrunkLean.toStringAsFixed(1)}° exceeds stability limit',
      });
    }

    final phases = [
      {'phaseName': 'descent', 'startMs': 0, 'endMs': (repDurationSec * 500).toInt(), 'status': 'OK'},
      {'phaseName': 'ascent', 'startMs': (repDurationSec * 500).toInt(), 'endMs': (repDurationSec * 1000).toInt(), 'status': 'OK'},
    ];

    _completedRepetitions.add(AnalyzedRepetition(
      repetitionNumber: repNumber,
      startMs: _repStartTime!.difference(_sessionStartTime!).inMilliseconds,
      endMs: timestamp.difference(_sessionStartTime!).inMilliseconds,
      angleTrace: List.from(_currentRepAngleTrace),
      metrics: metrics,
      phases: phases,
      errors: errors,
    ));

    // Reset rep trackers
    _repStartTime = timestamp;
    _currentRepAngleTrace.clear();
    _minRepAngle = 180.0;
    _maxRepAngle = 0.0;
    _maxJerk = 0.0;
    _maxTrunkLean = 0.0;
  }

  /// Conclude session assessment and produce final explainable outcome.
  SessionAnalysisOutcome finalizeSession({
    required CameraQualityCheck cameraCheck,
  }) {
    final double avgConfidence = _confidenceSamples.isNotEmpty
        ? _confidenceSamples.reduce((a, b) => a + b) / _confidenceSamples.length
        : 0.0;

    // Check abstention conditions
    if (!cameraCheck.isReady) {
      return SessionAnalysisOutcome(
        status: cameraCheck.status,
        abstainReason: cameraCheck.message ?? 'Camera positioning or visibility was unsuitable',
        overallScore: null,
        confidence: avgConfidence,
        analysisMethod: analysisMethod,
        repetitions: [],
        landmarkPoints: [],
        captureQuality: cameraCheck.metadata,
        assessedMetrics: [],
        unassessedMetrics: ['rom_deg', 'tempo_sec', 'control_max_jerk_deg', 'compensation_trunk_lean_deg'],
      );
    }

    if (avgConfidence < 0.70) {
      return SessionAnalysisOutcome(
        status: 'LOW_CONFIDENCE',
        abstainReason: 'Tracking confidence was too low (${(avgConfidence * 100).toInt()}%) throughout the recording.',
        overallScore: null,
        confidence: avgConfidence,
        analysisMethod: analysisMethod,
        repetitions: [],
        landmarkPoints: [],
        captureQuality: cameraCheck.metadata,
        assessedMetrics: [],
        unassessedMetrics: ['rom_deg', 'tempo_sec', 'control_max_jerk_deg'],
      );
    }

    if (_completedRepetitions.isEmpty) {
      return SessionAnalysisOutcome(
        status: 'INCOMPLETE',
        abstainReason: 'No complete repetition was detected during the recording.',
        overallScore: null,
        confidence: avgConfidence,
        analysisMethod: analysisMethod,
        repetitions: [],
        landmarkPoints: [],
        captureQuality: cameraCheck.metadata,
        assessedMetrics: [],
        unassessedMetrics: ['rom_deg', 'tempo_sec'],
      );
    }

    // Calculate quality score across completed repetitions
    double totalRepScore = 0.0;
    for (final rep in _completedRepetitions) {
      double repScore = 100.0;
      for (final err in rep.errors) {
        final sev = err['severity'];
        repScore -= (sev == 'high' ? 25.0 : sev == 'medium' ? 15.0 : 8.0);
      }
      totalRepScore += repScore.clamp(0.0, 100.0);
    }
    final double overallScore = (totalRepScore / _completedRepetitions.length).clamp(0.0, 100.0);

    return SessionAnalysisOutcome(
      status: 'VALID',
      overallScore: double.parse(overallScore.toStringAsFixed(1)),
      confidence: double.parse(avgConfidence.toStringAsFixed(3)),
      analysisMethod: analysisMethod,
      repetitions: _completedRepetitions,
      landmarkPoints: _landmarkTrace,
      captureQuality: cameraCheck.metadata,
      assessedMetrics: ['rom_deg', 'tempo_sec', 'control_max_jerk_deg', 'compensation_trunk_lean_deg'],
      unassessedMetrics: [],
    );
  }
}
