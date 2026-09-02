import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class AuthResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? userData;

  AuthResult({
    required this.success,
    required this.message,
    this.userData,
  });
}

class AuthService {
  static const String keyIsLoggedIn = 'app_is_logged_in';
  static const String keyUserId = 'app_user_id';
  static const String keyUserName = 'app_user_name';
  static const String keyUserEmail = 'app_user_email';
  static const String keyUserRole = 'app_user_role';
  static const String keyAssignedProvinces = 'app_assigned_provinces';
  static const String keyCachedEmail = 'app_cached_email';
  static const String keyCachedPassword = 'app_cached_password';
  static const String keyCachedUserData = 'app_cached_user_data';

  /// Authenticate credentials against central Next.js server with offline fallback
  Future<AuthResult> login(String usernameOrEmail, String password) async {
    final cleanEmail = usernameOrEmail.trim();
    final cleanPassword = password.trim();

    if (cleanEmail.isEmpty || cleanPassword.isEmpty) {
      return AuthResult(success: false, message: 'Please enter both username/email and password.');
    }

    final prefs = await SharedPreferences.getInstance();

    try {
      final uri = Uri.parse('${AppConfig.baseUrl}/api/auth/mobile-login');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': cleanEmail,
              'password': cleanPassword,
            }),
          )
          .timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final user = data['user'] as Map<String, dynamic>;

        // Save active session locally
        await prefs.setBool(keyIsLoggedIn, true);
        await prefs.setString(keyUserId, user['id']?.toString() ?? '');
        await prefs.setString(keyUserName, user['name']?.toString() ?? '');
        await prefs.setString(keyUserEmail, user['email']?.toString() ?? '');
        await prefs.setString(keyUserRole, user['role']?.toString() ?? '');
        await prefs.setString(keyAssignedProvinces, user['assignedProvinces']?.toString() ?? '');

        // Cache credentials and user payload for offline re-authentication
        await prefs.setString(keyCachedEmail, cleanEmail.toLowerCase());
        await prefs.setString(keyCachedPassword, cleanPassword);
        await prefs.setString(keyCachedUserData, jsonEncode(user));

        return AuthResult(
          success: true,
          message: 'Login successful!',
          userData: user,
        );
      } else {
        final errorMsg = data['error'] ?? 'Authentication failed. Please check credentials.';
        return AuthResult(success: false, message: errorMsg);
      }
    } catch (e) {
      // Server unreachable (offline mode) — check cached credentials
      final cachedEmail = prefs.getString(keyCachedEmail);
      final cachedPassword = prefs.getString(keyCachedPassword);
      final cachedUserJson = prefs.getString(keyCachedUserData);

      if (cachedEmail != null &&
          cachedPassword != null &&
          cachedUserJson != null &&
          (cachedEmail == cleanEmail.toLowerCase() || cachedEmail == cleanEmail) &&
          cachedPassword == cleanPassword) {
        final user = jsonDecode(cachedUserJson) as Map<String, dynamic>;

        // Set session state for offline mode
        await prefs.setBool(keyIsLoggedIn, true);
        await prefs.setString(keyUserId, user['id']?.toString() ?? '');
        await prefs.setString(keyUserName, user['name']?.toString() ?? '');
        await prefs.setString(keyUserEmail, user['email']?.toString() ?? '');
        await prefs.setString(keyUserRole, user['role']?.toString() ?? '');
        await prefs.setString(keyAssignedProvinces, user['assignedProvinces']?.toString() ?? '');

        return AuthResult(
          success: true,
          message: '⚡ Offline Mode: Authenticated using saved credentials.',
          userData: user,
        );
      }

      return AuthResult(
        success: false,
        message: 'Cannot reach server at ${AppConfig.baseUrl}.\nFirst-time login requires an active server connection.',
      );
    }
  }

  /// Check if an active session exists
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(keyIsLoggedIn) ?? false;
  }

  /// Retrieve current user info
  static Future<Map<String, String>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString(keyUserId) ?? '',
      'name': prefs.getString(keyUserName) ?? 'Field Inspector',
      'email': prefs.getString(keyUserEmail) ?? '',
      'role': prefs.getString(keyUserRole) ?? 'FIELD',
      'assignedProvinces': prefs.getString(keyAssignedProvinces) ?? '',
    };
  }

  /// Get list of assigned provinces for the current user
  static Future<List<String>> getAssignedProvinceList() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(keyAssignedProvinces) ?? '';
    if (raw.trim().isEmpty) return [];
    return raw.split(',').map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
  }

  /// Log out current user session while preserving cached offline credentials
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyIsLoggedIn, false);
    await prefs.remove(keyUserId);
    await prefs.remove(keyUserName);
    await prefs.remove(keyUserEmail);
    await prefs.remove(keyUserRole);
    await prefs.remove(keyAssignedProvinces);
    // Note: Cached email & password are kept so the user can log back in offline!
  }
}
