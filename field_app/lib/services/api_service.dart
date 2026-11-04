import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class ApiService {
  final http.Client client;

  ApiService({http.Client? client}) : client = client ?? http.Client();

  Future<Map<String, String>> _buildAuthHeaders({bool includeJsonContentType = true}) async {
    final prefs = await SharedPreferences.getInstance();
    final headers = <String, String>{};
    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    final userId = prefs.getString(AuthService.keyUserId);
    final userName = prefs.getString(AuthService.keyUserName);
    final userEmail = prefs.getString(AuthService.keyUserEmail);
    final userRole = prefs.getString(AuthService.keyUserRole);

    if (userId != null && userId.isNotEmpty) headers['x-user-id'] = userId;
    if (userName != null && userName.isNotEmpty) headers['x-user-name'] = userName;
    if (userEmail != null && userEmail.isNotEmpty) headers['x-user-email'] = userEmail;
    if (userRole != null && userRole.isNotEmpty) headers['x-user-role'] = userRole;

    return headers;
  }

  /// GET JSON data from API endpoint with user context headers
  Future<http.Response> getData(String path) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$path');
    final headers = await _buildAuthHeaders(includeJsonContentType: true);
    return await client
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: AppConfig.syncTimeoutSeconds));
  }

  /// Post JSON payload to API endpoint with user context headers
  Future<http.Response> postData(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$path');
    final headers = await _buildAuthHeaders(includeJsonContentType: true);

    return await client
        .post(
          uri,
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: AppConfig.syncTimeoutSeconds));
  }

  /// Upload file (e.g. Bank passbook photo or Loaded Truck photo) to /api/upload
  Future<String?> uploadPhoto(File imageFile) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}${AppConfig.uploadEndpoint}');
      final request = http.MultipartRequest('POST', uri);
      final authHeaders = await _buildAuthHeaders(includeJsonContentType: false);
      request.headers.addAll(authHeaders);
      request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['url'] as String?;
      }
    } catch (e) {
      debugPrint('Photo upload error: $e');
    }
    return null;
  }
}
