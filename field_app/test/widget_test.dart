import 'package:flutter_test/flutter_test.dart';
import 'package:ibis_rice_field_app/database/config_dao.dart';
import 'package:ibis_rice_field_app/main.dart';
import 'package:ibis_rice_field_app/models/farmer_profile.dart';
import 'package:ibis_rice_field_app/models/purchase_record.dart';
import 'package:ibis_rice_field_app/models/specs_record.dart';
import 'package:ibis_rice_field_app/models/transport_record.dart';
import 'package:ibis_rice_field_app/utils/id_formatter.dart';

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
          variety: 'Organic Phka Rumduol',
          grade: 'Grade A',
          standardPrice: 1700,
          additionalPrice: 0,
          finalPrice: 1700,
          sackWeights: [90, 85],
          totalWeight: 175,
          totalPayment: 297500,
          netPayment: 297500,
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
        variety: 'Organic Phka Rumduol',
        grade: 'Grade A',
        standardPrice: 1700,
        additionalPrice: 0,
        finalPrice: 1700,
        sackWeights: [90],
        totalWeight: 90,
        totalPayment: 153000,
        netPayment: 153000,
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
        paddyType: 'Organic Phka Rumduol',
        selectedGrade: 'Grade A',
        moisture: 13.8,
        foreignMatter: 0.5,
        impurity: 0.5,
        isValid: true,
        basePrice: 1700,
        finalPrice: 1700,
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
        createdAt: DateTime.now(),
      );
      final restored = FarmerProfile.fromMap(farmer.toMap());
      expect(restored.bankName, 'ABA Bank');
      expect(restored.accountNumber, '001234567');
      expect(restored.toPostJson()['bankName'], 'ABA Bank');
    });
  });
}
