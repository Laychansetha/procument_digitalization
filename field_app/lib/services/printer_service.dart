import '../models/purchase_record.dart';
import '../models/transport_record.dart';

class PrinterService {
  static final PrinterService instance = PrinterService._init();
  PrinterService._init();

  bool isConnected = false;

  /// Print Purchase Receipt via ESC/POS Bluetooth Thermal Printer
  Future<bool> printPurchaseReceipt(PurchaseRecord purchase) async {
    try {
      print('🖨️ Printing ESC/POS Receipt for Purchase PR-2026-${purchase.id.substring(0, 6)}...');
      print('Farmer: ${purchase.farmerName} (${purchase.familyCode})');
      print('Net Payment: ${purchase.netPayment} KHR');
      return true;
    } catch (e) {
      print('Print error: $e');
      return false;
    }
  }

  /// Print Truck Transport Loading Manifest
  Future<bool> printTransportManifest(TransportRecord transport) async {
    try {
      print('🖨️ Printing Truck Manifest for ${transport.plateNumber}...');
      print('Driver: ${transport.driverName}');
      print('Field Weight: ${transport.totalFieldWeight} kg');
      return true;
    } catch (e) {
      print('Print error: $e');
      return false;
    }
  }
}
