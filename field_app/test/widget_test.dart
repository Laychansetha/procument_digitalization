import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ibis_rice_field_app/config/theme.dart';
import 'package:ibis_rice_field_app/database/app_database.dart';
import 'package:ibis_rice_field_app/database/config_dao.dart';
import 'package:ibis_rice_field_app/main.dart';
import 'package:ibis_rice_field_app/models/farmer_profile.dart';
import 'package:ibis_rice_field_app/models/purchase_record.dart';
import 'package:ibis_rice_field_app/models/specs_record.dart';
import 'package:ibis_rice_field_app/models/transport_record.dart';
import 'package:ibis_rice_field_app/services/api_service.dart';
import 'package:ibis_rice_field_app/services/auth_service.dart';
import 'package:ibis_rice_field_app/services/sync_service.dart';
import 'package:ibis_rice_field_app/utils/id_formatter.dart';
import 'package:ibis_rice_field_app/widgets/searchable_village_select.dart';

void main() {
  testWidgets('Login screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const IbisRiceFieldApp(isLoggedIn: false));
    expect(find.text('IBIS RICE'), findsOneWidget);
    expect(find.text('FIELD PROCUREMENT SYSTEM'), findsOneWidget);
  });

  group('IdFormatter alignment with Web App', () {
    test('generates Purchase ID as FamilyCode_DDMMYY_24H and deduplicates', () {
      final dt = DateTime(2026, 10, 26, 10, 15);
      final id1 = IdFormatter.generateUniquePurchaseId('tb010', [], dt);
      expect(id1, 'TB010_261026_10');

      final existing = [
        PurchaseRecord(
          id: id1,
          familyCode: 'TB010',
          farmerName: 'Test Farmer',
          village: 'Rovieng',
          variety: 'Phka Rumduol',
          grade: 'A1',
          standardPrice: 1650,
          additionalPrice: 0,
          finalPrice: 1650,
          sackWeights: [90, 85],
          totalWeight: 175,
          totalPayment: 288750,
          netPayment: 288750,
          createdAt: dt,
        ),
      ];
      final id2 = IdFormatter.generateUniquePurchaseId('TB010', existing, dt);
      expect(id2, 'TB010_261026_10_2');
    });

    test('formats legacy or offline Purchase IDs into FamilyCode_DDMMYY_24H', () {
      final dt = DateTime(2026, 10, 28, 14, 30);
      final legacy = PurchaseRecord(
        id: 'offline_1730000000_TB010',
        familyCode: 'TB010',
        farmerName: 'Test Farmer',
        village: 'Rovieng',
        variety: 'Phka Rumduol',
        grade: 'A1',
        standardPrice: 1650,
        additionalPrice: 0,
        finalPrice: 1650,
        sackWeights: [90],
        totalWeight: 90,
        totalPayment: 148500,
        netPayment: 148500,
        createdAt: dt,
      );
      expect(IdFormatter.formatPurchaseId(legacy), 'TB010_281026_14');
    });

    test('generates Transport ID as PlateNumber_DDMMYY and deduplicates', () {
      final dt = DateTime(2026, 10, 28, 15, 0);
      final t1 = IdFormatter.generateUniqueTransportId('3a-4455', [], dt);
      expect(t1, '3A-4455_281026');

      final existing = [
        TransportRecord(
          id: t1,
          driverName: 'Driver A',
          plateNumber: '3A-4455',
          truckCleaned: true,
          loadingLocation: 'Rovieng',
          destinationWarehouse: 'W002',
          totalSacks: 10,
          totalFieldWeight: 850,
          selectedPurchaseIds: ['TB010_281026_14'],
          createdAt: dt,
        ),
      ];
      final t2 = IdFormatter.generateUniqueTransportId('3A-4455', existing, dt);
      expect(t2, '3A-4455_281026_2');
    });
  });

  group('ConfigDao warehouse & grade helpers', () {
    test('resolves warehouse ID and display string accurately', () {
      expect(ConfigDao.getWarehouseId('W002 - CACC (KPT)'), 'W002');
      expect(ConfigDao.getWarehouseId('CACC (KPT)'), 'W002');
      expect(ConfigDao.getWarehouseDisplay('W002'), 'W002 - CACC (KPT)');
      expect(ConfigDao.getWarehouseDisplay('Amru Nature (KPG)'), 'W003 - Amru Nature (KPG)');
    });

    test('filters grades by paddy category', () {
      final rumduolGrades = ConfigDao.instance.getGradesForCategory('Phka Rumduol');
      expect(rumduolGrades, containsAll(['A1', 'A2', 'B1', 'B2']));
      final certifiedSeedGrades = ConfigDao.instance.getGradesForCategory('Certified Seed');
      expect(certifiedSeedGrades, ['A']);
    });
  });

  group('Model serialization & Web App API payload compatibility', () {
    test('SpecsRecord preserves impurity and round-trips SQLite map', () {
      final now = DateTime.now();
      final spec = SpecsRecord(
        id: 'spec_1',
        familyCode: 'TB010',
        farmerName: 'Sok Heng',
        village: 'Rovieng',
        paddyType: 'Phka Rumduol',
        selectedGrade: 'A1',
        moisture: 13.8,
        foreignMatter: 0.5,
        impurity: 0.5,
        isValid: true,
        basePrice: 1650,
        finalPrice: 1650,
        createdAt: now,
      );
      final map = spec.toMap();
      final restored = SpecsRecord.fromMap(map);
      expect(restored.impurity, 0.5);
      expect(restored.toPostJson()['impurity'], 0.5);
    });

    test('FarmerProfile round-trips SQLite map and API JSON', () {
      final farmer = FarmerProfile(
        id: 'farmer_1',
        familyCode: 'TB010',
        farmerName: 'Sok Heng',
        village: 'Rovieng',
        phone: '012345678',
        paymentMethod: 'Bank Transfer',
        bankName: 'ABA Bank',
        accountHolder: 'SOK HENG',
        accountNumber: '001234567',
        relationship: 'Self',
        createdAt: DateTime.now(),
      );
      final restored = FarmerProfile.fromMap(farmer.toMap());
      expect(restored.bankName, 'ABA Bank');
      expect(restored.accountNumber, '001234567');
      expect(restored.relationship, 'Self');
      expect(restored.toPostJson()['bankName'], 'ABA Bank');
    });
  });

  group('UI Layout and Field Sizing Tests', () {
    testWidgets('Village, Paddy Category, and Grade have consistent sizing and alignment', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1280);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final villageKey = GlobalKey();
      final categoryKey = GlobalKey();
      final gradeKey = GlobalKey();

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      key: villageKey,
                      child: SearchableVillageSelect(
                        value: null,
                        onChanged: (_) {},
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      key: categoryKey,
                      child: DropdownButtonFormField<String>(
                        value: null,
                        isExpanded: true,
                        isDense: true,
                        icon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
                        decoration: const InputDecoration(
                          labelText: 'PADDY CATEGORY *',
                          hintText: 'Select Category',
                          floatingLabelBehavior: FloatingLabelBehavior.always,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        ),
                        hint: const Text(
                          'Select Category',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          maxLines: 1,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                        ),
                        items: const [
                          DropdownMenuItem(value: 'Phka Rumduol', child: Text('Phka Rumduol', overflow: TextOverflow.ellipsis)),
                        ],
                        onChanged: (_) {},
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      key: gradeKey,
                      child: DropdownButtonFormField<String>(
                        value: null,
                        isExpanded: true,
                        isDense: true,
                        icon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
                        decoration: const InputDecoration(
                          labelText: 'GRADE *',
                          hintText: 'Select Grade',
                          floatingLabelBehavior: FloatingLabelBehavior.always,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        ),
                        hint: const Text(
                          'Select Grade',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          maxLines: 1,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                        ),
                        items: const [
                          DropdownMenuItem(value: 'A1', child: Text('A1', overflow: TextOverflow.ellipsis)),
                        ],
                        onChanged: (_) {},
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      final villageSize = tester.getSize(find.byKey(villageKey));
      final categorySize = tester.getSize(find.byKey(categoryKey));
      final gradeSize = tester.getSize(find.byKey(gradeKey));

      // All three fields must have identical width across equal columns
      expect(categorySize.width, equals(villageSize.width));
      expect(gradeSize.width, equals(categorySize.width));

      // All three fields must have identical height
      expect(categorySize.height, equals(villageSize.height));
      expect(gradeSize.height, equals(categorySize.height));
    });
  });

  group('Shared Field Team Sync Logic', () {
    setUp(() {
      AppDatabase.useInMemoryForTest = true;
      AppDatabase.instance.clearInMemoryForTest();
    });

    tearDown(() {
      AppDatabase.instance.clearInMemoryForTest();
      AppDatabase.useInMemoryForTest = false;
    });

    test('downloads shared site Specs & Farmers for FIELD role without duplicating or overwriting unsynced edits', () async {
      SharedPreferences.setMockInitialValues({
        AuthService.keyIsLoggedIn: true,
        AuthService.keyUserId: 'user_piseth',
        AuthService.keyUserName: 'piseth',
        AuthService.keyUserRole: 'FIELD',
        AuthService.keyAssignedProvinces: 'All',
      });

      // Pre-seed one unsynced local SpecsRecord that must NOT be overwritten
      await AppDatabase.instance.insertSpecs(
        SpecsRecord(
          id: 'local_unsynced_1',
          serverRecordId: 'srv_spec_2',
          familyCode: 'TB020',
          farmerName: 'Local Unsynced Edit',
          village: 'Rovieng',
          paddyType: 'Phka Rumduol',
          selectedGrade: 'A1',
          moisture: 13.0,
          foreignMatter: 1.0,
          isValid: true,
          basePrice: 1650,
          finalPrice: 1650,
          createdAt: DateTime(2026, 11, 12, 9, 0),
          isSynced: false,
        ),
      );

      final mockClient = MockClient((request) async {
        expect(request.headers['x-user-id'], 'user_piseth');
        expect(request.headers['x-user-role'], 'FIELD');

        if (request.url.path == '/api/specs') {
          return http.Response(
            jsonEncode([
              {
                'id': 'srv_spec_1',
                'familyCode': 'TB010',
                'farmerName': 'Created By Teammate',
                'village': 'Rovieng',
                'paddyType': 'Phka Rumduol',
                'selectedGrade': 'A1',
                'isOrganic': true,
                'moisture': 13.5,
                'foreignMatter': 1.2,
                'wholeGrain': 75.0,
                'brokenRice': 25.0,
                'impurity': 0.5,
                'isValid': true,
                'basePrice': 1650,
                'finalPrice': 1650,
                'createdAt': '2026-11-12T08:00:00.000Z',
              },
              {
                'id': 'srv_spec_2',
                'familyCode': 'TB020',
                'farmerName': 'Server Older Name',
                'village': 'Rovieng',
                'paddyType': 'Phka Rumduol',
                'selectedGrade': 'A1',
                'isOrganic': true,
                'moisture': 14.5,
                'foreignMatter': 2.0,
                'isValid': true,
                'basePrice': 1650,
                'finalPrice': 1650,
                'createdAt': '2026-11-12T08:30:00.000Z',
              },
            ]),
            200,
          );
        }

        if (request.url.path == '/api/farmers') {
          return http.Response(
            jsonEncode([
              {
                'id': 'srv_farmer_1',
                'familyCode': 'TB010',
                'farmerName': 'Created By Teammate',
                'village': 'Rovieng',
                'phone': '012345678',
                'paymentMethod': 'Bank Transfer',
                'bankName': 'ABA Bank',
                'accountNumber': '001234567',
                'accountHolder': 'CREATED BY TEAMMATE',
                'relationship': 'Self',
                'bankDocumentUrl': '/uploads/doc1.jpg',
                'createdAt': '2026-11-12T08:00:00.000Z',
              },
            ]),
            200,
          );
        }

        return http.Response('[]', 200);
      });

      final syncService = SyncService(apiService: ApiService(client: mockClient));
      final firstResult = await syncService.downloadSharedFieldRecords();

      expect(firstResult.hasError, false);
      expect(firstResult.specsCount, 1); // srv_spec_1 downloaded; srv_spec_2 skipped (unsynced local edit)
      expect(firstResult.farmersCount, 1);

      // Re-run download to verify zero duplication
      final secondResult = await syncService.downloadSharedFieldRecords();
      expect(secondResult.hasError, false);

      final allSpecs = await AppDatabase.instance.getAllSpecs();
      expect(allSpecs.length, 2);
      final downloadedSpec = allSpecs.firstWhere((s) => s.familyCode == 'TB010');
      expect(downloadedSpec.farmerName, 'Created By Teammate');
      expect(downloadedSpec.serverRecordId, 'srv_spec_1');
      expect(downloadedSpec.isSynced, true);

      final unsyncedSpec = allSpecs.firstWhere((s) => s.familyCode == 'TB020');
      expect(unsyncedSpec.farmerName, 'Local Unsynced Edit');
      expect(unsyncedSpec.isSynced, false);

      final allFarmers = await AppDatabase.instance.getAllFarmers();
      expect(allFarmers.length, 1);
      expect(allFarmers.first.bankName, 'ABA Bank');
      expect(allFarmers.first.serverRecordId, 'srv_farmer_1');
    });

    test('skips shared Field Team download for non-FIELD roles', () async {
      SharedPreferences.setMockInitialValues({
        AuthService.keyIsLoggedIn: true,
        AuthService.keyUserId: 'user_admin',
        AuthService.keyUserName: 'chansetha',
        AuthService.keyUserRole: 'ADMIN',
      });

      bool apiCalled = false;
      final mockClient = MockClient((request) async {
        apiCalled = true;
        return http.Response('[]', 200);
      });

      final syncService = SyncService(apiService: ApiService(client: mockClient));
      final result = await syncService.downloadSharedFieldRecords();

      expect(apiCalled, false);
      expect(result.specsCount, 0);
      expect(result.farmersCount, 0);
    });

    test('enforces strict site separation and does NOT download other users Purchase or Transport records', () async {
      SharedPreferences.setMockInitialValues({
        AuthService.keyIsLoggedIn: true,
        AuthService.keyUserId: 'user_piseth',
        AuthService.keyUserName: 'piseth',
        AuthService.keyUserRole: 'FIELD',
        AuthService.keyAssignedProvinces: 'Preah Vihear',
      });

      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/specs') {
          return http.Response(
            jsonEncode([
              {
                'id': 'pvh_spec_1',
                'familyCode': 'PVH001',
                'farmerName': 'Preah Vihear Farmer',
                'village': 'Sambou', // Preah Vihear village
                'paddyType': 'Phka Rumduol',
                'selectedGrade': 'A1',
                'isOrganic': true,
                'moisture': 13.0,
                'foreignMatter': 1.0,
                'isValid': true,
                'basePrice': 1650,
                'finalPrice': 1650,
                'createdAt': '2026-11-12T08:00:00.000Z',
              },
              {
                'id': 'st_spec_1',
                'familyCode': 'ST001',
                'farmerName': 'Stung Treng Farmer',
                'village': 'Doung', // Stung Treng village (different site!)
                'paddyType': 'Phka Rumduol',
                'selectedGrade': 'A1',
                'isOrganic': true,
                'moisture': 13.0,
                'foreignMatter': 1.0,
                'isValid': true,
                'basePrice': 1650,
                'finalPrice': 1650,
                'createdAt': '2026-11-12T08:00:00.000Z',
              },
            ]),
            200,
          );
        }
        if (request.url.path == '/api/purchases') {
          return http.Response(
            jsonEncode([
              {
                'id': 'OTHER_USER_PURCHASE_1',
                'familyCode': 'PVH001',
                'farmerName': 'Preah Vihear Farmer',
                'village': 'Sambou',
                'status': 'PENDING',
              },
            ]),
            200,
          );
        }
        if (request.url.path == '/api/transport') {
          return http.Response(
            jsonEncode([
              {
                'id': '3A-9999_121126',
                'plateNumber': '3A-9999',
                'status': 'EN_ROUTE',
              },
            ]),
            200,
          );
        }
        return http.Response('[]', 200);
      });

      final syncService = SyncService(apiService: ApiService(client: mockClient));
      await syncService.syncAllOfflineRecords();

      // 1. Only Preah Vihear ('Sambou') specs record is stored; Stung Treng ('Doung') is excluded
      final specs = await AppDatabase.instance.getAllSpecs();
      expect(specs.length, 1);
      expect(specs.first.familyCode, 'PVH001');
      expect(specs.first.village, 'Sambou');

      // 2. Other users' Purchase and Transport records are NEVER downloaded to this Field App account
      final purchases = await AppDatabase.instance.getAllPurchases();
      expect(purchases, isEmpty);

      final transports = await AppDatabase.instance.getAllTransports();
      expect(transports, isEmpty);
    });

    test('PurchaseRecord serializes direct sacks count and totalWeight in SQLite and API JSON', () async {
      final record = PurchaseRecord(
        id: 'TB010_141126_10',
        familyCode: 'TB010',
        farmerName: 'Test Farmer',
        village: 'Prey Veng',
        variety: 'Organic Phka Rumduol',
        grade: 'A',
        standardPrice: 1500,
        additionalPrice: 50,
        finalPrice: 1550,
        sacks: 25,
        sackWeights: const [],
        totalWeight: 2150.5,
        totalPayment: 3333275,
        seedBorrowed: 100,
        netPayment: 3333275,
        specsRecordId: 'specs-123',
        createdAt: DateTime.parse('2026-11-14T10:00:00.000Z'),
      );

      await AppDatabase.instance.insertPurchase(record);
      final saved = await AppDatabase.instance.getAllPurchases();
      expect(saved.length, 1);
      expect(saved.first.sacks, 25);
      expect(saved.first.totalWeight, 2150.5);
      expect(saved.first.sackWeights, isEmpty);
      expect(saved.first.specsRecordId, 'specs-123');
      expect(saved.first.finalPrice, 1550);

      final postJson = saved.first.toPostJson();
      expect(postJson['totalWeight'], 2150.5);
      expect(postJson['seedBorrowed'], 100);
      expect(postJson['specsRecordId'], 'specs-123');
      final items = postJson['items'] as List<dynamic>;
      expect(items.length, 1);
      final item = items.first as Map<String, dynamic>;
      expect(item['sacks'], 25);
      expect(item['quantity'], 2150.5);
      expect(item['additionalPrice'], 50);
      expect(item['finalPrice'], 1550);
      expect(item['sackWeights'], isNull);
    });
  });
}
