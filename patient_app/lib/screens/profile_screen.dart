// profile_screen.dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const ProfileScreen({Key? key, required this.onLogout}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData;
  bool _loading = true;
  bool _consent = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final user = await ApiService.getMe();
      setState(() {
        _userData = user;
        _consent = user['profile']?['videoUploadConsent'] ?? false;
      });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _toggleConsent(bool val) async {
    setState(() => _consent = val);
    try {
      await ApiService.updateConsent(val);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(val ? 'Consent recorded: Raw video upload enabled' : 'Consent withdrawn: Raw video upload disabled'),
          backgroundColor: const Color(0xFF0F766E),
        ),
      );
    } catch (_) {
      setState(() => _consent = !val);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final user = _userData?['user'];
    final profile = _userData?['profile'];
    final clinician = _userData?['clinician'];

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        // Profile Info Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFF0F766E).withOpacity(0.1),
                child: Text(
                  user?['name']?.substring(0, 1) ?? 'P',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                ),
              ),
              const SizedBox(height: 10),
              Text(user?['name'] ?? 'Patient', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text(user?['email'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Text('Age', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('${profile?['age'] ?? '—'} yrs', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    children: [
                      const Text('Sex', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('${profile?['sex'] ?? '—'}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Column(
                    children: [
                      const Text('Height', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                      Text('${profile?['heightCm'] ?? '—'} cm', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Treating Clinician
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              const Icon(Icons.medical_services_outlined, color: Color(0xFF0F766E), size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Treating Physiotherapist', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                    Text(
                      clinician != null ? clinician['name'] : 'No physiotherapist assigned',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Data Privacy & Video Upload Consent Card (Section 9)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.privacy_tip_outlined, color: Color(0xFF0F766E), size: 20),
                  SizedBox(width: 8),
                  Text('Data Privacy & Consent Defaults', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'By default, all camera frames are processed privately on your device. Only numeric derived landmarks and angles are uploaded to your physiotherapist. Raw video is never stored unless you explicitly opt in.',
                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Consent to Upload Raw Session Video', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: const Text('Permits encrypted video storage for your physiotherapist to review.', style: TextStyle(fontSize: 11)),
                value: _consent,
                activeColor: const Color(0xFF0F766E),
                onChanged: _toggleConsent,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Logout
        SizedBox(
          width: double.infinity,
          height: 44,
          child: OutlinedButton.icon(
            onPressed: () async {
              await ApiService.clearToken();
              widget.onLogout();
            },
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Sign Out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFFECACA)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ),
      ],
    );
  }
}
