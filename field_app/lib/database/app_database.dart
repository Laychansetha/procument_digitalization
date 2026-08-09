import 'dart:async';
import 'dart:convert';
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

  // In-Memory Storage Fallback for Web platform
  final List<SpecsRecord> _webSpecs = [];
  final List<FarmerProfile> _webFarmers = [];
  final List<PurchaseRecord> _webPurchases = [];
  final List<TransportRecord> _webTransports = [];

  AppDatabase._init();

  Future<Database?> get database async {
    if (kIsWeb) return null;
    if (_database != null) return _database!;
    _database = await _initDB('ibis_field_local.db');
    return _database;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 3,
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
        wholeGrain $realType,
        brokenRice $realType,
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
    if (kIsWeb) {
      _webSpecs.removeWhere((e) => e.id == record.id);
      _webSpecs.add(record);
      return;
    }
    final db = await instance.database;
    await db!.insert('quality_specs', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<SpecsRecord>> getAllSpecs() async {
    if (kIsWeb) {
      _webSpecs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webSpecs;
    }
    final db = await instance.database;
    final result = await db!.query('quality_specs', orderBy: 'createdAt DESC');
    return result.map((json) => SpecsRecord.fromMap(json)).toList();
  }

  Future<void> deleteSpecs(String id) async {
    if (kIsWeb) {
      _webSpecs.removeWhere((e) => e.id == id);
      return;
    }
    final db = await instance.database;
    await db!.delete('quality_specs', where: 'id = ?', whereArgs: [id]);
  }

  // --- Farmer Profiles ---
  Future<void> insertFarmer(FarmerProfile record) async {
    if (kIsWeb) {
      _webFarmers.removeWhere((e) => e.id == record.id);
      _webFarmers.add(record);
      return;
    }
    final db = await instance.database;
    await db!.insert('farmer_profiles', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<FarmerProfile>> getAllFarmers() async {
    if (kIsWeb) {
      _webFarmers.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webFarmers;
    }
    final db = await instance.database;
    final result = await db!.query('farmer_profiles', orderBy: 'createdAt DESC');
    return result.map((json) => FarmerProfile.fromMap(json)).toList();
  }

  Future<void> deleteFarmer(String id) async {
    if (kIsWeb) {
      _webFarmers.removeWhere((e) => e.id == id);
      return;
    }
    final db = await instance.database;
    await db!.delete('farmer_profiles', where: 'id = ?', whereArgs: [id]);
  }

  // --- Purchase Records ---
  Future<void> insertPurchase(PurchaseRecord record) async {
    if (kIsWeb) {
      _webPurchases.removeWhere((e) => e.id == record.id);
      _webPurchases.add(record);
      return;
    }
    final db = await instance.database;
    await db!.insert('purchase_records', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<PurchaseRecord>> getAllPurchases() async {
    if (kIsWeb) {
      _webPurchases.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webPurchases;
    }
    final db = await instance.database;
    final result = await db!.query('purchase_records', orderBy: 'createdAt DESC');
    return result.map((json) => PurchaseRecord.fromMap(json)).toList();
  }

  Future<void> deletePurchase(String id) async {
    if (kIsWeb) {
      _webPurchases.removeWhere((e) => e.id == id);
      return;
    }
    final db = await instance.database;
    await db!.delete('purchase_records', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<PurchaseRecord>> getPurchasesForTransport(String transportId) async {
    if (kIsWeb) {
      return _webPurchases.where((e) => e.transportRecordId == transportId).toList();
    }
    final db = await instance.database;
    final result = await db!.query(
      'purchase_records',
      where: 'transportRecordId = ?',
      whereArgs: [transportId],
      orderBy: 'createdAt DESC',
    );
    return result.map((json) => PurchaseRecord.fromMap(json)).toList();
  }

  // --- Transport Records ---
  Future<void> insertTransport(TransportRecord record) async {
    if (kIsWeb) {
      _webTransports.removeWhere((e) => e.id == record.id);
      _webTransports.add(record);
      return;
    }
    final db = await instance.database;
    await db!.insert('transport_records', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<TransportRecord>> getAllTransports() async {
    if (kIsWeb) {
      _webTransports.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return _webTransports;
    }
    final db = await instance.database;
    final result = await db!.query('transport_records', orderBy: 'createdAt DESC');
    return result.map((json) => TransportRecord.fromMap(json)).toList();
  }

  Future<void> deleteTransport(String id) async {
    if (kIsWeb) {
      _webTransports.removeWhere((e) => e.id == id);
      return;
    }
    final db = await instance.database;
    await db!.delete('transport_records', where: 'id = ?', whereArgs: [id]);
  }

  // --- Sync Count ---
  Future<int> getUnsyncedCount() async {
    if (kIsWeb) {
      final s = _webSpecs.where((e) => !e.isSynced).length;
      final f = _webFarmers.where((e) => !e.isSynced).length;
      final p = _webPurchases.where((e) => !e.isSynced).length;
      final t = _webTransports.where((e) => !e.isSynced).length;
      return s + f + p + t;
    }
    final db = await instance.database;
    final s = Sqflite.firstIntValue(await db!.rawQuery('SELECT COUNT(*) FROM quality_specs WHERE isSynced = 0')) ?? 0;
    final f = Sqflite.firstIntValue(await db!.rawQuery('SELECT COUNT(*) FROM farmer_profiles WHERE isSynced = 0')) ?? 0;
    final p = Sqflite.firstIntValue(await db!.rawQuery('SELECT COUNT(*) FROM purchase_records WHERE isSynced = 0')) ?? 0;
    final t = Sqflite.firstIntValue(await db!.rawQuery('SELECT COUNT(*) FROM transport_records WHERE isSynced = 0')) ?? 0;
    return s + f + p + t;
  }
}
