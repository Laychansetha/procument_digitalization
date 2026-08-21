import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:signature/signature.dart';
import 'package:uuid/uuid.dart';
import '../../config/app_config.dart';
import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/purchase_record.dart';
import '../../models/transport_record.dart';
import '../../services/auth_service.dart';
import '../../utils/app_notification.dart';
import '../../widgets/searchable_village_select.dart';

class TransportFormScreen extends StatefulWidget {
  const TransportFormScreen({super.key});

  @override
  State<TransportFormScreen> createState() => _TransportFormScreenState();
}

class _TransportFormScreenState extends State<TransportFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _driverNameController = TextEditingController();
  final _plateNumberController = TextEditingController();
  final _mobileNumberController = TextEditingController();
  final _notesController = TextEditingController();
  final _modalSearchController = TextEditingController();

  final SignatureController _driverSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: AppTheme.emeraldLight,
    exportBackgroundColor: Colors.transparent,
  );
  String? _existingDriverSignatureBase64;

  String? _editingId;
  String? _loadingLocation;
  String? _destinationWarehouse;
  String? _truckPhotoPath;
  bool _truckCleaned = true;

  List<PurchaseRecord> _availablePurchases = [];
  List<PurchaseRecord> _selectedPurchases = [];
  List<TransportRecord> _localHistory = [];

  @override
  void initState() {
    super.initState();
    _loadAvailablePurchases();
    _loadHistory();
    ConfigDao.instance.fetchRemoteConfig();
  }

  Future<void> _takeTruckPhoto() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppTheme.cardBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Attach Loaded Truck Photo',
                style: TextStyle(color: AppTheme.textWhite, fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please take a photo showing the fully loaded truck with license plate visible.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: AppTheme.skyBlue),
                title: const Text('Take Photo with Camera', style: TextStyle(color: AppTheme.textWhite, fontSize: 13, fontWeight: FontWeight.bold)),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: AppTheme.emeraldLight),
                title: const Text('Choose from Gallery', style: TextStyle(color: AppTheme.textWhite, fontSize: 13, fontWeight: FontWeight.bold)),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source != null) {
      final image = await picker.pickImage(source: source, imageQuality: 75);
      if (image != null) {
        setState(() {
          _truckPhotoPath = image.path;
        });
      }
    }
  }

  @override
  void dispose() {
    _driverNameController.dispose();
    _plateNumberController.dispose();
    _mobileNumberController.dispose();
    _notesController.dispose();
    _modalSearchController.dispose();
    _driverSignatureController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailablePurchases() async {
    final allPurchases = await AppDatabase.instance.getAllPurchases();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? allPurchases
        : allPurchases.where((p) => allowedVillages.contains(p.village)).toList();

    setState(() {
      _availablePurchases = filtered;
    });
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllTransports();
    setState(() {
      _localHistory = list;
    });
  }

  void _resetForm() {
    _driverNameController.clear();
    _plateNumberController.clear();
    _mobileNumberController.clear();
    _notesController.clear();
    _driverSignatureController.clear();

    setState(() {
      _editingId = null;
      _loadingLocation = null;
      _destinationWarehouse = null;
      _truckCleaned = true;
      _truckPhotoPath = null;
      _existingDriverSignatureBase64 = null;
      _selectedPurchases = [];
    });
  }

  void _openPurchaseSelectionModal() {
    _modalSearchController.clear();
    List<PurchaseRecord> tempSelected = List.from(_selectedPurchases);
    String modalQuery = '';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final Set<String> assignedPurchaseIds = {};
            for (var t in _localHistory) {
              if (t.id != _editingId) {
                assignedPurchaseIds.addAll(t.selectedPurchaseIds);
              }
            }

            final unassignedPurchases = _availablePurchases.where((p) {
              final isAssignedToOtherTruck = assignedPurchaseIds.contains(p.id);
              final isAssignedToThisRecord = (p.transportRecordId != null && p.transportRecordId!.isNotEmpty && p.transportRecordId != _editingId);
              return !isAssignedToOtherTruck && !isAssignedToThisRecord;
            }).toList();

            final filtered = unassignedPurchases.where((p) {
              if (modalQuery.isEmpty) return true;
              final q = modalQuery.toLowerCase();
              return p.familyCode.toLowerCase().contains(q) ||
                  p.farmerName.toLowerCase().contains(q) ||
                  p.village.toLowerCase().contains(q) ||
                  DateFormat('yyyy-MM-dd').format(p.createdAt).contains(q);
            }).toList();

            double totalWeightKg = tempSelected.fold(0.0, (sum, item) => sum + item.totalWeight);
            int totalSacks = tempSelected.fold(0, (sum, item) => sum + item.sackWeights.length);

            return Dialog(
              backgroundColor: AppTheme.cardBackground,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                width: double.maxFinite,
                constraints: const BoxConstraints(maxHeight: 650),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.inventory_2, color: AppTheme.skyBlue, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Select Paddy Purchase Records',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppTheme.textMuted),
                          onPressed: () => Navigator.pop(ctx),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: _modalSearchController,
                      decoration: InputDecoration(
                        hintText: 'Search by Family Code, Farmer Name, Village...',
                        prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted, size: 18),
                        suffixIcon: modalQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted),
                                onPressed: () {
                                  _modalSearchController.clear();
                                  setModalState(() => modalQuery = '');
                                },
                              )
                            : null,
                      ),
                      onChanged: (val) {
                        setModalState(() => modalQuery = val.trim());
                      },
                    ),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.inputBackground,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Selected: ${tempSelected.length} Records ($totalSacks Bags)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue)),
                          Text('Cargo Weight: ${totalWeightKg.toStringAsFixed(1)} kg', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    Expanded(
                      child: filtered.isEmpty
                          ? const Center(
                              child: Text('No available purchase records found matching search.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            )
                          : ListView.builder(
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final p = filtered[index];
                                final isChecked = tempSelected.any((element) => element.id == p.id);
                                final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(p.createdAt);

                                return Card(
                                  color: isChecked ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.inputBackground,
                                  margin: const EdgeInsets.only(bottom: 8),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    side: BorderSide(color: isChecked ? AppTheme.emeraldPrimary : Colors.transparent),
                                  ),
                                  child: CheckboxListTile(
                                    value: isChecked,
                                    activeColor: AppTheme.emeraldPrimary,
                                    checkColor: const Color(0xFF0B0F19),
                                    onChanged: (bool? checked) {
                                      setModalState(() {
                                        if (checked == true) {
                                          tempSelected.add(p);
                                        } else {
                                          tempSelected.removeWhere((element) => element.id == p.id);
                                        }
                                      });
                                    },
                                    title: Text(
                                      '${p.familyCode} · ${p.farmerName} (${p.village})',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isChecked ? AppTheme.emeraldLight : AppTheme.textWhite),
                                    ),
                                    subtitle: Text(
                                      'Variety: ${p.variety} (${p.grade}) · Weight: ${p.totalWeight} kg (${p.sackWeights.length} Sacks)\nDate: $dateStr',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Close', style: TextStyle(color: AppTheme.textMuted)),
                        ),
                        ElevatedButton.icon(
                          onPressed: tempSelected.isEmpty
                              ? null
                              : () {
                                  setState(() {
                                    _selectedPurchases = List.from(tempSelected);
                                  });
                                  Navigator.pop(ctx);
                                },
                          icon: const Icon(Icons.check_circle, size: 16, color: Color(0xFF0B0F19)),
                          label: Text(
                            'Confirm Selection (${tempSelected.length})',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: tempSelected.isEmpty ? Colors.grey : AppTheme.emeraldPrimary,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _saveTransport() async {
    final driver = _driverNameController.text.trim();
    final plate = _plateNumberController.text.trim();

    if (driver.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Driver Name is required! Please scroll up to enter Driver Name.'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    if (plate.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Truck Plate Number is required!'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    if (_loadingLocation == null || _destinationWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Please select Loading Location and Destination Warehouse.'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    if (_selectedPurchases.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Please tap "Load Purchase Invoices" to select cargo for this truck.'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    try {
      final totalFieldWeight = _selectedPurchases.fold(0.0, (sum, p) => sum + p.totalWeight);
      final totalSacks = _selectedPurchases.fold(0, (sum, p) => sum + p.sackWeights.length);

      String? driverSigBase64;
      if (_driverSignatureController.isNotEmpty) {
        final sigBytes = await _driverSignatureController.toPngBytes();
        if (sigBytes != null) {
          driverSigBase64 = 'data:image/png;base64,${base64Encode(sigBytes)}';
        }
      } else if (_existingDriverSignatureBase64 != null) {
        driverSigBase64 = _existingDriverSignatureBase64;
      }

      final record = TransportRecord(
        id: _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 4)}',
        driverName: driver,
        plateNumber: plate,
        mobileNumber: _mobileNumberController.text.trim(),
        truckCleaned: _truckCleaned,
        truckPhotoUrl: _truckPhotoPath,
        driverSignature: driverSigBase64,
        loadingLocation: _loadingLocation!,
        destinationWarehouse: _destinationWarehouse!,
        notes: _notesController.text.trim(),
        totalSacks: totalSacks,
        totalFieldWeight: totalFieldWeight,
        selectedPurchaseIds: _selectedPurchases.map((p) => p.id).toList(),
        createdAt: DateTime.now(),
        isSynced: false,
      );

      await AppDatabase.instance.insertTransport(record);

      if (mounted) {
        AppNotification.showSuccess(context, _editingId != null ? 'Updated' : 'Saved');
      }

      _resetForm();
      await _loadHistory();
    } catch (e) {
      if (mounted) {
        AppNotification.showError(context, 'Error saving manifest: $e');
      }
    }
  }

  void _editRecord(TransportRecord item) {
    if (item.status != 'EN_ROUTE' && item.status != 'REJECTED') {
      _showAlertDialog('Locked Manifest', 'Cannot edit Transport Record. This shipment has already been received at the warehouse.');
      return;
    }

    setState(() {
      _editingId = item.id;
      _driverNameController.text = item.driverName;
      _plateNumberController.text = item.plateNumber;
      _mobileNumberController.text = item.mobileNumber ?? '';
      _notesController.text = item.notes ?? '';
      _loadingLocation = item.loadingLocation;
      _destinationWarehouse = item.destinationWarehouse;
      _truckCleaned = item.truckCleaned;
      _truckPhotoPath = item.truckPhotoUrl;
      _existingDriverSignatureBase64 = item.driverSignature;
      _driverSignatureController.clear();
      _selectedPurchases = _availablePurchases.where((p) => item.selectedPurchaseIds.contains(p.id)).toList();
    });
  }

  Future<void> _deleteRecord(TransportRecord item) async {
    if (item.status != 'EN_ROUTE' && item.status != 'REJECTED') {
      _showAlertDialog('Locked Manifest', 'Cannot delete Transport Record. This shipment has already been received at the warehouse.');
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('Delete Manifest', style: TextStyle(color: AppTheme.textWhite)),
        content: Text('Are you sure you want to delete transport manifest for Truck ${item.plateNumber} (${item.driverName})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AppDatabase.instance.deleteTransport(item.id);
      await _loadHistory();
      if (mounted) {
        AppNotification.showSuccess(context, 'Deleted');
      }
    }
  }

  void _showManifestDetailsModal(TransportRecord item) {
    final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(item.createdAt);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Truck: ${item.plateNumber}', style: const TextStyle(color: AppTheme.skyBlue, fontWeight: FontWeight.bold, fontSize: 16)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: item.isSynced ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.amberGold.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: item.isSynced ? AppTheme.emeraldPrimary : AppTheme.amberGold),
              ),
              child: Text(
                item.isSynced ? '✓ Synced' : '⏳ Pending',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: item.isSynced ? AppTheme.emeraldLight : AppTheme.amberGold),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Driver Name: ${item.driverName}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Driver Mobile: ${item.mobileNumber ?? 'N/A'}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              Text('From: ${item.loadingLocation}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('To: ${item.destinationWarehouse}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Dispatched: $dateStr', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              const Divider(color: Colors.white24, height: 16),

              Text('Certified Clean: ${item.truckCleaned ? '✅ Cleaned & Inspected' : '⚠️ Not Cleaned'}', style: TextStyle(color: item.truckCleaned ? AppTheme.emeraldLight : AppTheme.amberGold, fontSize: 11, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text('Loaded Cargo Weight: ${item.totalFieldWeight} kg (${item.totalSacks} Bags)', style: const TextStyle(color: AppTheme.emeraldLight, fontSize: 13, fontWeight: FontWeight.bold)),
              Text('Purchase Invoices: ${item.selectedPurchaseIds.length} Records', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              if (item.truckPhotoUrl != null && item.truckPhotoUrl!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.inputBackground,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.skyBlue.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.camera_alt, color: AppTheme.skyBlue, size: 14),
                          SizedBox(width: 6),
                          Text('Loaded Truck Photo (Plate Visible)', style: TextStyle(color: AppTheme.skyBlue, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          height: 120,
                          width: double.infinity,
                          color: Colors.black26,
                          child: item.truckPhotoUrl!.startsWith('data:image/')
                              ? Image.memory(base64Decode(item.truckPhotoUrl!.split(',')[1]), fit: BoxFit.cover)
                              : item.truckPhotoUrl!.startsWith('http://') || item.truckPhotoUrl!.startsWith('https://') || item.truckPhotoUrl!.startsWith('/uploads/')
                                  ? Image.network(
                                      item.truckPhotoUrl!.startsWith('/uploads/') ? '${AppConfig.baseUrl}${item.truckPhotoUrl}' : item.truckPhotoUrl!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (ctx, _, __) => const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                                    )
                                  : !kIsWeb && File(item.truckPhotoUrl!).existsSync()
                                      ? Image.file(File(item.truckPhotoUrl!), fit: BoxFit.cover)
                                      : const Center(child: Icon(Icons.image, color: AppTheme.skyBlue, size: 32)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (item.driverSignature != null && item.driverSignature!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.inputBackground,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.draw, color: AppTheme.emeraldLight, size: 14),
                          SizedBox(width: 6),
                          Text('Driver Signature Acceptance', style: TextStyle(color: AppTheme.emeraldLight, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          height: 80,
                          width: double.infinity,
                          color: Colors.black26,
                          child: Image.memory(
                            base64Decode(item.driverSignature!.contains(',') ? item.driverSignature!.split(',')[1] : item.driverSignature!),
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const Divider(color: Colors.white24, height: 16),

              const Text('📦 LOADED PURCHASE INVOICES (ITEMIZED)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue)),
              const SizedBox(height: 8),

              FutureBuilder<List<PurchaseRecord>>(
                future: AppDatabase.instance.getPurchasesForTransport(item.id),
                builder: (context, snapshot) {
                  List<PurchaseRecord> records = snapshot.data ?? [];
                  if (records.isEmpty) {
                    records = _availablePurchases.where((p) => item.selectedPurchaseIds.contains(p.id)).toList();
                  }

                  if (records.isEmpty) {
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppTheme.inputBackground, borderRadius: BorderRadius.circular(8)),
                      child: Text('Selected Invoices: ${item.selectedPurchaseIds.length} IDs loaded.', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    );
                  }

                  final numberFormat = NumberFormat('#,###');

                  return Container(
                    constraints: const BoxConstraints(maxHeight: 220),
                    child: SingleChildScrollView(
                      child: Column(
                        children: records.map((p) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.inputBackground,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.receipt_long, color: AppTheme.emeraldLight, size: 16),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${p.farmerName} (${p.familyCode})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                                      Text('Village: ${p.village} · ${p.variety} (${p.grade})', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                      Text('Cargo: ${p.totalWeight} kg (${p.sackWeights.length} Bags) · Net: ${numberFormat.format(p.netPayment)} KHR', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
        actions: [
          if (!item.isSynced)
            TextButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _editRecord(item);
              },
              icon: const Icon(Icons.edit, size: 16, color: AppTheme.skyBlue),
              label: const Text('Edit', style: TextStyle(color: AppTheme.skyBlue)),
            ),
          if (!item.isSynced)
            TextButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _deleteRecord(item);
              },
              icon: const Icon(Icons.delete, size: 16, color: AppTheme.errorRed),
              label: const Text('Delete', style: TextStyle(color: AppTheme.errorRed)),
            ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emeraldPrimary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: Color(0xFF0B0F19), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showAlertDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: Text(title, style: const TextStyle(color: AppTheme.amberGold, fontWeight: FontWeight.bold)),
        content: Text(message, style: const TextStyle(color: AppTheme.textWhite)),
        actions: [ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalCargoWeight = _selectedPurchases.fold(0.0, (sum, p) => sum + p.totalWeight);
    final totalSacksCount = _selectedPurchases.fold(0, (sum, p) => sum + p.sackWeights.length);
    final destinationWarehouses = ConfigDao.instance.destinationWarehouses;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.cardBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: const [
                  BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_shipping, color: AppTheme.skyBlue, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            _editingId != null ? 'Edit Loading & Transport' : 'Loading and Transport',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                          ),
                        ],
                      ),
                      if (_editingId != null)
                        TextButton.icon(
                          onPressed: _resetForm,
                          icon: const Icon(Icons.cancel, size: 14, color: AppTheme.amberGold),
                          label: const Text('Cancel Edit', style: TextStyle(fontSize: 11, color: AppTheme.amberGold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Row 1: Loading Location & Destination Warehouse
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(
                                  child: SearchableVillageSelect(
                                    label: 'LOADING LOCATION *',
                                    hint: 'Select Loading Village...',
                                    value: _loadingLocation,
                                    onChanged: (val) => setState(() => _loadingLocation = val),
                                    validator: (v) => v == null || v.isEmpty ? 'Select Loading Village' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _destinationWarehouse,
                                    decoration: const InputDecoration(
                                      labelText: 'DESTINATION WAREHOUSE *',
                                      hintText: 'Select Destination Warehouse...',
                                      floatingLabelBehavior: FloatingLabelBehavior.always,
                                    ),
                                    hint: const Text('Select Destination Warehouse...', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    items: destinationWarehouses
                                        .map((wh) => DropdownMenuItem(value: wh, child: Text(wh, style: const TextStyle(fontSize: 12))))
                                        .toList(),
                                    validator: (v) => v == null ? 'Select Destination Warehouse' : null,
                                    onChanged: (val) => setState(() => _destinationWarehouse = val),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                SearchableVillageSelect(
                                  label: 'LOADING LOCATION *',
                                  hint: 'Select Loading Location...',
                                  value: _loadingLocation,
                                  onChanged: (val) => setState(() => _loadingLocation = val),
                                  validator: (v) => v == null || v.isEmpty ? 'Select Loading Location' : null,
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _destinationWarehouse,
                                  decoration: const InputDecoration(
                                    labelText: 'DESTINATION WAREHOUSE *',
                                    hintText: 'Select Destination Warehouse',
                                    floatingLabelBehavior: FloatingLabelBehavior.always,
                                  ),
                                  hint: const Text('Select Destination Warehouse', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  items: destinationWarehouses
                                      .map((wh) => DropdownMenuItem(value: wh, child: Text(wh, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  validator: (v) => v == null ? 'Select Destination Warehouse' : null,
                                  onChanged: (val) => setState(() => _destinationWarehouse = val),
                                ),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Row 2: Driver Name, License Plate, Mobile
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _driverNameController,
                                    decoration: const InputDecoration(labelText: 'DRIVER NAME *', hintText: 'e.g. Heng Sok'),
                                    validator: (v) => v == null || v.trim().isEmpty ? 'Enter Driver Name' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _plateNumberController,
                                    decoration: const InputDecoration(labelText: 'TRUCK PLATE NUMBER *', hintText: 'e.g. 3A-1234'),
                                    validator: (v) => v == null || v.trim().isEmpty ? 'Enter Plate Number' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _mobileNumberController,
                                    decoration: const InputDecoration(labelText: 'DRIVER MOBILE NUMBER', hintText: '012 999 888'),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                TextFormField(
                                  controller: _driverNameController,
                                  decoration: const InputDecoration(labelText: 'DRIVER NAME *', hintText: 'e.g. Heng Sok'),
                                  validator: (v) => v == null || v.trim().isEmpty ? 'Enter Driver Name' : null,
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _plateNumberController,
                                  decoration: const InputDecoration(labelText: 'TRUCK PLATE NUMBER *', hintText: 'e.g. 3A-1234'),
                                  validator: (v) => v == null || v.trim().isEmpty ? 'Enter Plate Number' : null,
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _mobileNumberController,
                                  decoration: const InputDecoration(labelText: 'DRIVER MOBILE NUMBER', hintText: '012 999 888'),
                                ),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Compact Truck Cleaning Checkbox
                  InkWell(
                    onTap: () => setState(() => _truckCleaned = !_truckCleaned),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _truckCleaned,
                              activeColor: AppTheme.emeraldPrimary,
                              checkColor: const Color(0xFF0B0F19),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              onChanged: (val) => setState(() => _truckCleaned = val ?? true),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Truck Cleaning & Inspection Completed',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // STEP 1: LOAD PURCHASE RECORDS ONTO TRUCK
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.skyBlue.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.inventory_2, color: AppTheme.skyBlue, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'LOAD PURCHASE RECORDS ONTO TRUCK',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                                ),
                              ],
                            ),
                            ElevatedButton.icon(
                              onPressed: _openPurchaseSelectionModal,
                              icon: const Icon(Icons.add_shopping_cart, size: 16, color: Color(0xFF0B0F19)),
                              label: Text(
                                _selectedPurchases.isEmpty ? 'Load Purchase Invoices' : 'Edit Selection (${_selectedPurchases.length})',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.skyBlue,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        if (_selectedPurchases.isEmpty)
                          const Text('No purchase records selected yet. Tap the button above to search and select loaded cargo.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted))
                        else ...[
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 12,
                            runSpacing: 4,
                            children: [
                              Text('Loaded Farmers: ${_selectedPurchases.length} Records ($totalSacksCount Bags)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue)),
                              Text('Total Field Cargo: ${totalCargoWeight.toStringAsFixed(1)} kg', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: _selectedPurchases.map((p) {
                              return Chip(
                                backgroundColor: AppTheme.emeraldPrimary.withOpacity(0.2),
                                side: const BorderSide(color: AppTheme.emeraldPrimary),
                                label: Text('${p.familyCode} (${p.totalWeight}kg)', style: const TextStyle(fontSize: 10, color: AppTheme.emeraldLight)),
                                onDeleted: () {
                                  setState(() {
                                    _selectedPurchases.removeWhere((item) => item.id == p.id);
                                  });
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // STEP 2 & 3: LOADED TRUCK PHOTO (LEFT) & DRIVER SIGNATURE (RIGHT)
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;

                      final truckPhotoWidget = Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.inputBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.camera_alt, color: AppTheme.skyBlue, size: 15),
                                    SizedBox(width: 6),
                                    Text(
                                      'LOADED TRUCK PHOTO *',
                                      style: TextStyle(color: AppTheme.textWhite, fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ],
                                ),
                                if (_truckPhotoPath != null)
                                  InkWell(
                                    onTap: _takeTruckPhoto,
                                    child: const Text('Retake', style: TextStyle(fontSize: 10, color: AppTheme.skyBlue, fontWeight: FontWeight.bold)),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            if (_truckPhotoPath != null && _truckPhotoPath!.isNotEmpty)
                              Stack(
                                alignment: Alignment.topRight,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      height: 75,
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: Colors.black26,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppTheme.skyBlue.withOpacity(0.3)),
                                      ),
                                      child: _truckPhotoPath!.startsWith('data:image/')
                                          ? Image.memory(
                                              base64Decode(_truckPhotoPath!.split(',')[1]),
                                              fit: BoxFit.cover,
                                            )
                                          : _truckPhotoPath!.startsWith('http://') || _truckPhotoPath!.startsWith('https://') || _truckPhotoPath!.startsWith('/uploads/')
                                              ? Image.network(
                                                  _truckPhotoPath!.startsWith('/uploads/')
                                                      ? '${AppConfig.baseUrl}$_truckPhotoPath'
                                                      : _truckPhotoPath!,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (ctx, _, __) => const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                                                )
                                              : !kIsWeb && File(_truckPhotoPath!).existsSync()
                                                  ? Image.file(
                                                      File(_truckPhotoPath!),
                                                      fit: BoxFit.cover,
                                                    )
                                                  : const Center(child: Icon(Icons.image, color: AppTheme.skyBlue, size: 30)),
                                    ),
                                  ),
                                  IconButton(
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: const CircleAvatar(
                                      radius: 10,
                                      backgroundColor: AppTheme.errorRed,
                                      child: Icon(Icons.close, size: 12, color: Colors.white),
                                    ),
                                    onPressed: () => setState(() => _truckPhotoPath = null),
                                  ),
                                ],
                              )
                            else
                              InkWell(
                                onTap: _takeTruckPhoto,
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  height: 75,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: AppTheme.cardBackground,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.skyBlue.withOpacity(0.4)),
                                  ),
                                  child: const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.add_a_photo, color: AppTheme.skyBlue, size: 20),
                                      SizedBox(height: 4),
                                      Text(
                                        'Attach Truck Photo',
                                        style: TextStyle(color: AppTheme.skyBlue, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );

                      final driverSignatureWidget = Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.inputBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.draw, color: AppTheme.emeraldLight, size: 15),
                                    SizedBox(width: 6),
                                    Text(
                                      'DRIVER SIGNATURE',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                                    ),
                                  ],
                                ),
                                InkWell(
                                  onTap: () {
                                    _driverSignatureController.clear();
                                    setState(() {
                                      _existingDriverSignatureBase64 = null;
                                    });
                                  },
                                  child: const Text('Clear', style: TextStyle(fontSize: 10, color: AppTheme.amberGold, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Container(
                              height: 75,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Stack(
                                  children: [
                                    Signature(
                                      controller: _driverSignatureController,
                                      height: 75,
                                      backgroundColor: Colors.transparent,
                                    ),
                                    if (_existingDriverSignatureBase64 != null &&
                                        _existingDriverSignatureBase64!.isNotEmpty &&
                                        _driverSignatureController.isEmpty)
                                      Positioned.fill(
                                        child: Container(
                                          color: const Color(0xFF0F172A),
                                          padding: const EdgeInsets.all(6),
                                          child: Image.memory(
                                            base64Decode(_existingDriverSignatureBase64!.contains(',')
                                                ? _existingDriverSignatureBase64!.split(',')[1]
                                                : _existingDriverSignatureBase64!),
                                            fit: BoxFit.contain,
                                          ),
                                        ),
                                      ),
                                    if (_existingDriverSignatureBase64 == null && _driverSignatureController.isEmpty)
                                      const Center(
                                        child: Text(
                                          'Sign with finger / stylus',
                                          style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontStyle: FontStyle.italic),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );

                      return isDesktop
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: truckPhotoWidget),
                                const SizedBox(width: 12),
                                Expanded(child: driverSignatureWidget),
                              ],
                            )
                          : Column(
                              children: [
                                truckPhotoWidget,
                                const SizedBox(height: 12),
                                driverSignatureWidget,
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 20),

                  // STEP 4: SAVE / UPDATE TRANSPORT RECORD
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saveTransport,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _editingId != null ? AppTheme.emeraldPrimary : AppTheme.skyBlue,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _editingId != null ? 'Update Transport Record' : 'Save Transport Record',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Dispatched Truck History', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                Text('${_localHistory.length} Manifests', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
            const SizedBox(height: 12),

            _localHistory.isEmpty
                ? Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppTheme.cardBackground, borderRadius: BorderRadius.circular(12)),
                    child: const Center(
                      child: Text('No transport truck manifests recorded yet.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _localHistory.length,
                    itemBuilder: (context, index) {
                      final item = _localHistory[index];
                      final isLocked = item.status != 'EN_ROUTE' && item.status != 'REJECTED';
                      return Card(
                        color: AppTheme.cardBackground,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          onTap: () => _showManifestDetailsModal(item),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  'Truck: ${item.plateNumber} · Driver: ${item.driverName}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.skyBlue, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: item.isSynced ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.amberGold.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: item.isSynced ? AppTheme.emeraldPrimary : AppTheme.amberGold),
                                ),
                                child: Text(
                                  item.isSynced ? '✓ Synced' : '⏳ Offline',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: item.isSynced ? AppTheme.emeraldLight : AppTheme.amberGold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text('From: ${item.loadingLocation} → To: ${item.destinationWarehouse}\nCargo: ${item.totalFieldWeight} kg (${item.totalSacks} Bags)', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          trailing: Icon(
                            isLocked ? Icons.lock_outline : Icons.chevron_right,
                            color: isLocked ? AppTheme.textMuted : AppTheme.skyBlue,
                            size: 18,
                          ),
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }
}
