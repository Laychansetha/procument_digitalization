import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../database/app_database.dart';
import '../database/config_dao.dart';
import '../models/specs_record.dart';
import '../models/farmer_profile.dart';
import '../models/purchase_record.dart';
import '../models/transport_record.dart';
import 'api_service.dart';
import 'auth_service.dart';

class SyncResult {
  final int syncedCount;
  final int errorCount;
  final String message;

  SyncResult({required this.syncedCount, required this.errorCount, required this.message});
}

class SharedDownloadResult {
  final int specsCount;
  final int farmersCount;
  final bool hasError;

  SharedDownloadResult({
    required this.specsCount,
    required this.farmersCount,
    this.hasError = false,
  });
}

class SyncService {
  static bool _isSyncRunning = false;
  final ApiService _apiService;

  SyncService({ApiService? apiService}) : _apiService = apiService ?? ApiService();

  String _extractErrorMessage(String body, int statusCode) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map && decoded['error'] != null) {
        return decoded['error'].toString();
      }
    } catch (_) {}
    return 'Server returned HTTP $statusCode';
  }

  /// Execute sequential background/manual sync with central PostgreSQL server
  Future<SyncResult> syncAllOfflineRecords({Function(String status)? onProgress}) async {
    if (_isSyncRunning) {
      return SyncResult(
        syncedCount: 0,
        errorCount: 0,
        message: 'Synchronization is already in progress...',
      );
    }

    _isSyncRunning = true;
    int syncedCount = 0;
    int errorCount = 0;
    String? lastErrorMsg;

    try {
      final db = AppDatabase.instance;
      final userInfo = await AuthService.getUserInfo();
      final staffName = userInfo['name'] ?? 'Field Inspector';

      // 1. SYNC SPECS RECORDS
      final specsList = await db.getAllSpecs();
      final unsyncedSpecs = specsList.where((s) => !s.isSynced).toList();

      for (var spec in unsyncedSpecs) {
        if (onProgress != null) onProgress('Syncing Specs for ${spec.familyCode} (${spec.village})...');
        try {
          final res = await _apiService.postData('/api/specs', spec.toPostJson());
          if (res.statusCode == 200 || res.statusCode == 201) {
            final data = jsonDecode(res.body);
            final serverId = data['id']?.toString();
            if (serverId != null && serverId.isNotEmpty) {
              for (final other in specsList) {
                if (other.id != spec.id && (other.id == serverId || other.serverRecordId == serverId)) {
                  await db.deleteSpecs(other.id);
                }
              }
            }
            final updated = SpecsRecord(
              id: spec.id,
              serverRecordId: serverId,
              familyCode: spec.familyCode,
              farmerName: spec.farmerName,
              village: spec.village,
              paddyType: spec.paddyType,
              selectedGrade: spec.selectedGrade,
              isOrganic: spec.isOrganic,
              moisture: spec.moisture,
              foreignMatter: spec.foreignMatter,
              wholeGrain: spec.wholeGrain,
              brokenRice: spec.brokenRice,
              impurity: spec.impurity,
              isValid: spec.isValid,
              basePrice: spec.basePrice,
              organicBonus: spec.organicBonus,
              finalPrice: spec.finalPrice,
              createdAt: spec.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertSpecs(updated);
            syncedCount++;
          } else {
            errorCount++;
            lastErrorMsg = _extractErrorMessage(res.body, res.statusCode);
            final failed = SpecsRecord(
              id: spec.id,
              serverRecordId: spec.serverRecordId,
              familyCode: spec.familyCode,
              farmerName: spec.farmerName,
              village: spec.village,
              paddyType: spec.paddyType,
              selectedGrade: spec.selectedGrade,
              isOrganic: spec.isOrganic,
              moisture: spec.moisture,
              foreignMatter: spec.foreignMatter,
              wholeGrain: spec.wholeGrain,
              brokenRice: spec.brokenRice,
              impurity: spec.impurity,
              isValid: spec.isValid,
              basePrice: spec.basePrice,
              organicBonus: spec.organicBonus,
              finalPrice: spec.finalPrice,
              createdAt: spec.createdAt,
              isSynced: false,
              syncError: lastErrorMsg,
            );
            await db.insertSpecs(failed);
          }
        } catch (e) {
          errorCount++;
          lastErrorMsg = 'Connection error: $e';
        }
      }

      // 2. SYNC FARMER PAYMENT PROFILES
      final farmersList = await db.getAllFarmers();
      final unsyncedFarmers = farmersList.where((f) => !f.isSynced).toList();

      for (var farmer in unsyncedFarmers) {
        if (onProgress != null) onProgress('Syncing Farmer Profile for ${farmer.familyCode} (${farmer.village})...');
        try {
          String? remotePhotoUrl;
          if (!kIsWeb && farmer.bankDocumentUrl != null && farmer.bankDocumentUrl!.isNotEmpty) {
            try {
              final file = File(farmer.bankDocumentUrl!);
              if (file.existsSync()) {
                remotePhotoUrl = await _apiService.uploadPhoto(file);
                if (remotePhotoUrl == null) {
                  final bytes = await file.readAsBytes();
                  remotePhotoUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
                }
              } else if (farmer.bankDocumentUrl!.startsWith('data:image/') ||
                  farmer.bankDocumentUrl!.startsWith('/uploads/') ||
                  farmer.bankDocumentUrl!.startsWith('http')) {
                remotePhotoUrl = farmer.bankDocumentUrl;
              }
            } catch (e) {
              debugPrint('Error preparing photo for upload: $e');
            }
          }

          final res = await _apiService.postData(
            '/api/farmers',
            farmer.toPostJson(uploadedPhotoUrl: remotePhotoUrl),
          );

          if (res.statusCode == 200 || res.statusCode == 201) {
            final data = jsonDecode(res.body);
            final serverId = data['id']?.toString();
            if (serverId != null && serverId.isNotEmpty) {
              for (final other in farmersList) {
                if (other.id != farmer.id && (other.id == serverId || other.serverRecordId == serverId)) {
                  await db.deleteFarmer(other.id);
                }
              }
            }
            final updated = FarmerProfile(
              id: farmer.id,
              serverRecordId: serverId,
              familyCode: farmer.familyCode,
              farmerName: farmer.farmerName,
              village: farmer.village,
              phone: farmer.phone,
              paymentMethod: farmer.paymentMethod,
              bankName: farmer.bankName,
              accountNumber: farmer.accountNumber,
              accountHolder: farmer.accountHolder,
              relationship: farmer.relationship,
              bankDocumentUrl: remotePhotoUrl ?? farmer.bankDocumentUrl,
              createdAt: farmer.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertFarmer(updated);
            syncedCount++;
          } else {
            errorCount++;
            lastErrorMsg = _extractErrorMessage(res.body, res.statusCode);
            final failed = FarmerProfile(
              id: farmer.id,
              serverRecordId: farmer.serverRecordId,
              familyCode: farmer.familyCode,
              farmerName: farmer.farmerName,
              village: farmer.village,
              phone: farmer.phone,
              paymentMethod: farmer.paymentMethod,
              bankName: farmer.bankName,
              accountNumber: farmer.accountNumber,
              accountHolder: farmer.accountHolder,
              relationship: farmer.relationship,
              bankDocumentUrl: farmer.bankDocumentUrl,
              createdAt: farmer.createdAt,
              isSynced: false,
              syncError: lastErrorMsg,
            );
            await db.insertFarmer(failed);
          }
        } catch (e) {
          errorCount++;
          lastErrorMsg = 'Connection error: $e';
        }
      }

      // 3. SYNC PURCHASE INVOICES
      final allSpecs = await db.getAllSpecs();
      final specsServerMap = <String, String>{};
      for (var s in allSpecs) {
        if (s.serverRecordId != null && s.serverRecordId!.isNotEmpty) {
          specsServerMap[s.id] = s.serverRecordId!;
        }
      }

      final purchasesList = await db.getAllPurchases();
      final unsyncedPurchases = purchasesList.where((p) => !p.isSynced).toList();

      for (var purchase in unsyncedPurchases) {
        if (onProgress != null) onProgress('Syncing Purchase Invoice for ${purchase.familyCode} (${purchase.village})...');
        try {
          // Guard against duplicate submission if serverRecordId is already present
          if (purchase.serverRecordId != null && purchase.serverRecordId!.isNotEmpty) {
            final alreadySynced = PurchaseRecord(
              id: purchase.id,
              serverRecordId: purchase.serverRecordId,
              familyCode: purchase.familyCode,
              farmerName: purchase.farmerName,
              village: purchase.village,
              variety: purchase.variety,
              grade: purchase.grade,
              standardPrice: purchase.standardPrice,
              additionalPrice: purchase.additionalPrice,
              finalPrice: purchase.finalPrice,
              sackWeights: purchase.sackWeights,
              totalWeight: purchase.totalWeight,
              totalPayment: purchase.totalPayment,
              seedBorrowed: purchase.seedBorrowed,
              seedRepayment: purchase.seedRepayment,
              seedDeduction: purchase.seedDeduction,
              additionalPremium: purchase.additionalPremium,
              netPayment: purchase.netPayment,
              signatureFarmer: purchase.signatureFarmer,
              signatureStaff: purchase.signatureStaff,
              specsRecordId: purchase.specsRecordId,
              transportRecordId: purchase.transportRecordId,
              status: purchase.status,
              createdAt: purchase.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertPurchase(alreadySynced);
            syncedCount++;
            continue;
          }

          final payload = purchase.toPostJson();
          if (purchase.specsRecordId != null && specsServerMap.containsKey(purchase.specsRecordId)) {
            payload['specsRecordId'] = specsServerMap[purchase.specsRecordId];
          }

          final res = await _apiService.postData('/api/purchases', payload);
          if (res.statusCode == 200 || res.statusCode == 201) {
            final data = jsonDecode(res.body);
            final serverId = data['id']?.toString();
            final updated = PurchaseRecord(
              id: purchase.id,
              serverRecordId: serverId,
              familyCode: purchase.familyCode,
              farmerName: purchase.farmerName,
              village: purchase.village,
              variety: purchase.variety,
              grade: purchase.grade,
              standardPrice: purchase.standardPrice,
              additionalPrice: purchase.additionalPrice,
              finalPrice: purchase.finalPrice,
              sackWeights: purchase.sackWeights,
              totalWeight: purchase.totalWeight,
              totalPayment: purchase.totalPayment,
              seedBorrowed: purchase.seedBorrowed,
              seedRepayment: purchase.seedRepayment,
              seedDeduction: purchase.seedDeduction,
              additionalPremium: purchase.additionalPremium,
              netPayment: purchase.netPayment,
              signatureFarmer: purchase.signatureFarmer,
              signatureStaff: purchase.signatureStaff,
              specsRecordId: payload['specsRecordId']?.toString() ?? purchase.specsRecordId,
              transportRecordId: purchase.transportRecordId,
              status: purchase.status,
              createdAt: purchase.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertPurchase(updated);
            syncedCount++;
          } else {
            errorCount++;
            lastErrorMsg = _extractErrorMessage(res.body, res.statusCode);
            final failed = PurchaseRecord(
              id: purchase.id,
              serverRecordId: purchase.serverRecordId,
              familyCode: purchase.familyCode,
              farmerName: purchase.farmerName,
              village: purchase.village,
              variety: purchase.variety,
              grade: purchase.grade,
              standardPrice: purchase.standardPrice,
              additionalPrice: purchase.additionalPrice,
              finalPrice: purchase.finalPrice,
              sackWeights: purchase.sackWeights,
              totalWeight: purchase.totalWeight,
              totalPayment: purchase.totalPayment,
              seedBorrowed: purchase.seedBorrowed,
              seedRepayment: purchase.seedRepayment,
              seedDeduction: purchase.seedDeduction,
              additionalPremium: purchase.additionalPremium,
              netPayment: purchase.netPayment,
              signatureFarmer: purchase.signatureFarmer,
              signatureStaff: purchase.signatureStaff,
              specsRecordId: purchase.specsRecordId,
              transportRecordId: purchase.transportRecordId,
              status: purchase.status,
              createdAt: purchase.createdAt,
              isSynced: false,
              syncError: lastErrorMsg,
            );
            await db.insertPurchase(failed);
          }
        } catch (e) {
          errorCount++;
          lastErrorMsg = 'Connection error: $e';
        }
      }

      // 4. SYNC TRANSPORT DISPATCHES
      final updatedPurchases = await db.getAllPurchases();
      final purchaseServerMap = <String, String>{};
      for (var p in updatedPurchases) {
        if (p.serverRecordId != null && p.serverRecordId!.isNotEmpty) {
          purchaseServerMap[p.id] = p.serverRecordId!;
          purchaseServerMap[p.serverRecordId!] = p.serverRecordId!;
        } else {
          purchaseServerMap[p.id] = p.id;
        }
      }

      final transportList = await db.getAllTransports();
      final unsyncedTransport = transportList.where((t) => !t.isSynced).toList();

      for (var transport in unsyncedTransport) {
        if (onProgress != null) onProgress('Syncing Transport Dispatch for ${transport.plateNumber}...');
        try {
          if (transport.serverRecordId != null && transport.serverRecordId!.isNotEmpty) {
            final alreadySynced = TransportRecord(
              id: transport.id,
              serverRecordId: transport.serverRecordId,
              driverName: transport.driverName,
              plateNumber: transport.plateNumber,
              mobileNumber: transport.mobileNumber,
              truckCleaned: transport.truckCleaned,
              truckPhotoUrl: transport.truckPhotoUrl,
              driverSignature: transport.driverSignature,
              loadingLocation: transport.loadingLocation,
              destinationWarehouse: ConfigDao.getWarehouseId(transport.destinationWarehouse),
              notes: transport.notes,
              totalSacks: transport.totalSacks,
              totalFieldWeight: transport.totalFieldWeight,
              selectedPurchaseIds: transport.selectedPurchaseIds,
              status: transport.status,
              createdAt: transport.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertTransport(alreadySynced);
            syncedCount++;
            continue;
          }

          String? remotePhotoUrl;
          if (!kIsWeb && transport.truckPhotoUrl != null && transport.truckPhotoUrl!.isNotEmpty) {
            try {
              final file = File(transport.truckPhotoUrl!);
              if (file.existsSync()) {
                remotePhotoUrl = await _apiService.uploadPhoto(file);
                if (remotePhotoUrl == null) {
                  final bytes = await file.readAsBytes();
                  remotePhotoUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
                }
              } else if (transport.truckPhotoUrl!.startsWith('data:image/') ||
                  transport.truckPhotoUrl!.startsWith('/uploads/') ||
                  transport.truckPhotoUrl!.startsWith('http')) {
                remotePhotoUrl = transport.truckPhotoUrl;
              }
            } catch (e) {
              debugPrint('Error preparing truck photo for upload: $e');
            }
          }

          final payload = transport.toPostJson(uploadedPhotoUrl: remotePhotoUrl);
          final resolvedIds = transport.selectedPurchaseIds.map((id) => purchaseServerMap[id] ?? id).toList();
          payload['selectedPurchaseIds'] = resolvedIds;
          payload['destinationWarehouse'] = ConfigDao.getWarehouseId(transport.destinationWarehouse);
          payload['fieldStaffName'] = staffName;

          final res = await _apiService.postData('/api/transport', payload);
          if (res.statusCode == 200 || res.statusCode == 201) {
            final data = jsonDecode(res.body);
            final serverTransportId = data['id']?.toString();
            final updated = TransportRecord(
              id: transport.id,
              serverRecordId: serverTransportId,
              driverName: transport.driverName,
              plateNumber: transport.plateNumber,
              mobileNumber: transport.mobileNumber,
              truckCleaned: transport.truckCleaned,
              truckPhotoUrl: remotePhotoUrl ?? transport.truckPhotoUrl,
              driverSignature: transport.driverSignature,
              loadingLocation: transport.loadingLocation,
              destinationWarehouse: ConfigDao.getWarehouseId(transport.destinationWarehouse),
              notes: transport.notes,
              totalSacks: transport.totalSacks,
              totalFieldWeight: transport.totalFieldWeight,
              selectedPurchaseIds: resolvedIds,
              status: transport.status,
              createdAt: transport.createdAt,
              isSynced: true,
              syncError: null,
            );
            await db.insertTransport(updated);
            await db.assignPurchasesToTransport(transport.id, resolvedIds);
            syncedCount++;
          } else {
            errorCount++;
            lastErrorMsg = _extractErrorMessage(res.body, res.statusCode);
            final failed = TransportRecord(
              id: transport.id,
              serverRecordId: transport.serverRecordId,
              driverName: transport.driverName,
              plateNumber: transport.plateNumber,
              mobileNumber: transport.mobileNumber,
              truckCleaned: transport.truckCleaned,
              truckPhotoUrl: transport.truckPhotoUrl,
              driverSignature: transport.driverSignature,
              loadingLocation: transport.loadingLocation,
              destinationWarehouse: ConfigDao.getWarehouseId(transport.destinationWarehouse),
              notes: transport.notes,
              totalSacks: transport.totalSacks,
              totalFieldWeight: transport.totalFieldWeight,
              selectedPurchaseIds: transport.selectedPurchaseIds,
              status: transport.status,
              createdAt: transport.createdAt,
              isSynced: false,
              syncError: lastErrorMsg,
            );
            await db.insertTransport(failed);
          }
        } catch (e) {
          errorCount++;
          lastErrorMsg = 'Connection error: $e';
        }
      }

      // 5. RECONCILE SERVER STATUS FOR EXISTING SYNCED RECORDS
      await _reconcileSyncedStatuses();

      // 6. DOWNLOAD SHARED SITE SPECS & FARMER PROFILES (FIELD TEAM ONLY)
      final sharedResult = await downloadSharedFieldRecords(onProgress: onProgress);
      final downloadedTotal = sharedResult.specsCount + sharedResult.farmersCount;

      String message;
      if (errorCount > 0) {
        message = 'Sync completed with $errorCount warning(s)${lastErrorMsg != null ? ': $lastErrorMsg' : '.'}';
      } else if (syncedCount > 0 && downloadedTotal > 0) {
        message = 'Synced $syncedCount record(s) & updated $downloadedTotal shared site record(s).';
      } else if (syncedCount > 0) {
        message = 'Successfully synchronized $syncedCount record(s) with central PostgreSQL server.';
      } else if (downloadedTotal > 0) {
        message = 'Downloaded $downloadedTotal shared site record(s) (${sharedResult.specsCount} Specs, ${sharedResult.farmersCount} Farmers).';
      } else {
        message = 'All records are up to date!';
      }

      return SyncResult(
        syncedCount: syncedCount,
        errorCount: errorCount,
        message: message,
      );
    } finally {
      _isSyncRunning = false;
    }
  }

  /// Reconciles statuses of local synced Purchase and Transport records against the server
  /// so Warehouse Receiving / Rejection status updates are reflected on the tablet.
  Future<void> _reconcileSyncedStatuses() async {
    try {
      final db = AppDatabase.instance;
      final localPurchases = await db.getAllPurchases();
      final localTransports = await db.getAllTransports();

      if (localPurchases.any((p) => p.isSynced)) {
        final resP = await _apiService.getData('/api/purchases');
        if (resP.statusCode == 200) {
          final remoteList = jsonDecode(resP.body);
          if (remoteList is List) {
            final remoteMap = <String, Map<String, dynamic>>{};
            for (final item in remoteList) {
              if (item is Map && item['id'] != null) {
                remoteMap[item['id'].toString()] = Map<String, dynamic>.from(item);
              }
            }
            for (final lp in localPurchases.where((p) => p.isSynced)) {
              final lookupId = lp.serverRecordId ?? lp.id;
              final remote = remoteMap[lookupId];
              if (remote != null) {
                final remoteStatus = remote['status']?.toString() ?? lp.status;
                final remoteTransportId = remote['transportRecordId']?.toString() ?? lp.transportRecordId;
                if (remoteStatus != lp.status || remoteTransportId != lp.transportRecordId) {
                  await db.insertPurchase(
                    PurchaseRecord(
                      id: lp.id,
                      serverRecordId: lp.serverRecordId ?? lookupId,
                      familyCode: lp.familyCode,
                      farmerName: lp.farmerName,
                      village: lp.village,
                      variety: lp.variety,
                      grade: lp.grade,
                      standardPrice: lp.standardPrice,
                      additionalPrice: lp.additionalPrice,
                      finalPrice: lp.finalPrice,
                      sackWeights: lp.sackWeights,
                      totalWeight: lp.totalWeight,
                      totalPayment: lp.totalPayment,
                      seedBorrowed: lp.seedBorrowed,
                      seedRepayment: lp.seedRepayment,
                      seedDeduction: lp.seedDeduction,
                      additionalPremium: lp.additionalPremium,
                      netPayment: lp.netPayment,
                      signatureFarmer: lp.signatureFarmer,
                      signatureStaff: lp.signatureStaff,
                      specsRecordId: lp.specsRecordId,
                      transportRecordId: remoteTransportId,
                      status: remoteStatus,
                      createdAt: lp.createdAt,
                      isSynced: true,
                      syncError: null,
                    ),
                  );
                }
              }
            }
          }
        }
      }

      if (localTransports.any((t) => t.isSynced)) {
        final resT = await _apiService.getData('/api/transport');
        if (resT.statusCode == 200) {
          final remoteList = jsonDecode(resT.body);
          if (remoteList is List) {
            final remoteMap = <String, Map<String, dynamic>>{};
            for (final item in remoteList) {
              if (item is Map && item['id'] != null) {
                remoteMap[item['id'].toString()] = Map<String, dynamic>.from(item);
              }
            }
            for (final lt in localTransports.where((t) => t.isSynced)) {
              final lookupId = lt.serverRecordId ?? lt.id;
              final remote = remoteMap[lookupId];
              if (remote != null) {
                final remoteStatus = remote['status']?.toString() ?? lt.status;
                if (remoteStatus != lt.status) {
                  await db.insertTransport(
                    TransportRecord(
                      id: lt.id,
                      serverRecordId: lt.serverRecordId ?? lookupId,
                      driverName: lt.driverName,
                      plateNumber: lt.plateNumber,
                      mobileNumber: lt.mobileNumber,
                      truckCleaned: lt.truckCleaned,
                      truckPhotoUrl: lt.truckPhotoUrl,
                      driverSignature: lt.driverSignature,
                      loadingLocation: lt.loadingLocation,
                      destinationWarehouse: lt.destinationWarehouse,
                      notes: lt.notes,
                      totalSacks: lt.totalSacks,
                      totalFieldWeight: lt.totalFieldWeight,
                      selectedPurchaseIds: lt.selectedPurchaseIds,
                      status: remoteStatus,
                      createdAt: lt.createdAt,
                      isSynced: true,
                      syncError: null,
                    ),
                  );
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Status reconciliation skipped/offline: $e');
    }
  }

  /// Downloads all Specs Records and Farmer Payment Information for the Field Team user's
  /// assigned site/provinces and merges them into local SQLite without duplicating records
  /// or overwriting unsynced local edits. Restricted strictly to Field Team (FIELD) accounts.
  Future<SharedDownloadResult> downloadSharedFieldRecords({Function(String status)? onProgress}) async {
    try {
      final userInfo = await AuthService.getUserInfo();
      final userRole = (userInfo['role'] ?? 'FIELD').toUpperCase();
      if (userRole != 'FIELD') {
        return SharedDownloadResult(specsCount: 0, farmersCount: 0);
      }

      final db = AppDatabase.instance;
      final userProvinces = await AuthService.getAssignedProvinceList();
      final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);
      final isUnrestricted = userProvinces.isEmpty ||
          userProvinces.length >= 4 ||
          userProvinces.any((p) => p.toLowerCase().trim() == 'all' || p.toLowerCase().trim() == 'na');
      final restrictByVillage = !isUnrestricted && allowedVillages.isNotEmpty;

      int specsCount = 0;
      int farmersCount = 0;
      bool hasError = false;

      // 1. Download & merge shared Specs Records
      if (onProgress != null) onProgress('Downloading shared site Specs Records...');
      try {
        final resSpecs = await _apiService.getData('/api/specs');
        if (resSpecs.statusCode == 200) {
          final remoteList = jsonDecode(resSpecs.body);
          if (remoteList is List) {
            final localSpecs = await db.getAllSpecs();
            final byServerId = <String, SpecsRecord>{};
            final byId = <String, SpecsRecord>{};
            final byComposite = <String, SpecsRecord>{};

            for (final s in localSpecs) {
              byId[s.id] = s;
              if (s.serverRecordId != null && s.serverRecordId!.isNotEmpty) {
                byServerId[s.serverRecordId!] = s;
              }
              final key =
                  '${s.familyCode.toUpperCase().trim()}|${s.village.trim()}|${s.paddyType.trim()}|${s.selectedGrade.trim()}';
              byComposite[key] = s;
            }

            final toUpsert = <SpecsRecord>[];
            for (final raw in remoteList) {
              if (raw is! Map) continue;
              final item = Map<String, dynamic>.from(raw);
              final remoteId = item['id']?.toString();
              if (remoteId == null || remoteId.isEmpty) continue;

              final familyCode = (item['familyCode']?.toString() ?? '').toUpperCase().trim();
              final farmerName = (item['farmerName']?.toString() ?? '').trim();
              final village = (item['village']?.toString() ?? '').trim();
              final paddyType = (item['paddyType']?.toString() ?? '').trim();
              final selectedGrade = (item['selectedGrade']?.toString() ?? '').trim();

              if (familyCode.isEmpty || paddyType.isEmpty || selectedGrade.isEmpty) continue;
              if (restrictByVillage && !allowedVillages.contains(village)) continue;

              final compositeKey = '$familyCode|$village|$paddyType|$selectedGrade';
              final localMatch = byServerId[remoteId] ?? byId[remoteId] ?? byComposite[compositeKey];

              // Never overwrite unsynced local offline creations/edits
              if (localMatch != null && !localMatch.isSynced) {
                continue;
              }

              final merged = SpecsRecord(
                id: localMatch?.id ?? remoteId,
                serverRecordId: remoteId,
                familyCode: familyCode,
                farmerName: farmerName,
                village: village,
                paddyType: paddyType,
                selectedGrade: selectedGrade,
                isOrganic: item['isOrganic'] == true || item['isOrganic'] == 1,
                moisture: (item['moisture'] as num?)?.toDouble() ?? 0.0,
                foreignMatter: (item['foreignMatter'] as num?)?.toDouble() ?? 0.0,
                wholeGrain: item['wholeGrain'] != null ? (item['wholeGrain'] as num).toDouble() : null,
                brokenRice: item['brokenRice'] != null ? (item['brokenRice'] as num).toDouble() : null,
                impurity: item['impurity'] != null ? (item['impurity'] as num).toDouble() : null,
                isValid: item['isValid'] == true || item['isValid'] == 1,
                basePrice: (item['basePrice'] as num?)?.toDouble() ?? 0.0,
                organicBonus: 0.0,
                finalPrice: (item['finalPrice'] as num?)?.toDouble() ?? 0.0,
                createdAt: DateTime.tryParse(item['createdAt']?.toString() ?? '') ?? DateTime.now(),
                isSynced: true,
                syncError: null,
              );

              toUpsert.add(merged);
              specsCount++;
            }

            if (toUpsert.isNotEmpty) {
              await db.upsertSpecsBatch(toUpsert);
            }
          }
        } else {
          hasError = true;
        }
      } catch (e) {
        hasError = true;
        debugPrint('Shared Specs download skipped/offline: $e');
      }

      // 2. Download & merge shared Farmer Payment Information
      if (onProgress != null) onProgress('Downloading shared site Farmer Profiles...');
      try {
        final resFarmers = await _apiService.getData('/api/farmers');
        if (resFarmers.statusCode == 200) {
          final remoteList = jsonDecode(resFarmers.body);
          if (remoteList is List) {
            final localFarmers = await db.getAllFarmers();
            final byServerId = <String, FarmerProfile>{};
            final byId = <String, FarmerProfile>{};
            final byComposite = <String, FarmerProfile>{};

            for (final f in localFarmers) {
              byId[f.id] = f;
              if (f.serverRecordId != null && f.serverRecordId!.isNotEmpty) {
                byServerId[f.serverRecordId!] = f;
              }
              final key = '${f.familyCode.toUpperCase().trim()}|${f.village.trim()}';
              byComposite[key] = f;
            }

            final toUpsert = <FarmerProfile>[];
            for (final raw in remoteList) {
              if (raw is! Map) continue;
              final item = Map<String, dynamic>.from(raw);
              final remoteId = item['id']?.toString();
              if (remoteId == null || remoteId.isEmpty) continue;

              final familyCode = (item['familyCode']?.toString() ?? '').toUpperCase().trim();
              final farmerName = (item['farmerName']?.toString() ?? '').trim();
              final village = (item['village']?.toString() ?? '').trim();

              if (familyCode.isEmpty || farmerName.isEmpty) continue;
              if (restrictByVillage && !allowedVillages.contains(village)) continue;

              final compositeKey = '$familyCode|$village';
              final localMatch = byServerId[remoteId] ?? byId[remoteId] ?? byComposite[compositeKey];

              // Never overwrite unsynced local offline creations/edits
              if (localMatch != null && !localMatch.isSynced) {
                continue;
              }

              final remoteDocUrl = item['bankDocumentUrl']?.toString();
              final merged = FarmerProfile(
                id: localMatch?.id ?? remoteId,
                serverRecordId: remoteId,
                familyCode: familyCode,
                farmerName: farmerName,
                village: village,
                phone: item['phone']?.toString(),
                paymentMethod: item['paymentMethod']?.toString() ?? 'Bank Transfer',
                bankName: item['bankName']?.toString(),
                accountNumber: item['accountNumber']?.toString(),
                accountHolder: item['accountHolder']?.toString(),
                relationship: item['relationship']?.toString() ?? 'Self',
                bankDocumentUrl: (remoteDocUrl != null && remoteDocUrl.isNotEmpty)
                    ? remoteDocUrl
                    : localMatch?.bankDocumentUrl,
                createdAt: DateTime.tryParse(item['createdAt']?.toString() ?? '') ?? DateTime.now(),
                isSynced: true,
                syncError: null,
              );

              toUpsert.add(merged);
              farmersCount++;
            }

            if (toUpsert.isNotEmpty) {
              await db.upsertFarmersBatch(toUpsert);
            }
          }
        } else {
          hasError = true;
        }
      } catch (e) {
        hasError = true;
        debugPrint('Shared Farmers download skipped/offline: $e');
      }

      return SharedDownloadResult(
        specsCount: specsCount,
        farmersCount: farmersCount,
        hasError: hasError,
      );
    } catch (e) {
      debugPrint('downloadSharedFieldRecords error: $e');
      return SharedDownloadResult(specsCount: 0, farmersCount: 0, hasError: true);
    }
  }
}
