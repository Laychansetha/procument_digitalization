import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/specs_record.dart';
import '../models/farmer_profile.dart';
import '../models/purchase_record.dart';
import '../models/transport_record.dart';

class AppDatabase {
  static final AppDatabase instance = AppDatabase._init();
  static Database? _database;

  @visibleForTesting
  static bool useInMemoryForTest = false;

  bool get _useInMemory => kIsWeb || useInMemoryForTest;

  @visibleForTesting
  void clearInMemoryForTest() {
    _webSpecs.clear();
    _webFarmers.clear();
    _webPurchases.clear();
    _webTransports.clear();
  }

  /// Notifies listeners (e.g. HomeDashboard & Form Screens) whenever local SQLite records change
  final ValueNotifier<int> dbChangeNotifier = ValueNotifier<int>(0);

  void notifyDbChanged() {
    dbChangeNotifier.value++;
  }

  // In-Memory Storage Fallback for Web platform
  final List<SpecsRecord> _webSpecs = [];
  final List<FarmerProfile> _webFarmers = [];
  final List<PurchaseRecord> _webPurchases = [];
  final List<TransportRecord> _webTransports = [];

  AppDatabase._init();

  Future<Database?> get database async {
    if (_useInMemory) return null;
    if (_database != null) return _database!;
    _database = await _initDB('ibis_field_local.db');
    return _database;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 7,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      try {
        await db.execute('ALTER TABLE purchase_records ADD COLUMN premiumDescription TEXT');
        await db.execute('ALTER TABLE purchase_records ADD COLUMN additionalPremium REAL DEFAULT 0.0');
      } catch (e) {
        debugPrint('Migration error or column exists: $e');
      }
    }
    if (oldVersion < 3) {
      try {
        await db.execute('ALTER TABLE transport_records ADD COLUMN notes TEXT');
        await db.execute('ALTER TABLE transport_records ADD COLUMN status TEXT DEFAULT "EN_ROUTE"');
      } catch (e) {
        debugPrint('Migration v3 error or column exists: $e');
      }
    }
    if (oldVersion < 4) {
      try {
        await db.execute('ALTER TABLE quality_specs ADD COLUMN impurity REAL');
      } catch (e) {
        debugPrint('Migration v4 error or column exists: $e');
      }
    }
    if (oldVersion < 5) {
      try {
        await db.execute('DELETE FROM quality_specs');
        await db.execute('DELETE FROM farmer_profiles');
        await db.execute('DELETE FROM purchase_records');
        await db.execute('DELETE FROM transport_records');
        debugPrint('🧹 Migration v5: Purged old local test database records for clean fresh start.');
      } catch (e) {
        debugPrint('Migration v5 error: $e');
      }
    }
    if (oldVersion < 6) {
      try {
        await db.execute('ALTER TABLE transport_records ADD COLUMN truckPhotoUrl TEXT');
      } catch (e) {
        debugPrint('Migration v6 error or column exists: $e');
      }
    }
    if (oldVersion < 7) {
      try {
        await db.execute('ALTER TABLE transport_records ADD COLUMN driverSignature TEXT');
      } catch (e) {
        debugPrint('Migration v7 error or column exists: $e');
      }
    }
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const nullableText = 'TEXT';
    const intType = 'INTEGER NOT NULL';
    const realType = 'REAL NOT NULL';

    await db.execute('''
      CREATE TABLE quality_specs (
        id $idType,
        serverRecordId $nullableText,
        familyCode $textType,
        farmerName $textType,
        village $textType,
        paddyType $textType,
        selectedGrade $textType,
        isOrganic $intType,
        moisture $realType,
        foreignMatter $realType,
        wholeGrain REAL,
        brokenRice REAL,
        impurity REAL,
        isValid $intType,
        basePrice $realType,
        organicBonus $realType,
        finalPrice $realType,
        createdAt $textType,
        isSynced $intType,
        syncError $nullableText
      )
    ''');

