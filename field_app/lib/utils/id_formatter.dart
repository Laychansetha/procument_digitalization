import '../models/purchase_record.dart';
import '../models/transport_record.dart';

/// Standardized System Identifier & Warehouse Formatter
/// Matches Web App (`src/lib/purchase-id.ts`, `src/lib/transport-id.ts`, `src/lib/warehouse-config.ts`)
class IdFormatter {
  /// Generates Purchase ID in `FamilyCode_DDMMYY_24H` format (e.g. `TB010_261026_10`)
  static String generatePurchaseId(String familyCode, [DateTime? date]) {
    final d = date ?? DateTime.now();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final year = (d.year % 100).toString().padLeft(2, '0');
    final hour = d.hour.toString().padLeft(2, '0');

    final cleanCode = familyCode
        .trim()
        .toUpperCase()
        .replaceAll(RegExp(r'[^A-Z0-9-]'), '');

    return '${cleanCode.isEmpty ? 'PURCHASE' : cleanCode}_$day$month${year}_$hour';
  }

  /// Generates unique local Purchase ID avoiding collisions with existing records
  static String generateUniquePurchaseId(
    String familyCode,
    Iterable<PurchaseRecord> existingRecords, [
    DateTime? date,
  ]) {
    final baseId = generatePurchaseId(familyCode, date);
    final existingIds = existingRecords
        .expand((r) => [r.id, if (r.serverRecordId != null) r.serverRecordId!])
        .toSet();

    if (!existingIds.contains(baseId)) {
      return baseId;
    }

    int counter = 2;
    while (existingIds.contains('${baseId}_$counter')) {
      counter++;
    }
    return '${baseId}_$counter';
  }

  /// Formats PurchaseRecord ID for display (`TB010_261026_10`)
  static String formatPurchaseId(PurchaseRecord p) {
    if (p.serverRecordId != null &&
        p.serverRecordId!.isNotEmpty &&
        !p.serverRecordId!.startsWith('offline_')) {
      return p.serverRecordId!;
    }
    if (p.id.isNotEmpty &&
        p.id.contains('_') &&
        !p.id.startsWith('offline_')) {
      return p.id;
    }
    return generatePurchaseId(p.familyCode, p.createdAt);
  }

  /// Generates Transport ID in `PlateNumber_DDMMYY` format (e.g. `3A-8899_261026`)
  static String generateTransportId(String plateNumber, [DateTime? date]) {
    final d = date ?? DateTime.now();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final year = (d.year % 100).toString().padLeft(2, '0');

    final cleanPlate = plateNumber
        .trim()
        .toUpperCase()
        .replaceAll(RegExp(r'\s*-\s*'), '-')
        .replaceAll(RegExp(r'\s+'), '-');

    return '${cleanPlate.isEmpty ? 'TRUCK' : cleanPlate}_$day$month$year';
  }

  /// Generates unique local Transport ID avoiding collisions with existing records
  static String generateUniqueTransportId(
    String plateNumber,
    Iterable<TransportRecord> existingRecords, [
    DateTime? date,
  ]) {
    final baseId = generateTransportId(plateNumber, date);
    final existingIds = existingRecords
        .expand((r) => [r.id, if (r.serverRecordId != null) r.serverRecordId!])
        .toSet();

    if (!existingIds.contains(baseId)) {
      return baseId;
    }

    int counter = 2;
    while (existingIds.contains('${baseId}_$counter')) {
      counter++;
    }
    return '${baseId}_$counter';
  }

  /// Formats TransportRecord ID for display (`3A-8899_261026`)
  static String formatTransportId(TransportRecord t) {
    if (t.serverRecordId != null &&
        t.serverRecordId!.isNotEmpty &&
        !t.serverRecordId!.startsWith('offline_')) {
      return t.serverRecordId!;
    }
    if (t.id.isNotEmpty &&
        t.id.contains('_') &&
        !t.id.startsWith('offline_')) {
      return t.id;
    }
    return generateTransportId(t.plateNumber, t.createdAt);
  }
}

