import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/purchase_record.dart';
import '../../models/transport_record.dart';

class TransportFormScreen extends StatefulWidget {
  const TransportFormScreen({Key? key}) : super(key: key);

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

  String? _editingId;
  String? _loadingLocation;
  String? _destinationWarehouse;
  bool _truckCleaned = false;

  List<PurchaseRecord> _availablePurchases = [];
  List<PurchaseRecord> _selectedPurchases = [];
  List<TransportRecord> _localHistory = [];

  @override
  void initState() {
    super.initState();
    _loadAvailablePurchases();
    _loadHistory();
    ConfigDao.instance.fetchRemoteConfig();
    
    // Auto-select defaults
    final stations = ConfigDao.instance.buyingStations;
    final warehouses = ConfigDao.instance.destinationWarehouses;
    if (stations.isNotEmpty) _loadingLocation = stations.first;
    if (warehouses.isNotEmpty) _destinationWarehouse = warehouses.first;
  }

  @override
  void dispose() {
    _driverNameController.dispose();
    _plateNumberController.dispose();
    _mobileNumberController.dispose();
    _notesController.dispose();
    _modalSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailablePurchases() async {
    final allPurchases = await AppDatabase.instance.getAllPurchases();
    setState(() {
      _availablePurchases = allPurchases;
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
    final stations = ConfigDao.instance.buyingStations;
    final warehouses = ConfigDao.instance.destinationWarehouses;

    setState(() {
      _editingId = null;
      _loadingLocation = stations.isNotEmpty ? stations.first : null;
      _destinationWarehouse = warehouses.isNotEmpty ? warehouses.first : null;
      _truckCleaned = false;
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
            final filtered = _availablePurchases.where((p) {
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.inventory_2, color: AppTheme.skyBlue, size: 22),
                            SizedBox(width: 8),
                            Text(
                              'Select Paddy Purchase Records',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppTheme.textMuted),
                          onPressed: () => Navigator.pop(ctx),
                          tooltip: 'Close Modal',
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

    final stations = ConfigDao.instance.buyingStations;
    final warehouses = ConfigDao.instance.destinationWarehouses;
    _loadingLocation ??= stations.isNotEmpty ? stations.first : 'Chhaeb Buying Station';
    _destinationWarehouse ??= warehouses.isNotEmpty ? warehouses.first : 'Central Mill Warehouse, Preah Vihear';

    if (_selectedPurchases.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Please tap "Load Purchase Invoices" to select cargo for this truck.'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    try {
      final totalFieldWeight = _selectedPurchases.fold(0.0, (sum, p) => sum + p.totalWeight);
      final totalSacks = _selectedPurchases.fold(0, (sum, p) => sum + p.sackWeights.length);

      final record = TransportRecord(
        id: _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 4)}',
        driverName: driver,
        plateNumber: plate,
        mobileNumber: _mobileNumberController.text.trim(),
        truckCleaned: _truckCleaned,
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_editingId != null ? '✅ Transport Dispatch Manifest updated!' : '✅ Transport Dispatch Manifest saved locally!'),
            backgroundColor: AppTheme.emeraldPrimary,
            duration: const Duration(seconds: 3),
          ),
        );
      }

      _resetForm();
      await _loadHistory();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Error saving manifest: $e'), backgroundColor: AppTheme.errorRed),
        );
      }
    }
  }

  void _editRecord(TransportRecord item) {
    if (item.isSynced) {
      _showAlertDialog('Locked Manifest', 'This dispatch manifest has already been synchronized with the central PostgreSQL server and cannot be edited locally.');
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
      _selectedPurchases = _availablePurchases.where((p) => item.selectedPurchaseIds.contains(p.id)).toList();
    });
  }

  Future<void> _deleteRecord(TransportRecord item) async {
    if (item.isSynced) {
      _showAlertDialog('Locked Manifest', 'Synchronized transport manifests cannot be deleted locally.');
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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transport manifest deleted.')));
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
    final buyingStations = ConfigDao.instance.buyingStations;
    final destinationWarehouses = ConfigDao.instance.destinationWarehouses;

    if (_loadingLocation == null && buyingStations.isNotEmpty) {
      _loadingLocation = buyingStations.first;
    }
    if (_destinationWarehouse == null && destinationWarehouses.isNotEmpty) {
      _destinationWarehouse = destinationWarehouses.first;
    }

    final totalCargoWeight = _selectedPurchases.fold(0.0, (sum, p) => sum + p.totalWeight);
    final totalSacksCount = _selectedPurchases.fold(0, (sum, p) => sum + p.sackWeights.length);

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
                            _editingId != null ? 'Edit Truck Transport Dispatch' : 'Transport Truck Dispatch & Loading',
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
                                  child: DropdownButtonFormField<String>(
                                    value: _loadingLocation,
                                    decoration: const InputDecoration(labelText: 'LOADING LOCATION *', hintText: 'Select Station'),
                                    items: buyingStations
                                        .map((loc) => DropdownMenuItem(value: loc, child: Text(loc, style: const TextStyle(fontSize: 12))))
                                        .toList(),
                                    validator: (v) => v == null ? 'Select Loading Location' : null,
                                    onChanged: (val) => setState(() => _loadingLocation = val),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _destinationWarehouse,
                                    decoration: const InputDecoration(labelText: 'DESTINATION WAREHOUSE *', hintText: 'Select Warehouse'),
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
                                DropdownButtonFormField<String>(
                                  value: _loadingLocation,
                                  decoration: const InputDecoration(labelText: 'LOADING LOCATION *', hintText: 'Select Station'),
                                  items: buyingStations
                                      .map((loc) => DropdownMenuItem(value: loc, child: Text(loc, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  validator: (v) => v == null ? 'Select Loading Location' : null,
                                  onChanged: (val) => setState(() => _loadingLocation = val),
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _destinationWarehouse,
                                  decoration: const InputDecoration(labelText: 'DESTINATION WAREHOUSE *', hintText: 'Select Warehouse'),
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

                  // Truck Cleanliness Certification
                  SwitchListTile(
                    title: const Text('Truck Cleanliness & Tarpaulin Certified Clean', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight)),
                    value: _truckCleaned,
                    activeColor: AppTheme.emeraldPrimary,
                    onChanged: (val) => setState(() => _truckCleaned = val),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 16),

                  // Modal Purchase Picker Button Area (Responsive Wrap to Prevent Overflow)
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
                            const Text('LOAD PURCHASE RECORDS ONTO TRUCK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                            ElevatedButton.icon(
                              onPressed: _openPurchaseSelectionModal,
                              icon: const Icon(Icons.inventory_2, size: 16, color: Color(0xFF0B0F19)),
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
                  const SizedBox(height: 20),

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
                        _editingId != null ? 'Update Transport Manifest' : 'Save Transport Manifest',
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
                      return Card(
                        color: AppTheme.cardBackground,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          onTap: () => _showManifestDetailsModal(item),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Truck: ${item.plateNumber} · Driver: ${item.driverName}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.skyBlue, fontSize: 13)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: item.isSynced ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.amberGold.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: item.isSynced ? AppTheme.emeraldPrimary : AppTheme.amberGold),
                                ),
                                child: Text(
                                  item.isSynced ? '✓ Synced' : '⏳ Pending',
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
                            item.isSynced ? Icons.lock_outline : Icons.chevron_right,
                            color: item.isSynced ? AppTheme.textMuted : AppTheme.skyBlue,
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
