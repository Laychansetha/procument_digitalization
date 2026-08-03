import 'package:shared_preferences/shared_preferences.dart';

/// App Config for IBIS RICE Field Operations Mobile App
class AppConfig {
  static const String _keyBaseUrl = 'server_base_url';
  
  /// Default Server Base URL
  static String baseUrl = 'http://192.168.1.100:3000';

  /// Load persisted server URL from SharedPreferences
  static Future<void> loadBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString(_keyBaseUrl);
      if (savedUrl != null && savedUrl.isNotEmpty) {
        baseUrl = savedUrl;
      }
    } catch (e) {
      // Use default fallback if storage error
    }
  }

  /// Update and persist new server URL
  static Future<void> saveBaseUrl(String newUrl) async {
    String formatted = newUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'http://$formatted';
    }
    if (formatted.endsWith('/')) {
      formatted = formatted.substring(0, formatted.length - 1);
    }
    
    baseUrl = formatted;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyBaseUrl, formatted);
    } catch (e) {
      // Storage save error ignored
    }
  }

  // API Route Paths
  static const String specsEndpoint = '/api/specs';
  static const String farmersEndpoint = '/api/farmers';
  static const String purchasesEndpoint = '/api/purchases';
  static const String transportEndpoint = '/api/transport';
  static const String uploadEndpoint = '/api/upload';
  static const String priceSpecsEndpoint = '/api/admin/price-specs';
  static const String villagesEndpoint = '/api/admin/villages';
  static const String banksEndpoint = '/api/admin/banks';

  // Sync Settings
  static const int syncTimeoutSeconds = 15;
}
