// api_service.dart
//
// HTTP client communicating with the Express + MySQL backend API.
// Handles authentication token storage and session upload idempotency.

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator, localhost for desktop/web
  static String baseUrl = 'http://localhost:4000/api';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  static Map<String, String> _headers(String? token) {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(null),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Login failed (${res.statusCode})');
    }
    if (data['token'] != null) {
      await saveToken(data['token']);
    }
    return data;
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers(null),
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': 'patient',
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 201) {
      throw Exception(data['error'] ?? 'Registration failed (${res.statusCode})');
    }
    if (data['token'] != null) {
      await saveToken(data['token']);
    }
    return data;
  }

  static Future<Map<String, dynamic>> getMe() async {
    final token = await getToken();
    final res = await http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers(token));
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Failed to load user profile');
    }
    return data;
  }

  static Future<Map<String, dynamic>?> getActiveProgram() async {
    final token = await getToken();
    final res = await http.get(Uri.parse('$baseUrl/programs/active'), headers: _headers(token));
    if (res.statusCode == 404) return null;
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Failed to load assigned program');
    }
    return data;
  }

  static Future<List<dynamic>> getMySessions({int limit = 50}) async {
    final token = await getToken();
    final res = await http.get(Uri.parse('$baseUrl/sessions/mine?limit=$limit'), headers: _headers(token));
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Failed to load sessions');
    }
    return data as List<dynamic>;
  }

  static Future<Map<String, dynamic>> getMyProgress() async {
    final token = await getToken();
    final res = await http.get(Uri.parse('$baseUrl/progress/mine'), headers: _headers(token));
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Failed to load progress');
    }
    return data;
  }

  static Future<Map<String, dynamic>> uploadSession(Map<String, dynamic> sessionPayload) async {
    final token = await getToken();
    final res = await http.post(
      Uri.parse('$baseUrl/sessions'),
      headers: _headers(token),
      body: jsonEncode(sessionPayload),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(data['error'] ?? 'Session sync failed (${res.statusCode})');
    }
    return data;
  }

  static Future<void> updateProfile({String? rehabGoal, String? injuryHistory}) async {
    final token = await getToken();
    final res = await http.put(
      Uri.parse('$baseUrl/patients/me/profile'),
      headers: _headers(token),
      body: jsonEncode({
        if (rehabGoal != null) 'rehabGoal': rehabGoal,
        if (injuryHistory != null) 'injuryHistory': injuryHistory,
      }),
    );
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'Failed to update profile');
    }
  }

  static Future<void> updateConsent(bool videoUploadConsent) async {
    final token = await getToken();
    final res = await http.put(
      Uri.parse('$baseUrl/patients/me/consent'),
      headers: _headers(token),
      body: jsonEncode({'videoUploadConsent': videoUploadConsent}),
    );
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'Failed to update consent');
    }
  }
}
