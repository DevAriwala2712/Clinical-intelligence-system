// progress_screen.dart
//
// Patient Progress & History Screen (Section 4F).
// Displays adherence, longitudinal trends, completed sessions, and physiotherapist feedback.

import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({Key? key}) : super(key: key);

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  Map<String, dynamic>? _progressData;
  List<dynamic> _sessions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProgress();
  }

  Future<void> _loadProgress() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final progress = await ApiService.getMyProgress();
      final sessions = await ApiService.getMySessions(limit: 30);
      setState(() {
        _progressData = progress;
        _sessions = sessions;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _loadProgress, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final adherence = _progressData?['adherence'];
    final exercises = (_progressData?['exercises'] as List<dynamic>?) ?? [];

    return RefreshIndicator(
      onRefresh: _loadProgress,
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // 14-Day Adherence Banner
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
                    const Text(
                      '14-Day Prescription Adherence',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDFA),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        adherence?['rate'] != null ? '${(adherence['rate'] * 100).toInt()}% Target' : 'Calibrating',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Completed ${adherence?['completedDays'] ?? 0} out of ${adherence?['expectedDays'] ?? 0} expected exercise days in the past 2 weeks.',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Longitudinal Progress per Exercise
          const Text(
            'Longitudinal Movement Trends',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          ...exercises.map((item) {
            final a = item['analysis'];
            if (a == null) return const SizedBox.shrink();
            final trend = a['trend'];

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(item['name'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: trend == 'IMPROVING'
                              ? const Color(0xFFF0FDF4)
                              : trend == 'DETERIORATING'
                              ? const Color(0xFFFEF2F2)
                              : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: trend == 'IMPROVING'
                                ? const Color(0xFFBBF7D0)
                                : trend == 'DETERIORATING'
                                ? const Color(0xFFFECACA)
                                : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Text(
                          trend ?? 'INSUFFICIENT DATA',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: trend == 'IMPROVING'
                                ? const Color(0xFF166534)
                                : trend == 'DETERIORATING'
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (a['explanation'] is List)
                    ...((a['explanation'] as List).map((l) => Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('• $l', style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
                    ))),
                ],
              ),
            );
          }).toList(),

          const SizedBox(height: 16),
          // Completed Sessions History
          const Text(
            'Completed Sessions & Physiotherapist Feedback',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          if (_sessions.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: Text('No completed sessions recorded yet.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ),
            )
          else
            ..._sessions.map((s) {
              final status = s['status'] ?? 'VALID';
              final isAssessed = status == 'VALID' || status == 'PARTIAL';
              final feedback = s['clinicianFeedback'];

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          s['exerciseName'] ?? 'Exercise',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        Text(
                          isAssessed && s['overallScore'] != null
                              ? '${(s['overallScore'] as num).toInt()} / 100'
                              : status,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isAssessed ? const Color(0xFF0F766E) : const Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${s['sessionDate'] != null ? s['sessionDate'].toString().substring(0, 10) : ''} • Pain: ${s['pain'] ?? '—'}/10 • Difficulty: ${s['difficulty'] ?? '—'}/10',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),

                    // Physiotherapist Feedback Bubble
                    if (feedback != null && feedback.toString().trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDFA),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF99F6E4)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.comment, size: 16, color: Color(0xFF0F766E)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Physiotherapist Feedback:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                                  const SizedBox(height: 2),
                                  Text(feedback.toString(), style: const TextStyle(fontSize: 12, color: Color(0xFF134E4A))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }
}
