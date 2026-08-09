import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ConfigDao {
  static final ConfigDao instance = ConfigDao._init();
  ConfigDao._init();

  static const String _kCachedConfigKey = 'cached_master_config_v1';

  double _seedInterestRate = 1.10;
  double _scaleTolerancePercent = 1.5;

  List<String> _villages = [
    'Prey Veng', 'Sambou', 'Koh Ker', 'Damnak Kantout', 'Dan', 'Pongro', 'Kampenh', 'Yeang', 'Kong Yoang', 'Tmat Paeuy', 'Krala Peas', 'Dang Phlet', 'Narong', 'Bra', 'Soung', 'Kham Keut', 'Kampong Sangkae',
    'Doung', 'Kes', 'Kang Cham', 'Kang Kngaok', 'Khes Kroam', 'Khes Svay', 'Pong Kriel', 'Kham Phouk', 'Phum Lun', 'Ban Moung', 'Samor', 'Chantu', 'Keng Nhai', 'Siem Pang', 'Dan Loung', 'Peam Khes', 'Srae Russei', 'Kanchanh Kouk', 'Teteam', "O'Chay", 'Nhang Sum', 'La Kay', 'Pha Bang',
    'I-Tub', 'Bak Kae', 'Korng Nork', 'Kalan', 'Srae Pokthom', 'Thmey', 'Srae Chhuk', 'Srae Poktoch', 'Srae Chrey', 'Roveak',
    'Pu Char', 'Pu Kung', 'Ou Chra', 'Andoung Kraloeng', 'Srae Lvi', 'Gati', 'Pu Trom', 'Chokchar', 'Sre Andaol', 'Kmoum', 'Ktung'
  ];
  List<String> _banks = ['ABA Bank', 'ACLEDA Bank', 'Wing Bank', 'Canadia Bank', 'Sathapana Bank', 'AMK Microfinance', 'PRASAC Microfinance', 'Hattha Bank'];
  List<String> _paddyCategories = [
    'Phka Rumduol',
    'Red Jasmine',
    'Foundation Seed - Phka Rumduol',
    'Foundation Seed - Red Jasmine',
    'Certified Seed',
    'White Rice'
  ];
  List<String> _grades = ['A1', 'A2', 'B1', 'B2', 'A', 'B'];

  List<Map<String, dynamic>> _paddySpecs = [
    {'variety': 'Phka Rumduol', 'grade': 'A1', 'basePrice': 1650.0},
    {'variety': 'Phka Rumduol', 'grade': 'A2', 'basePrice': 1550.0},
    {'variety': 'Phka Rumduol', 'grade': 'B1', 'basePrice': 1500.0},
    {'variety': 'Phka Rumduol', 'grade': 'B2', 'basePrice': 1450.0},
    {'variety': 'Red Jasmine', 'grade': 'A1', 'basePrice': 1850.0},
    {'variety': 'Red Jasmine', 'grade': 'A2', 'basePrice': 1750.0},
    {'variety': 'Red Jasmine', 'grade': 'B1', 'basePrice': 1700.0},
    {'variety': 'Red Jasmine', 'grade': 'B2', 'basePrice': 1650.0},
    {'variety': 'Foundation Seed - Phka Rumduol', 'grade': 'A', 'basePrice': 2050.0},
    {'variety': 'Foundation Seed - Red Jasmine', 'grade': 'A', 'basePrice': 2150.0},
    {'variety': 'Certified Seed', 'grade': 'A', 'basePrice': 1900.0},
    {'variety': 'White Rice', 'grade': 'A', 'basePrice': 1320.0},
    {'variety': 'White Rice', 'grade': 'B', 'basePrice': 1220.0},
  ];

  List<String> _buyingStations = [
    'Preah Vihear',
    'Stung Treng',
    'Ratanakiri',
    'Mondulkiri'
  ];

  List<String> _destinationWarehouses = [
    'CACC (KPT)',
    'Amru Nature (KPG)',
    'Other'
  ];

  Map<String, double> _basePrices = {
    'Phka Rumduol': 1650.0,
    'Red Jasmine': 1850.0,
    'Foundation Seed - Phka Rumduol': 2050.0,
    'Foundation Seed - Red Jasmine': 2150.0,
    'Certified Seed': 1900.0,
    'White Rice': 1320.0,
  };

  double get seedInterestRate => _seedInterestRate;
  double get scaleTolerancePercent => _scaleTolerancePercent;
  List<String> get villages => List.unmodifiable(_villages);
  List<String> get banks => List.unmodifiable(_banks);
  List<String> get paddyCategories => List.unmodifiable(_paddyCategories);
  List<String> get grades => List.unmodifiable(_grades);
  List<Map<String, dynamic>> get paddySpecs => List.unmodifiable(_paddySpecs);
  List<String> get buyingStations => List.unmodifiable(_buyingStations);
  List<String> get destinationWarehouses => List.unmodifiable(_destinationWarehouses);

  double getBasePrice(String category) {
    return _basePrices[category] ?? 1650.0;
  }

  /// Initialize configuration from local cache first, then fetch remote server updates if online
  Future<void> initAndAutoRefresh() async {
    await loadLocalConfig();
    await fetchRemoteConfig();
  }

  /// Load cached configuration from SharedPreferences when offline
  Future<void> loadLocalConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString(_kCachedConfigKey);
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final data = jsonDecode(cachedJson);
        _applyConfigData(data);
        debugPrint('📦 Master Configuration loaded from local cache.');
      }
    } catch (e) {
      debugPrint('⚠️ Error loading local config cache: $e');
    }
  }

  /// Automatically check server for master configuration updates on startup
  Future<void> fetchRemoteConfig() async {
    try {
      final response = await http.get(Uri.parse('${AppConfig.baseUrl}/api/config')).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _applyConfigData(data);

        // Save downloaded master configuration to local cache for offline availability
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_kCachedConfigKey, response.body);

        debugPrint('✅ Master Configuration automatically updated from server.');
      }
    } catch (e) {
      debugPrint('⚠️ Offline fallback: continuing with existing cached master configuration. ($e)');
    }
  }

  void _applyConfigData(Map<String, dynamic> data) {
    if (data['settings'] != null) {
      final s = data['settings'];
      if (s['seedInterestRate'] != null) {
        _seedInterestRate = (s['seedInterestRate'] as num).toDouble();
      }
      if (s['scaleTolerancePercent'] != null) {
        _scaleTolerancePercent = (s['scaleTolerancePercent'] as num).toDouble();
      }
    }

    if (data['villages'] != null && data['villages'] is List && (data['villages'] as List).isNotEmpty) {
      _villages = (data['villages'] as List).map((e) => e.toString()).toList();
    }

    if (data['banks'] != null && data['banks'] is List && (data['banks'] as List).isNotEmpty) {
      _banks = (data['banks'] as List).map((e) => e.toString()).toList();
    }

    if (data['paddySpecs'] != null && data['paddySpecs'] is List && (data['paddySpecs'] as List).isNotEmpty) {
      _paddySpecs = (data['paddySpecs'] as List).map((e) => Map<String, dynamic>.from(e)).toList();

      // Extract unique paddy categories and prices
      final categories = <String>{};
      final gradesList = <String>{};
      for (var spec in _paddySpecs) {
        if (spec['variety'] != null) {
          categories.add(spec['variety'].toString());
          if (spec['basePrice'] != null) {
            _basePrices[spec['variety'].toString()] = (spec['basePrice'] as num).toDouble();
          }
        }
        if (spec['grade'] != null) {
          gradesList.add(spec['grade'].toString());
        }
      }

      if (categories.isNotEmpty) _paddyCategories = categories.toList();
      if (gradesList.isNotEmpty) _grades = gradesList.toList();
    }

    if (data['locations'] != null && data['locations'] is List) {
      final stations = <String>[];
      final warehouses = <String>[];

      for (var loc in data['locations']) {
        final name = loc['name']?.toString();
        final type = loc['type']?.toString();
        if (name != null) {
          if (type == 'BUYING_STATION') {
            stations.add(name);
          } else if (type == 'WAREHOUSE') {
            warehouses.add(name);
          }
        }
      }

      if (stations.isNotEmpty) _buyingStations = stations;
      if (warehouses.isNotEmpty) _destinationWarehouses = warehouses;
    }

    if (data['warehouses'] != null && data['warehouses'] is List && (data['warehouses'] as List).isNotEmpty) {
      _destinationWarehouses = (data['warehouses'] as List).map((e) => e.toString()).toList();
    }
  }
}
