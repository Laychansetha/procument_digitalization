import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ConfigDao {
  static final ConfigDao instance = ConfigDao._init();
  ConfigDao._init();

  static const String _kCachedConfigKey = 'cached_master_config_v2_2026';
  static const String _kLastSyncedAtKey = 'cached_config_last_synced_at';

  static const String pricingRegion1 = 'Preah Vihear and Mondolkiri';
  static const String pricingRegion2 = 'Stung Treng and Ratanakiri';

  final ValueNotifier<int> configChangeNotifier = ValueNotifier<int>(0);

  double _seedInterestRate = 1.10;
  double _scaleTolerancePercent = 1.5;
  String? _lastSyncedAt;
  String? _activePricingRegion;
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
    'Foundation Seed - Red Jasmine',
    'Foundation Seed - Phka Rumduol',
    'Certified Seed',
    'White Rice'
  ];
  List<String> _grades = ['A1', 'A2', 'B1', 'B2', 'A', 'B'];

  /// Official 2026 regional quality specs & prices (fallback for offline startup before first sync).
  /// Source of truth: villages_province_grade_warehouse.xlsx -> specs_price_2026.
  static List<Map<String, dynamic>> _buildDefault2026PaddySpecs() => [
        // Region 1: Preah Vihear and Mondolkiri
        {'region': pricingRegion1, 'variety': 'Phka Rumduol', 'grade': 'A1', 'basePrice': 1750.0, 'minWholeGrain': 75.0, 'maxBrokenRice': 25.0, 'impurity': 2.0, 'maxForeignMatter': 6.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Phka Rumduol', 'grade': 'A2', 'basePrice': 1650.0, 'minWholeGrain': 70.0, 'maxBrokenRice': 30.0, 'impurity': 4.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Phka Rumduol', 'grade': 'B1', 'basePrice': 1600.0, 'minWholeGrain': 60.0, 'maxBrokenRice': 40.0, 'impurity': 2.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Phka Rumduol', 'grade': 'B2', 'basePrice': 1550.0, 'minWholeGrain': 50.0, 'maxBrokenRice': 50.0, 'impurity': 4.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Red Jasmine', 'grade': 'A1', 'basePrice': 1990.0, 'minWholeGrain': 75.0, 'maxBrokenRice': 25.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Red Jasmine', 'grade': 'A2', 'basePrice': 1890.0, 'minWholeGrain': 70.0, 'maxBrokenRice': 30.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Red Jasmine', 'grade': 'B1', 'basePrice': 1840.0, 'minWholeGrain': 60.0, 'maxBrokenRice': 40.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Red Jasmine', 'grade': 'B2', 'basePrice': 1790.0, 'minWholeGrain': 50.0, 'maxBrokenRice': 50.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Foundation Seed - Red Jasmine', 'grade': 'A', 'basePrice': 2250.0, 'minWholeGrain': 98.0, 'maxBrokenRice': null, 'impurity': 1.0, 'maxForeignMatter': 1.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Foundation Seed - Phka Rumduol', 'grade': 'A', 'basePrice': 2140.0, 'minWholeGrain': 98.0, 'maxBrokenRice': null, 'impurity': 1.0, 'maxForeignMatter': 1.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'Certified Seed', 'grade': 'A', 'basePrice': 1950.0, 'minWholeGrain': 96.0, 'maxBrokenRice': null, 'impurity': 2.0, 'maxForeignMatter': 2.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'White Rice', 'grade': 'A', 'basePrice': 1500.0, 'minWholeGrain': null, 'maxBrokenRice': null, 'impurity': null, 'maxForeignMatter': 4.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion1, 'variety': 'White Rice', 'grade': 'B', 'basePrice': 1400.0, 'minWholeGrain': null, 'maxBrokenRice': null, 'impurity': null, 'maxForeignMatter': 8.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},

        // Region 2: Stung Treng and Ratanakiri
        {'region': pricingRegion2, 'variety': 'Phka Rumduol', 'grade': 'A1', 'basePrice': 1650.0, 'minWholeGrain': 75.0, 'maxBrokenRice': 25.0, 'impurity': 2.0, 'maxForeignMatter': 6.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Phka Rumduol', 'grade': 'A2', 'basePrice': 1550.0, 'minWholeGrain': 70.0, 'maxBrokenRice': 30.0, 'impurity': 4.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Phka Rumduol', 'grade': 'B1', 'basePrice': 1500.0, 'minWholeGrain': 60.0, 'maxBrokenRice': 40.0, 'impurity': 2.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Phka Rumduol', 'grade': 'B2', 'basePrice': 1450.0, 'minWholeGrain': 50.0, 'maxBrokenRice': 50.0, 'impurity': 4.0, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Red Jasmine', 'grade': 'A1', 'basePrice': 1850.0, 'minWholeGrain': 75.0, 'maxBrokenRice': 25.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Red Jasmine', 'grade': 'A2', 'basePrice': 1750.0, 'minWholeGrain': 70.0, 'maxBrokenRice': 30.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Red Jasmine', 'grade': 'B1', 'basePrice': 1700.0, 'minWholeGrain': 60.0, 'maxBrokenRice': 40.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Red Jasmine', 'grade': 'B2', 'basePrice': 1650.0, 'minWholeGrain': 50.0, 'maxBrokenRice': 50.0, 'impurity': null, 'maxForeignMatter': 6.0, 'maxMoisture': 14.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Foundation Seed - Red Jasmine', 'grade': 'A', 'basePrice': 2250.0, 'minWholeGrain': 98.0, 'maxBrokenRice': null, 'impurity': 1.0, 'maxForeignMatter': 1.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Foundation Seed - Phka Rumduol', 'grade': 'A', 'basePrice': 2140.0, 'minWholeGrain': 98.0, 'maxBrokenRice': null, 'impurity': 1.0, 'maxForeignMatter': 1.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'Certified Seed', 'grade': 'A', 'basePrice': 1950.0, 'minWholeGrain': 96.0, 'maxBrokenRice': null, 'impurity': 2.0, 'maxForeignMatter': 2.0, 'maxMoisture': 12.0, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'White Rice', 'grade': 'A', 'basePrice': 1400.0, 'minWholeGrain': null, 'maxBrokenRice': null, 'impurity': null, 'maxForeignMatter': 4.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
        {'region': pricingRegion2, 'variety': 'White Rice', 'grade': 'B', 'basePrice': 1300.0, 'minWholeGrain': null, 'maxBrokenRice': null, 'impurity': null, 'maxForeignMatter': 8.0, 'maxMoisture': 13.5, 'status': 'ACTIVE'},
      ];

  List<Map<String, dynamic>> _allPaddySpecs = _buildDefault2026PaddySpecs();
  List<Map<String, dynamic>> _paddySpecs = _buildDefault2026PaddySpecs();

  List<String> _buyingStations = [
    'Chhaeb Buying Station',
    'Rovieng Buying Station',
    'Kulen Buying Station',
    'Preah Vihear',
    'Stung Treng',
    'Ratanakiri',
    'Mondulkiri'
  ];

  static const List<String> canonicalDestinationWarehouses = [
    'W002 - CACC (KPT)',
    'W003 - Amru Nature (KPG)',
    'W004 - Koh Nhek',
    'W005 - Other',
  ];

  List<String> _destinationWarehouses = List.from(canonicalDestinationWarehouses);

  /// Returns canonical Warehouse ID (e.g. 'W002') matching `src/lib/warehouse-config.ts`
  static String getWarehouseId(String? val) {
    if (val == null || val.trim().isEmpty) return 'W002';
    final clean = val.trim();
    if (RegExp(r'^W00[2-5]', caseSensitive: false).hasMatch(clean)) {
      return clean.substring(0, 4).toUpperCase();
    }
    final lower = clean.toLowerCase();
    if (lower.contains('cacc') || lower.contains('kpt') || lower.contains('central mill')) {
      return 'W002';
    }
    if (lower.contains('amru') || lower.contains('kpg')) {
      return 'W003';
    }
    if (lower.contains('koh nhek') || lower.contains('nhek')) {
      return 'W004';
    }
    if (lower.contains('other')) {
      return 'W005';
    }
    if (clean.contains(' - ')) {
      return clean.split(' - ').first.trim();
    }
    return clean;
  }

  /// Returns canonical Warehouse display label (e.g. 'W002 - CACC (KPT)') matching `src/lib/warehouse-config.ts`
  static String getWarehouseDisplay(String? val) {
    final id = getWarehouseId(val);
    switch (id) {
      case 'W002':
        return 'W002 - CACC (KPT)';
      case 'W003':
        return 'W003 - Amru Nature (KPG)';
      case 'W004':
        return 'W004 - Koh Nhek';
      case 'W005':
        return 'W005 - Other';
      default:
        return val != null && val.trim().isNotEmpty ? val.trim() : 'W002 - CACC (KPT)';
    }
  }

  static String? normalizePricingRegion(String? region) {
    if (region == null) return null;
    final clean = region.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
    if (clean.isEmpty) return null;
    if (clean == 'region 1' ||
        clean == 'preah vihear and mondolkiri' ||
        clean == 'preah vihear and mondulkiri' ||
        clean == 'preah vihear' ||
        clean == 'mondolkiri' ||
        clean == 'mondulkiri') {
      return pricingRegion1;
    }
    if (clean == 'region 2' ||
        clean == 'stung treng and ratanakiri' ||
        clean == 'stung treng' ||
        clean == 'ratanakiri' ||
        clean == 'ratanakkiri') {
      return pricingRegion2;
    }
    return null;
  }

  static String? getPricingRegionForProvince(String? province) {
    if (province == null) return null;
    final lower = province.trim().toLowerCase();
    if (lower.isEmpty || lower == 'all' || lower == 'na') return null;
    if (lower == 'preah vihear' || lower == 'mondolkiri' || lower == 'mondulkiri') {
      return pricingRegion1;
    }
    if (lower == 'stung treng' || lower == 'ratanakiri' || lower == 'ratanakkiri') {
      return pricingRegion2;
    }
    return null;
  }

  static String? getPricingRegionForProvinces(List<String> provinces) {
    final regions = <String>{};
    for (final p in provinces) {
      final r = getPricingRegionForProvince(p);
      if (r != null) regions.add(r);
    }
    if (regions.length == 1) return regions.first;
    return null;
  }

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
  String? get activePricingRegion => _activePricingRegion;
  List<Map<String, dynamic>> get fleet => List.unmodifiable(_fleet);
  List<String> get villages => List.unmodifiable(_villages);

  String? getProvinceForVillage(String? village) {
    if (village == null || village.trim().isEmpty) return null;
    final clean = village.trim();
    if (_villageProvinceMapping.containsKey(clean)) {
      return _villageProvinceMapping[clean];
    }
    final lower = clean.toLowerCase();
    for (final entry in _villageProvinceMapping.entries) {
      if (entry.key.toLowerCase() == lower) {
        return entry.value;
      }
    }
    return null;
  }

  /// Automatically resolves the pricing region from the user's assigned provinces (primary)
  /// or selected village's province (for multi-region/All users), never requiring manual selection.
  String resolvePricingRegion({List<String>? assignedProvinces, String? village}) {
    if (assignedProvinces != null && assignedProvinces.isNotEmpty) {
      final userRegion = getPricingRegionForProvinces(assignedProvinces);
      if (userRegion != null) return userRegion;
    }
    final villageProv = getProvinceForVillage(village);
    final villageRegion = getPricingRegionForProvince(villageProv);
    if (villageRegion != null) return villageRegion;
    return _activePricingRegion ?? pricingRegion1;
  }

  List<Map<String, dynamic>> getSpecsForUser({List<String>? assignedProvinces, String? village}) {
    final region = resolvePricingRegion(assignedProvinces: assignedProvinces, village: village);
    final source = _allPaddySpecs.isNotEmpty ? _allPaddySpecs : _paddySpecs;
    final activeMatched = source.where((s) {
      if (s['status'] == 'INACTIVE') return false;
      final specRegion = normalizePricingRegion(s['region']?.toString());
      return specRegion == region;
    }).toList();

    if (activeMatched.isNotEmpty) {
      return List.unmodifiable(activeMatched);
    }

    final fallback = _paddySpecs.where((s) => s['status'] != 'INACTIVE').toList();
    return List.unmodifiable(fallback);
  }

  Map<String, dynamic>? getSpecFor(
    String variety,
    String grade, {
    List<String>? assignedProvinces,
    String? village,
  }) {
    final specs = getSpecsForUser(assignedProvinces: assignedProvinces, village: village);
    for (final s in specs) {
      if (s['variety'] == variety && s['grade'] == grade) {
        return s;
      }
    }
    return null;
  }

  List<String> getPaddyCategoriesForUser({List<String>? assignedProvinces, String? village}) {
    final specs = getSpecsForUser(assignedProvinces: assignedProvinces, village: village);
    final categories = <String>{};
    for (final s in specs) {
      final v = s['variety']?.toString();
      if (v != null && v.isNotEmpty) categories.add(v);
    }
    return categories.isNotEmpty ? List.unmodifiable(categories.toList()) : List.unmodifiable(_paddyCategories);
  }

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

  List<String> getGradesForCategory(
    String? category, {
    List<String>? assignedProvinces,
    String? village,
  }) {
    if (category == null || category.isEmpty) return List.unmodifiable(_grades);

    // Dynamic lookup from region-scoped master paddySpecs
    final specs = getSpecsForUser(assignedProvinces: assignedProvinces, village: village);
    final matchingSpecs = specs.where((s) => s['variety'] == category).toList();
    if (matchingSpecs.isNotEmpty) {
      final specGrades = matchingSpecs.map((s) => s['grade'].toString()).toSet().toList();
      return List.unmodifiable(specGrades);
    }

    return List.unmodifiable(_grades);
  }

  List<Map<String, dynamic>> get paddySpecs => List.unmodifiable(_paddySpecs);
  List<Map<String, dynamic>> get allPaddySpecs => List.unmodifiable(_allPaddySpecs);
  List<String> get buyingStations => List.unmodifiable(_buyingStations);
  List<String> get destinationWarehouses => List.unmodifiable(_destinationWarehouses);

  double? getBasePrice(
    String category, {
    String? grade,
    List<String>? assignedProvinces,
    String? village,
  }) {
    final specs = getSpecsForUser(assignedProvinces: assignedProvinces, village: village);
    for (final s in specs) {
      if (s['variety'] == category && (grade == null || s['grade'] == grade)) {
        final p = s['basePrice'];
        if (p is num) return p.toDouble();
      }
    }
    return null;
  }

  @visibleForTesting
  void applyConfigDataForTest(Map<String, dynamic> data) => _applyConfigData(data);

  @visibleForTesting
  void resetToDefaultsForTest() {
    _activePricingRegion = null;
    _allPaddySpecs = _buildDefault2026PaddySpecs();
    _paddySpecs = _buildDefault2026PaddySpecs();
    _paddyCategories = [
      'Phka Rumduol',
      'Red Jasmine',
      'Foundation Seed - Red Jasmine',
      'Foundation Seed - Phka Rumduol',
      'Certified Seed',
      'White Rice'
    ];
    _grades = ['A1', 'A2', 'B1', 'B2', 'A', 'B'];
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
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('app_user_id') ?? '';
      final provinces = prefs.getString('app_assigned_provinces') ?? '';
      final queryParams = <String, String>{
        't': DateTime.now().millisecondsSinceEpoch.toString(),
        if (userId.isNotEmpty) 'userId': userId,
        if (provinces.isNotEmpty) 'provinces': provinces,
      };
      final uri = Uri.parse('${AppConfig.baseUrl}/api/config').replace(queryParameters: queryParams);
      debugPrint('🔄 Fetching remote master config from: $uri');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _applyConfigData(data);

        final nowIso = DateTime.now().toIso8601String();
        _lastSyncedAt = nowIso;

        // Save downloaded master configuration to local cache for offline availability
        await prefs.setString(_kCachedConfigKey, response.body);
        await prefs.setString(_kLastSyncedAtKey, nowIso);
        configChangeNotifier.value++;

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

    // Dynamic village-to-province mapping & master village list update from server allVillages / rawVillages
    final allVList = data['allVillages'] ?? data['rawVillages'];
    if (allVList != null && allVList is List && allVList.isNotEmpty) {
      final allNames = <String>[];
      for (var item in allVList) {
        if (item is Map) {
          final vName = item['name']?.toString().trim();
          final vProv = item['province']?.toString().trim();
          if (vName != null && vName.isNotEmpty) {
            allNames.add(vName);
            if (vProv != null && vProv.isNotEmpty) {
              _villageProvinceMapping[vName] = vProv;
            }
          }
        }
      }
      if (allNames.isNotEmpty) {
        _villages = allNames.toSet().toList();
      }
    } else if (data['villages'] != null && data['villages'] is List && (data['villages'] as List).isNotEmpty) {
      _villages = (data['villages'] as List).map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toSet().toList();
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

    if (data['pricingRegion'] != null) {
      _activePricingRegion = normalizePricingRegion(data['pricingRegion']?.toString());
    }

    final rawAllSpecs = data['allPaddySpecs'];
    final rawSpecs = data['paddySpecs'];
    if (rawAllSpecs != null && rawAllSpecs is List && rawAllSpecs.isNotEmpty) {
      _allPaddySpecs = rawAllSpecs.map((e) {
        final m = Map<String, dynamic>.from(e);
        m['region'] = normalizePricingRegion(m['region']?.toString()) ?? pricingRegion1;
        return m;
      }).toList();
    }

    if (rawSpecs != null && rawSpecs is List && rawSpecs.isNotEmpty) {
      _paddySpecs = rawSpecs.map((e) {
        final m = Map<String, dynamic>.from(e);
        m['region'] = normalizePricingRegion(m['region']?.toString()) ?? _activePricingRegion ?? pricingRegion1;
        return m;
      }).toList();

      if (rawAllSpecs == null || rawAllSpecs is! List || rawAllSpecs.isEmpty) {
        _allPaddySpecs = List<Map<String, dynamic>>.from(_paddySpecs);
      }

      // Extract unique paddy categories and grades from active specs
      final categories = <String>{};
      final gradesList = <String>{};
      for (final spec in _paddySpecs) {
        if (spec['status'] == 'INACTIVE') continue;
        if (spec['variety'] != null) {
          categories.add(spec['variety'].toString());
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
      final warehouses = <String>{...canonicalDestinationWarehouses};

      for (var loc in data['locations']) {
        final name = loc['name']?.toString();
        final type = loc['type']?.toString();
        if (name != null && name.trim().isNotEmpty) {
          if (type == 'BUYING_STATION' || type == 'STATION') {
            stations.add(name.trim());
          } else if (type == 'WAREHOUSE') {
            warehouses.add(getWarehouseDisplay(name));
          }
        }
      }

      if (stations.isNotEmpty) _buyingStations = stations;
      _destinationWarehouses = warehouses.toList();
    } else {
      _destinationWarehouses = List.from(canonicalDestinationWarehouses);
    }
  }
}
