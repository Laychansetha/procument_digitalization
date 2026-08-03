import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ConfigDao {
  static final ConfigDao instance = ConfigDao._init();
  ConfigDao._init();

  double _seedInterestRate = 1.10; // 10% Interest default
  double _scaleTolerancePercent = 1.5; // 1.5% scale variance limit default

  List<String> _villages = ['Bra', 'Chhaeb Kraom', 'Chhaeb Leu', 'Mlu Prey', 'Sangkae'];
  List<String> _banks = ['ABA Bank', 'ACLEDA Bank', 'Wing Bank', 'Canadia Bank', 'AMK Microfinance'];
  List<String> _paddyCategories = ['Phka Rumduol', 'Red Jasmine', 'Sen Kra Ob'];
  List<String> _grades = ['A1', 'Super A1', 'A2', 'B1'];

  List<Map<String, dynamic>> _paddySpecs = [
    {'variety': 'Phka Rumduol', 'grade': 'A1', 'basePrice': 1750.0, 'organicBonus': 100.0},
    {'variety': 'Red Jasmine', 'grade': 'A1', 'basePrice': 1650.0, 'organicBonus': 100.0},
    {'variety': 'Sen Kra Ob', 'grade': 'A1', 'basePrice': 1600.0, 'organicBonus': 100.0},
  ];

  List<String> _buyingStations = [
    'Chhaeb Buying Station',
    'Mlu Prey Collection Point',
    'Tbeng Meanchey Station',
    'Choam Ksant Station',
    'Rovieng Station',
    'Kulea Station'
  ];

  List<String> _destinationWarehouses = [
    'Central Mill Warehouse, Preah Vihear',
    'Phnom Penh Export Terminal',
    'Battambang Processing Silo',
    'Siem Reap Transit Hub'
  ];

  Map<String, double> _basePrices = {
    'Phka Rumduol': 1750.0,
    'Red Jasmine': 1650.0,
    'Sen Kra Ob': 1600.0,
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
    return _basePrices[category] ?? 1750.0;
  }

  Future<void> fetchRemoteConfig() async {
    try {
      final response = await http.get(Uri.parse('${AppConfig.baseUrl}/api/config')).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

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

        debugPrint('✅ Dynamic Configuration synchronized from server.');
      }
    } catch (e) {
      debugPrint('⚠️ Network config fetch offline fallback: $e');
    }
  }
}
