// session_feedback_screen.dart
//
// Patient Session Feedback Form (Section 4E).
// Records pain (0-10), discomfort (0-10), perceived difficulty (1-10),
// and optional injury-related notes.
// Syncs session measurements and feedback directly to the backend.

import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../rehab/movement_analyzer.dart';
import '../services/api_service.dart';

class SessionFeedbackScreen extends StatefulWidget {
  final Map<String, dynamic> exercise;
  final int programExerciseId;
  final SessionAnalysisOutcome outcome;
  final VoidCallback onCompleted;

  const SessionFeedbackScreen({
    Key? key,
    required this.exercise,
    required this.programExerciseId,
    required this.outcome,
    required this.onCompleted,
  }) : super(key: key);

  @override
  State<SessionFeedbackScreen> createState() => _SessionFeedbackScreenState();
}

class _SessionFeedbackScreenState extends State<SessionFeedbackScreen> {
  double _pain = 2.0;
  double _discomfort = 1.0;
  double _difficulty = 4.0;
  final _injuryNoteController = TextEditingController();

  bool _isSyncing = false;
  String? _syncError;

  Future<void> _submitSession() async {
    setState(() {
      _isSyncing = true;
      _syncError = null;
    });

    try {
      final uuid = const Uuid().v4();
      final now = DateTime.now().toUtc().toIso8601String();

      final payload = {
        'clientSessionUuid': uuid,
        'programExerciseId': widget.programExerciseId,
        'sessionDate': now,
        'durationSec': 180,
        'status': widget.outcome.status,
        'abstainReason': widget.outcome.abstainReason,
        'confidence': widget.outcome.confidence,
        'setsCompleted': widget.exercise['sets'] ?? 3,
        'repsCompleted': widget.outcome.repetitions.length,
        'pain': _pain.toInt(),
        'discomfort': _discomfort.toInt(),
        'difficulty': _difficulty.toInt(),
        'injuryNote': _injuryNoteController.text.trim().isEmpty ? null : _injuryNoteController.text.trim(),
        'overallScore': widget.outcome.overallScore,
        'analysisMethod': widget.outcome.analysisMethod,
        'captureQuality': widget.outcome.captureQuality,
        'assessedMetrics': widget.outcome.assessedMetrics,
        'unassessedMetrics': widget.outcome.unassessedMetrics,
        'repetitions': widget.outcome.repetitions.map((r) => r.toJson()).toList(),
        'landmarkPoints': widget.outcome.landmarkPoints,
      };

      await ApiService.uploadSession(payload);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Session successfully uploaded and recorded!'),
          backgroundColor: Color(0xFF0F766E),
        ),
      );

      widget.onCompleted();
      Navigator.of(context).pop();
    } catch (e) {
      setState(() {
        _syncError = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final outcome = widget.outcome;
    final isAssessed = outcome.status == 'VALID' || outcome.status == 'PARTIAL';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Session Feedback & Review', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0.5,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Movement Quality Summary Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.exercise['name'] ?? 'Exercise',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isAssessed ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isAssessed ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A)),
                      ),
                      child: Text(
                        outcome.status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isAssessed ? const Color(0xFF166534) : const Color(0xFF92400E),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (isAssessed) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          const Text('Quality Score', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          const SizedBox(height: 2),
                          Text(
                            '${outcome.overallScore?.toInt() ?? 0}/100',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          const Text('Reps Analyzed', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          const SizedBox(height: 2),
                          Text(
                            '${outcome.repetitions.length}',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          const Text('Confidence', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          const SizedBox(height: 2),
                          Text(
                            '${(outcome.confidence * 100).toInt()}%',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0284C7)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Text(
                      'Session Abstained: ${outcome.abstainReason ?? 'Insufficient confidence'}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Error Banner if sync failed
          if (_syncError != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Text(_syncError!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
            ),
            const SizedBox(height: 16),
          ],

          // Patient Response Sliders
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Patient-Reported Response',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Record how you felt during the movements. Your physiotherapist uses this to calibrate progression.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 16),

                // Pain Slider (0 - 10)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Pain Rating (0: None, 10: Severe)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    Text('${_pain.toInt()} / 10', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFDC2626))),
                  ],
                ),
                Slider(
                  value: _pain,
                  min: 0,
                  max: 10,
                  divisions: 10,
                  activeColor: const Color(0xFFDC2626),
                  onChanged: (v) => setState(() => _pain = v),
                ),
                const SizedBox(height: 8),

                // Discomfort Slider (0 - 10)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Discomfort Level (0 - 10)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    Text('${_discomfort.toInt()} / 10', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFEA580C))),
                  ],
                ),
                Slider(
                  value: _discomfort,
                  min: 0,
                  max: 10,
                  divisions: 10,
                  activeColor: const Color(0xFFEA580C),
                  onChanged: (v) => setState(() => _discomfort = v),
                ),
                const SizedBox(height: 8),

                // Difficulty Slider (1 - 10)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Perceived Difficulty (1: Very Easy, 10: Exhausting)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    Text('${_difficulty.toInt()} / 10', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                  ],
                ),
                Slider(
                  value: _difficulty,
                  min: 1,
                  max: 10,
                  divisions: 9,
                  activeColor: const Color(0xFF0F766E),
                  onChanged: (v) => setState(() => _difficulty = v),
                ),
                const SizedBox(height: 16),

                // Optional Injury / Symptom Note
                const Text('Optional Symptom Note for Physiotherapist', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextField(
                  controller: _injuryNoteController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'e.g. Mild clicking in the right knee on the 3rd repetition',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit Action
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _isSyncing ? null : _submitSession,
              icon: _isSyncing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.cloud_upload_outlined),
              label: Text(
                _isSyncing ? 'Submitting to Clinical Server...' : 'Submit Session to Physiotherapist',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F766E),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
