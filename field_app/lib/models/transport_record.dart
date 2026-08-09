import 'dart:convert';

class TransportRecord {
  final String id;
  final String? serverRecordId;
  final String driverName;
  final String plateNumber;
  final String? mobileNumber;
  final bool truckCleaned;
  final String loadingLocation;
  final String destinationWarehouse;
  final String? notes;
  final int totalSacks;
  final double totalFieldWeight;
  final List<String> selectedPurchaseIds;
  final String status;
  final DateTime createdAt;
  final bool isSynced;
  final String? syncError;

  TransportRecord({
    required this.id,
    this.serverRecordId,
    required this.driverName,
    required this.plateNumber,
    this.mobileNumber,
    this.truckCleaned = true,
    this.loadingLocation = 'Chhaeb Buying Station',
    this.destinationWarehouse = 'Central Mill Warehouse, Preah Vihear',
    this.notes,
    required this.totalSacks,
    required this.totalFieldWeight,
    required this.selectedPurchaseIds,
    this.status = 'EN_ROUTE',
    required this.createdAt,
    this.isSynced = false,
    this.syncError,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'serverRecordId': serverRecordId,
      'driverName': driverName,
      'plateNumber': plateNumber,
      'mobileNumber': mobileNumber,
      'truckCleaned': truckCleaned ? 1 : 0,
      'loadingLocation': loadingLocation,
      'destinationWarehouse': destinationWarehouse,
      'notes': notes,
      'totalSacks': totalSacks,
      'totalFieldWeight': totalFieldWeight,
      'selectedPurchaseIdsJson': jsonEncode(selectedPurchaseIds),
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
      'syncError': syncError,
    };
  }

  factory TransportRecord.fromMap(Map<String, dynamic> map) {
    List<String> ids = [];
    if (map['selectedPurchaseIdsJson'] != null) {
      final decoded = jsonDecode(map['selectedPurchaseIdsJson']);
      if (decoded is List) {
        ids = decoded.map((e) => e.toString()).toList();
      }
    }

    return TransportRecord(
      id: map['id'],
      serverRecordId: map['serverRecordId'],
      driverName: map['driverName'],
      plateNumber: map['plateNumber'],
      mobileNumber: map['mobileNumber'],
      truckCleaned: map['truckCleaned'] == 1 || map['truckCleaned'] == true,
      loadingLocation: map['loadingLocation'] ?? 'Chhaeb Buying Station',
      destinationWarehouse: map['destinationWarehouse'] ?? 'Central Mill Warehouse',
      notes: map['notes'],
      totalSacks: map['totalSacks'] ?? 0,
      totalFieldWeight: (map['totalFieldWeight'] as num).toDouble(),
      selectedPurchaseIds: ids,
      status: map['status'] ?? 'EN_ROUTE',
      createdAt: DateTime.parse(map['createdAt']),
      isSynced: map['isSynced'] == 1 || map['isSynced'] == true,
      syncError: map['syncError'],
    );
  }

  Map<String, dynamic> toPostJson() {
    return {
      'driverName': driverName,
      'plateNumber': plateNumber,
      'mobileNumber': mobileNumber ?? '',
      'truckCleaned': truckCleaned,
      'loadingLocation': loadingLocation,
      'destinationWarehouse': destinationWarehouse,
      'notes': notes ?? '',
      'selectedPurchaseIds': selectedPurchaseIds,
    };
  }
}
