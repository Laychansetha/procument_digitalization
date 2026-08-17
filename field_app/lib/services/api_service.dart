import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import 'auth_service.dart';

class ApiService {
  final http.Client client;

  ApiService({http.Client? client}) : client = client ?? http.Client();

  /// Post JSON payload to API endpoint with user context headers
  Future<http.Response> postData(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$path');
    final prefs = await SharedPreferences.getInstance();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    final userId = prefs.getString(AuthService.keyUserId);
    final userName = prefs.getString(AuthService.keyUserName);
    final userEmail = prefs.getString(AuthService.keyUserEmail);
    final userRole = prefs.getString(AuthService.keyUserRole);

    if (userId != null && userId.isNotEmpty) headers['x-user-id'] = userId;
    if (userName != null && userName.isNotEmpty) headers['x-user-name'] = userName;
    if (userEmail != null && userEmail.isNotEmpty) headers['x-user-email'] = userEmail;
    if (userRole != null && userRole.isNotEmpty) headers['x-user-role'] = userRole;

    return await client.post(
      uri,
      headers: headers,
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: AppConfig.syncTimeoutSeconds));
  }

  /// Upload file (e.g. Bank passbook photo) to /api/upload
  Future<String?> uploadPhoto(File imageFile) async {
    try {
      final uri = Uri.parse('${AppConfig.baseUrl}${AppConfig.uploadEndpoint}');
      final request = http.MultipartRequest('POST', uri);
      request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['url'] as String?;
      }
    } catch (e) {
      print('Photo upload error: $e');
    }
    return null;
  }
}
