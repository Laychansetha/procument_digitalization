import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ConfigDao {
  static final ConfigDao instance = ConfigDao._init();
  ConfigDao._init();

  static const String _kCachedConfigKey = 'cached_master_config_v1';
  static const String _kLastSyncedAtKey = 'cached_config_last_synced_at';

  double _seedInterestRate = 1.10;
  double _scaleTolerancePercent = 1.5;
  String? _lastSyncedAt;
  List<Map<String, dynamic>> _fleet = [];

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
    'W002 - CACC (KPT)',
    'W003 - Amru Nature (KPG)',
    'W004 - Koh Nhek',
    'W005 - Other'
  ];

  final Map<String, double> _basePrices = {
    'Phka Rumduol': 1650.0,
    'Red Jasmine': 1850.0,
    'Foundation Seed - Phka Rumduol': 2050.0,
    'Foundation Seed - Red Jasmine': 2150.0,
    'Certified Seed': 1900.0,
    'White Rice': 1320.0,
  };

  static final Map<String, String> _villageProvinceMapping = {
    'Prey Veng': 'Preah Vihear', 'Sambou': 'Preah Vihear', 'Koh Ker': 'Preah Vihear', 'Damnak Kantout': 'Preah Vihear',
    'Dan': 'Preah Vihear', 'Pongro': 'Preah Vihear', 'Kampenh': 'Preah Vihear', 'Yeang': 'Preah Vihear',
    'Kong Yoang': 'Preah Vihear', 'Tmat Paeuy': 'Preah Vihear', 'Krala Peas': 'Preah Vihear', 'Dang Phlet': 'Preah Vihear',
    'Narong': 'Preah Vihear', 'Bra': 'Preah Vihear', 'Soung': 'Preah Vihear', 'Kham Keut': 'Preah Vihear', 'Kampong Sangkae': 'Preah Vihear',
    'Doung': 'Stung Treng', 'Kes': 'Stung Treng', 'Kang Cham': 'Stung Treng', 'Kang Kngaok': 'Stung Treng',
    'Khes Kroam': 'Stung Treng', 'Khes Svay': 'Stung Treng', 'Pong Kriel': 'Stung Treng', 'Kham Phouk': 'Stung Treng',
    'Phum Lun': 'Stung Treng', 'Ban Moung': 'Stung Treng', 'Samor': 'Stung Treng', 'Chantu': 'Stung Treng',
    'Keng Nhai': 'Stung Treng', 'Siem Pang': 'Stung Treng', 'Dan Loung': 'Stung Treng', 'Peam Khes': 'Stung Treng',
    'Srae Russei': 'Stung Treng', 'Kanchanh Kouk': 'Stung Treng', 'Teteam': 'Stung Treng', "O'Chay": 'Stung Treng',
    'Nhang Sum': 'Stung Treng', 'La Kay': 'Stung Treng', 'Pha Bang': 'Stung Treng',
    'I-Tub': 'Ratanakiri', 'Korng Nork': 'Ratanakiri', 'Kalan': 'Ratanakiri', 'Srae Pokthom': 'Ratanakiri',
    'Thmey': 'Ratanakiri', 'Srae Chhuk': 'Ratanakiri', 'Srae Poktoch': 'Ratanakiri', 'Srae Chrey': 'Ratanakiri',
    'Roveak': 'Ratanakiri', 'Bak Kae': 'Ratanakiri',
    'Pu Char': 'Mondulkiri', 'Pu Kung': 'Mondulkiri', 'Ou Chra': 'Mondulkiri', 'Andoung Kraloeng': 'Mondulkiri',
    'Srae Lvi': 'Mondulkiri', 'Gati': 'Mondulkiri', 'Pu Trom': 'Mondulkiri', 'Chokchar': 'Mondulkiri',
    'Sre Andaol': 'Mondulkiri', 'Kmoum': 'Mondulkiri', 'Ktung': 'Mondulkiri',
  };

  double get seedInterestRate => _seedInterestRate;
  double get scaleTolerancePercent => _scaleTolerancePercent;
  String? get lastSyncedAt => _lastSyncedAt;
  List<Map<String, dynamic>> get fleet => List.unmodifiable(_fleet);
  List<String> get villages => List.unmodifiable(_villages);

  List<String> getVillagesForProvinces(List<String> assignedProvinces) {
    final cleanProvinces = assignedProvinces
        .map((p) {
          final lower = p.toLowerCase().trim();
          return lower == 'mondolkiri' ? 'mondulkiri' : lower;
        })
        .where((p) => p.isNotEmpty)
        .toList();

    if (cleanProvinces.isEmpty || cleanProvinces.length >= 4 || cleanProvinces.contains('all') || cleanProvinces.contains('na')) {
      return List.unmodifiable(_villages);
    }

    final filtered = _villages.where((v) {
      final rawProv = _villageProvinceMapping[v]?.toLowerCase().trim();
      final prov = rawProv == 'mondolkiri' ? 'mondulkiri' : rawProv;
      return prov != null && cleanProvinces.contains(prov);
    }).toList();

    if (filtered.isEmpty) {
      return List.unmodifiable(_villages);
    }
    return List.unmodifiable(filtered);
  }
  List<String> get banks => List.unmodifiable(_banks);
  List<String> get paddyCategories => List.unmodifiable(_paddyCategories);
  List<String> get grades => List.unmodifiable(_grades);

  List<String> getGradesForCategory(String? category) {
    if (category == null || category.isEmpty) return List.unmodifiable(_grades);
    
    // Dynamic lookup from synced paddySpecs master data
    final matchingSpecs = _paddySpecs.where((s) => s['variety'] == category).toList();
    if (matchingSpecs.isNotEmpty) {
      final specGrades = matchingSpecs.map((s) => s['grade'].toString()).toSet().toList();
      return List.unmodifiable(specGrades);
    }
    
    // Fallback business rules
    if (category == 'Phka Rumduol' || category == 'Red Jasmine') {
      return const ['A1', 'A2', 'B1', 'B2'];
    } else if (category.contains('Foundation Seed') || category == 'Certified Seed') {
      return const ['A'];
    } else if (category == 'White Rice') {
      return const ['A', 'B'];
    }
    return List.unmodifiable(_grades);
  }

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
      _lastSyncedAt = prefs.getString(_kLastSyncedAtKey);
      final cachedJson = prefs.getString(_kCachedConfigKey);
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final data = jsonDecode(cachedJson);
        _applyConfigData(data);
        debugPrint('📦 Master Configuration loaded from local cache (Last Synced: $_lastSyncedAt).');
      }
    } catch (e) {
      debugPrint('⚠️ Error loading local config cache: $e');
    }
  }

  /// Automatically check server for master configuration updates on startup
  Future<void> fetchRemoteConfig() async {
    try {
      final cacheBusterUrl = '${AppConfig.baseUrl}/api/config?t=${DateTime.now().millisecondsSinceEpoch}';
      debugPrint('🔄 Fetching remote master config from: $cacheBusterUrl');
      final response = await http.get(Uri.parse(cacheBusterUrl)).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _applyConfigData(data);

        final nowIso = DateTime.now().toIso8601String();
        _lastSyncedAt = nowIso;

        // Save downloaded master configuration to local cache for offline availability
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_kCachedConfigKey, response.body);
        await prefs.setString(_kLastSyncedAtKey, nowIso);

        debugPrint('✅ Master Configuration updated from server at $nowIso. Banks: $_banks');
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

    // Dynamic village-to-province mapping update from server rawVillages / allVillages
    final rawVList = data['rawVillages'] ?? data['allVillages'];
    if (rawVList != null && rawVList is List) {
      for (var item in rawVList) {
        if (item is Map) {
          final vName = item['name']?.toString();
          final vProv = item['province']?.toString();
          if (vName != null && vProv != null && vName.isNotEmpty && vProv.isNotEmpty) {
            _villageProvinceMapping[vName] = vProv;
          }
        }
      }
    }

    // Dynamic commercial bank list update from server rawBanks or banks
    if (data['rawBanks'] != null && data['rawBanks'] is List && (data['rawBanks'] as List).isNotEmpty) {
      final bankNames = <String>[];
      for (var item in data['rawBanks']) {
        if (item is Map && item['name'] != null && item['name'].toString().trim().isNotEmpty) {
          bankNames.add(item['name'].toString().trim());
        } else if (item is String && item.trim().isNotEmpty) {
          bankNames.add(item.trim());
        }
      }
      if (bankNames.isNotEmpty) {
        _banks = bankNames;
      }
    } else if (data['banks'] != null && data['banks'] is List && (data['banks'] as List).isNotEmpty) {
      final bankNames = <String>[];
      for (var item in data['banks']) {
        if (item is Map && item['name'] != null) {
          bankNames.add(item['name'].toString().trim());
        } else if (item != null && item.toString().trim().isNotEmpty) {
          bankNames.add(item.toString().trim());
        }
      }
      if (bankNames.isNotEmpty) {
        _banks = bankNames;
      }
    }

    if (data['fleet'] != null && data['fleet'] is List) {
      _fleet = (data['fleet'] as List).map((e) => Map<String, dynamic>.from(e)).toList();
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
          if (type == 'BUYING_STATION' || type == 'STATION') {
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
