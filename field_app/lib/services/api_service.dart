import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiService {
  final http.Client client;

  ApiService({http.Client? client}) : client = client ?? http.Client();

  /// Post JSON payload to API endpoint
  Future<http.Response> postData(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('${AppConfig.baseUrl}$path');
    return await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
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
