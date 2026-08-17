import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../database/app_database.dart';
import '../models/specs_record.dart';
import '../models/farmer_profile.dart';
import '../models/purchase_record.dart';
import '../models/transport_record.dart';
import 'api_service.dart';

class SyncResult {
  final int syncedCount;
  final int errorCount;
  final String message;

  SyncResult({required this.syncedCount, required this.errorCount, required this.message});
}

class SyncService {
  final ApiService _apiService = ApiService();

  /// Execute sequential background/manual sync with central PostgreSQL server
  Future<SyncResult> syncAllOfflineRecords({Function(String status)? onProgress}) async {
    int syncedCount = 0;
    int errorCount = 0;

    final db = AppDatabase.instance;

    // 1. SYNC SPECS RECORDS
    final specsList = await db.getAllSpecs();
    final unsyncedSpecs = specsList.where((s) => !s.isSynced).toList();

    for (var spec in unsyncedSpecs) {
      if (onProgress != null) onProgress('Syncing Specs for ${spec.familyCode} (${spec.village})...');
      try {
        final res = await _apiService.postData('/api/specs', spec.toPostJson());
        if (res.statusCode == 200 || res.statusCode == 201) {
          final data = jsonDecode(res.body);
          final updated = SpecsRecord(
            id: spec.id,
            serverRecordId: data['id'],
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
            isValid: spec.isValid,
            basePrice: spec.basePrice,
            organicBonus: spec.organicBonus,
            finalPrice: spec.finalPrice,
            createdAt: spec.createdAt,
            isSynced: true,
          );
          await db.insertSpecs(updated);
          syncedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
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
            } else if (farmer.bankDocumentUrl!.startsWith('data:image/') || farmer.bankDocumentUrl!.startsWith('/uploads/')) {
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
          final updated = FarmerProfile(
            id: farmer.id,
            serverRecordId: data['id'],
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
          );
          await db.insertFarmer(updated);
          syncedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
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
        final payload = purchase.toPostJson();
        if (purchase.specsRecordId != null && specsServerMap.containsKey(purchase.specsRecordId)) {
          payload['specsRecordId'] = specsServerMap[purchase.specsRecordId];
        }

        final res = await _apiService.postData('/api/purchases', payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          final data = jsonDecode(res.body);
          final updated = PurchaseRecord(
            id: purchase.id,
            serverRecordId: data['id'],
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
          );
          await db.insertPurchase(updated);
          syncedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    // 4. SYNC TRANSPORT DISPATCHES
    final updatedPurchases = await db.getAllPurchases();
    final purchaseServerMap = <String, String>{};
    for (var p in updatedPurchases) {
      if (p.serverRecordId != null && p.serverRecordId!.isNotEmpty) {
        purchaseServerMap[p.id] = p.serverRecordId!;
      }
    }

    final transportList = await db.getAllTransports();
    final unsyncedTransport = transportList.where((t) => !t.isSynced).toList();

    for (var transport in unsyncedTransport) {
      if (onProgress != null) onProgress('Syncing Transport Dispatch for ${transport.plateNumber}...');
      try {
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
            } else if (transport.truckPhotoUrl!.startsWith('data:image/') || transport.truckPhotoUrl!.startsWith('/uploads/') || transport.truckPhotoUrl!.startsWith('http')) {
              remotePhotoUrl = transport.truckPhotoUrl;
            }
          } catch (e) {
            debugPrint('Error preparing truck photo for upload: $e');
          }
        }

        final payload = transport.toPostJson(uploadedPhotoUrl: remotePhotoUrl);
        final resolvedIds = transport.selectedPurchaseIds.map((id) => purchaseServerMap[id] ?? id).toList();
        payload['selectedPurchaseIds'] = resolvedIds;

        final res = await _apiService.postData('/api/transport', payload);
        if (res.statusCode == 200 || res.statusCode == 201) {
          final data = jsonDecode(res.body);
          final updated = TransportRecord(
            id: transport.id,
            serverRecordId: data['id'],
            driverName: transport.driverName,
            plateNumber: transport.plateNumber,
            mobileNumber: transport.mobileNumber,
            truckCleaned: transport.truckCleaned,
            truckPhotoUrl: remotePhotoUrl ?? transport.truckPhotoUrl,
            driverSignature: transport.driverSignature,
            loadingLocation: transport.loadingLocation,
            destinationWarehouse: transport.destinationWarehouse,
            notes: transport.notes,
            totalSacks: transport.totalSacks,
            totalFieldWeight: transport.totalFieldWeight,
            selectedPurchaseIds: resolvedIds,
            status: transport.status,
            createdAt: transport.createdAt,
            isSynced: true,
          );
          await db.insertTransport(updated);
          syncedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    return SyncResult(
      syncedCount: syncedCount,
      errorCount: errorCount,
      message: syncedCount > 0
          ? 'Successfully synchronized $syncedCount record(s) with central PostgreSQL server.'
          : (errorCount > 0 ? 'Sync completed with $errorCount warning(s).' : 'All records are up to date!'),
    );
  }
}