    await db.execute('''
      CREATE TABLE farmer_profiles (
        id $idType,
        serverRecordId $nullableText,
        familyCode $textType,
        farmerName $textType,
        village $textType,
        phone $nullableText,
        paymentMethod $textType,
        bankName $nullableText,
        accountNumber $nullableText,
        accountHolder $nullableText,
        relationship $textType,
        bankDocumentUrl $nullableText,
        createdAt $textType,
        isSynced $intType,
        syncError $nullableText
      )
    ''');

    await db.execute('''
      CREATE TABLE purchase_records (
        id $idType,
        serverRecordId $nullableText,
        familyCode $textType,
        farmerName $textType,
        village $textType,
        variety $textType,
        grade $textType,
        standardPrice $realType,
        additionalPrice $realType,
        finalPrice $realType,
        sackWeightsJson $textType,
        totalWeight $realType,
        totalPayment $realType,
        seedBorrowed $realType,
        seedRepayment $realType,
        seedDeduction $realType,
        additionalPremium $realType,
        netPayment $realType,
        signatureFarmer $nullableText,
        signatureStaff $nullableText,
        specsRecordId $nullableText,
        transportRecordId $nullableText,
        status $textType,
        createdAt $textType,
        isSynced $intType,
        syncError $nullableText
      )
    ''');

    await db.execute('''
      CREATE TABLE transport_records (
        id $idType,
        serverRecordId $nullableText,
        driverName $textType,
        plateNumber $textType,
        mobileNumber $nullableText,
        truckCleaned $intType,
        truckPhotoUrl $nullableText,
        driverSignature $nullableText,
        loadingLocation $textType,
        destinationWarehouse $textType,
        notes $nullableText,
        totalSacks $intType,
        totalFieldWeight $realType,
        selectedPurchaseIdsJson $textType,
        status $nullableText,
        createdAt $textType,
        isSynced $intType,
        syncError $nullableText
      )
    ''');
  }

  // --- Quality Specs ---
  Future<void> insertSpecs(SpecsRecord record) async {
    if (_useInMemory) {
      _webSpecs.removeWhere((e) => e.id == record.id);
      _webSpecs.add(record);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.insert('quality_specs', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    notifyDbChanged();
  }

  Future<void> upsertSpecsBatch(List<SpecsRecord> records) async {
    if (records.isEmpty) return;
    if (_useInMemory) {
      for (final record in records) {
        _webSpecs.removeWhere((e) => e.id == record.id);
        _webSpecs.add(record);
      }
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    final batch = db!.batch();
    for (final record in records) {
      batch.insert('quality_specs', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
    notifyDbChanged();
  }

  Future<List<SpecsRecord>> getAllSpecs() async {
    if (_useInMemory) {
      _webSpecs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webSpecs;
    }
    final db = await instance.database;
    final result = await db!.query('quality_specs', orderBy: 'createdAt DESC');
    return result.map((json) => SpecsRecord.fromMap(json)).toList();
  }

  Future<void> deleteSpecs(String id) async {
    if (_useInMemory) {
      _webSpecs.removeWhere((e) => e.id == id);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.delete('quality_specs', where: 'id = ?', whereArgs: [id]);
    notifyDbChanged();
  }

  // --- Farmer Profiles ---
  Future<void> insertFarmer(FarmerProfile record) async {
    if (_useInMemory) {
      _webFarmers.removeWhere((e) => e.id == record.id);
      _webFarmers.add(record);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.insert('farmer_profiles', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    notifyDbChanged();
  }

  Future<void> upsertFarmersBatch(List<FarmerProfile> records) async {
    if (records.isEmpty) return;
    if (_useInMemory) {
      for (final record in records) {
        _webFarmers.removeWhere((e) => e.id == record.id);
        _webFarmers.add(record);
      }
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    final batch = db!.batch();
    for (final record in records) {
      batch.insert('farmer_profiles', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
    notifyDbChanged();
  }

  Future<List<FarmerProfile>> getAllFarmers() async {
    if (_useInMemory) {
      _webFarmers.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webFarmers;
    }
    final db = await instance.database;
    final result = await db!.query('farmer_profiles', orderBy: 'createdAt DESC');
    return result.map((json) => FarmerProfile.fromMap(json)).toList();
  }

  Future<void> deleteFarmer(String id) async {
    if (_useInMemory) {
      _webFarmers.removeWhere((e) => e.id == id);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.delete('farmer_profiles', where: 'id = ?', whereArgs: [id]);
    notifyDbChanged();
  }

  // --- Purchase Records ---
  Future<void> insertPurchase(PurchaseRecord record) async {
    if (_useInMemory) {
      _webPurchases.removeWhere((e) => e.id == record.id);
      _webPurchases.add(record);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.insert('purchase_records', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    notifyDbChanged();
  }

  Future<List<PurchaseRecord>> getAllPurchases() async {
    if (_useInMemory) {
      _webPurchases.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webPurchases;
    }
    final db = await instance.database;
    final result = await db!.query('purchase_records', orderBy: 'createdAt DESC');
    return result.map((json) => PurchaseRecord.fromMap(json)).toList();
  }

  Future<void> deletePurchase(String id) async {
    if (_useInMemory) {
      _webPurchases.removeWhere((e) => e.id == id);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.delete('purchase_records', where: 'id = ?', whereArgs: [id]);
    notifyDbChanged();
  }

  Future<List<PurchaseRecord>> getPurchasesForTransport(String transportId, [List<String>? selectedIds]) async {
    final all = await getAllPurchases();
    final idSet = <String>{if (selectedIds != null) ...selectedIds};
    return all.where((p) {
      if (p.transportRecordId == transportId) return true;
      if (idSet.contains(p.id)) return true;
      if (p.serverRecordId != null && idSet.contains(p.serverRecordId)) return true;
      return false;
    }).toList();
  }

  /// Links selected purchase records to a transport record (status -> IN_TRANSIT)
  /// and unlinks any previously assigned purchases that were removed (status -> PENDING)
  Future<void> assignPurchasesToTransport(String transportId, List<String> purchaseIds) async {
    final allPurchases = await getAllPurchases();
    final selectedSet = purchaseIds.toSet();

    for (final p in allPurchases) {
      final isSelected = selectedSet.contains(p.id) ||
          (p.serverRecordId != null && selectedSet.contains(p.serverRecordId));

      if (isSelected && (p.transportRecordId != transportId || p.status == 'PENDING')) {
        final updated = PurchaseRecord(
          id: p.id,
          serverRecordId: p.serverRecordId,
          familyCode: p.familyCode,
          farmerName: p.farmerName,
          village: p.village,
          variety: p.variety,
          grade: p.grade,
          standardPrice: p.standardPrice,
          additionalPrice: p.additionalPrice,
          finalPrice: p.finalPrice,
          sacks: p.sacks,
          sackWeights: p.sackWeights,
          totalWeight: p.totalWeight,
          totalPayment: p.totalPayment,
          seedBorrowed: p.seedBorrowed,
          seedRepayment: p.seedRepayment,
          seedDeduction: p.seedDeduction,
          additionalPremium: p.additionalPremium,
          netPayment: p.netPayment,
          signatureFarmer: p.signatureFarmer,
          signatureStaff: p.signatureStaff,
          specsRecordId: p.specsRecordId,
          transportRecordId: transportId,
          status: 'IN_TRANSIT',
          createdAt: p.createdAt,
          isSynced: p.isSynced,
          syncError: p.syncError,
        );
        await insertPurchase(updated);
      } else if (!isSelected && p.transportRecordId == transportId) {
        final updated = PurchaseRecord(
          id: p.id,
          serverRecordId: p.serverRecordId,
          familyCode: p.familyCode,
          farmerName: p.farmerName,
          village: p.village,
          variety: p.variety,
          grade: p.grade,
          standardPrice: p.standardPrice,
          additionalPrice: p.additionalPrice,
          finalPrice: p.finalPrice,
          sacks: p.sacks,
          sackWeights: p.sackWeights,
          totalWeight: p.totalWeight,
          totalPayment: p.totalPayment,
          seedBorrowed: p.seedBorrowed,
          seedRepayment: p.seedRepayment,
          seedDeduction: p.seedDeduction,
          additionalPremium: p.additionalPremium,
          netPayment: p.netPayment,
          signatureFarmer: p.signatureFarmer,
          signatureStaff: p.signatureStaff,
          specsRecordId: p.specsRecordId,
          transportRecordId: null,
          status: 'PENDING',
          createdAt: p.createdAt,
          isSynced: p.isSynced,
          syncError: p.syncError,
        );
        await insertPurchase(updated);
      }
    }
    notifyDbChanged();
  }

  /// Unlinks all purchase records from a deleted transport record back to PENDING
  Future<void> unassignPurchasesFromTransport(String transportId) async {
    await assignPurchasesToTransport(transportId, const []);
  }

  // --- Transport Records ---
  Future<void> insertTransport(TransportRecord record) async {
    if (_useInMemory) {
      _webTransports.removeWhere((e) => e.id == record.id);
      _webTransports.add(record);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.insert('transport_records', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    notifyDbChanged();
  }

  Future<List<TransportRecord>> getAllTransports() async {
    if (_useInMemory) {
      _webTransports.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webTransports;
    }
    final db = await instance.database;
    final result = await db!.query('transport_records', orderBy: 'createdAt DESC');
    return result.map((json) => TransportRecord.fromMap(json)).toList();
  }

  Future<void> deleteTransport(String id) async {
    if (_useInMemory) {
      _webTransports.removeWhere((e) => e.id == id);
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    await db!.delete('transport_records', where: 'id = ?', whereArgs: [id]);
    notifyDbChanged();
  }

  // --- Sync Count ---
  Future<int> getUnsyncedCount() async {
    if (_useInMemory) {
      final s = _webSpecs.where((e) => !e.isSynced).length;
      final f = _webFarmers.where((e) => !e.isSynced).length;
      final p = _webPurchases.where((e) => !e.isSynced).length;
      final t = _webTransports.where((e) => !e.isSynced).length;
      return s + f + p + t;
    }
    final db = await instance.database;
    final s = Sqflite.firstIntValue(await db!.rawQuery('SELECT COUNT(*) FROM quality_specs WHERE isSynced = 0')) ?? 0;
    final f = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM farmer_profiles WHERE isSynced = 0')) ?? 0;
    final p = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM purchase_records WHERE isSynced = 0')) ?? 0;
    final t = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM transport_records WHERE isSynced = 0')) ?? 0;
    return s + f + p + t;
  }

  /// Clear only synchronized records from local SQLite (frees up mobile device storage)
  Future<int> clearSyncedData() async {
    if (_useInMemory) {
      final s = _webSpecs.where((e) => e.isSynced).length;
      final f = _webFarmers.where((e) => e.isSynced).length;
      final p = _webPurchases.where((e) => e.isSynced).length;
      final t = _webTransports.where((e) => e.isSynced).length;
      _webSpecs.removeWhere((e) => e.isSynced);
      _webFarmers.removeWhere((e) => e.isSynced);
      _webPurchases.removeWhere((e) => e.isSynced);
      _webTransports.removeWhere((e) => e.isSynced);
      notifyDbChanged();
      return s + f + p + t;
    }
    final db = await instance.database;
    if (db != null) {
      final s = await db.delete('quality_specs', where: 'isSynced = 1');
      final f = await db.delete('farmer_profiles', where: 'isSynced = 1');
      final p = await db.delete('purchase_records', where: 'isSynced = 1');
      final t = await db.delete('transport_records', where: 'isSynced = 1');
      notifyDbChanged();
      return s + f + p + t;
    }
    return 0;
  }

  /// Wipe all local SQLite table data (for fresh app initialization / testing)
  Future<void> clearAllData() async {
    if (_useInMemory) {
      _webSpecs.clear();
      _webFarmers.clear();
      _webPurchases.clear();
      _webTransports.clear();
      notifyDbChanged();
      return;
    }
    final db = await instance.database;
    if (db != null) {
      await db.delete('quality_specs');
      await db.delete('farmer_profiles');
      await db.delete('purchase_records');
      await db.delete('transport_records');
      notifyDbChanged();
    }
  }
}
