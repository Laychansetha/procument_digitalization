import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:signature/signature.dart';

import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/purchase_record.dart';
import '../../models/specs_record.dart';
import '../../services/auth_service.dart';
import '../../utils/app_notification.dart';
import '../../widgets/searchable_village_select.dart';

class PurchaseFormScreen extends StatefulWidget {
  const PurchaseFormScreen({super.key});

  @override
  State<PurchaseFormScreen> createState() => _PurchaseFormScreenState();
}

class _PurchaseFormScreenState extends State<PurchaseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _familyCodeController = TextEditingController();
  final _farmerNameController = TextEditingController();
  final _sacksInputController = TextEditingController();
  final _seedBorrowedController = TextEditingController();
  final _premiumAmountController = TextEditingController();
  final _searchController = TextEditingController();
  final _modalSearchController = TextEditingController();

  final SignatureController _farmerSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.white,
    exportBackgroundColor: Colors.transparent,
  );

  String? _editingId;
  String? _selectedVillage;
  String? _selectedVariety;
  String? _selectedGrade;
  double _standardPrice = 0.0;
  String? _existingFarmerSignatureBase64;

  List<double> _sackWeights = [];
  List<PurchaseRecord> _localHistory = [];
  List<SpecsRecord> _availableSpecs = [];
  SpecsRecord? _selectedLoadedSpecs;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _seedBorrowedController.text = '0';
    _premiumAmountController.text = '0';
    _loadAvailableSpecs();
    _loadHistory();
    ConfigDao.instance.fetchRemoteConfig();
  }

  @override
  void dispose() {
    _familyCodeController.dispose();
    _farmerNameController.dispose();
    _sacksInputController.dispose();
    _seedBorrowedController.dispose();
    _premiumAmountController.dispose();
    _searchController.dispose();
    _modalSearchController.dispose();
    _farmerSignatureController.dispose();
    super.dispose();
  }

  Future<void> _loadAvailableSpecs() async {
    final list = await AppDatabase.instance.getAllSpecs();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? list
        : list.where((s) => allowedVillages.contains(s.village)).toList();

    setState(() {
      _availableSpecs = filtered;
    });
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllPurchases();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? list
        : list.where((p) => allowedVillages.contains(p.village)).toList();

    setState(() {
      _localHistory = filtered;
    });
  }

  void _resetForm() {
    _familyCodeController.clear();
    _farmerNameController.clear();
    _sacksInputController.clear();
    _seedBorrowedController.text = '0';
    _premiumAmountController.text = '0';
    _farmerSignatureController.clear();
    setState(() {
      _editingId = null;
      _selectedVillage = null;
      _selectedVariety = null;
      _selectedGrade = null;
      _sackWeights = [];
      _selectedLoadedSpecs = null;
      _standardPrice = 0.0;
      _existingFarmerSignatureBase64 = null;
    });
  }

  void _parseSackWeights(String input) {
    if (input.trim().isEmpty) {
      setState(() {
        _sackWeights = [];
      });
      return;
    }

    final tokens = input.replaceAll(',', ' ').split(RegExp(r'\s+'));
    final List<double> weights = [];
    for (var t in tokens) {
      final clean = t.replaceAll(RegExp(r'[^0-9]'), '');
      if (clean.isNotEmpty) {
        // Enforce integer only and maximum 3 digits per sack (e.g. 1 - 999 kg)
        final max3Digits = clean.length > 3 ? clean.substring(0, 3) : clean;
        final parsed = double.tryParse(max3Digits);
        if (parsed != null && parsed > 0 && parsed <= 999) {
          weights.add(parsed);
        }
      }
    }

    setState(() {
      _sackWeights = weights;
    });
  }

  void _updatePaddyPrice() {
    if (_selectedVariety == null || _selectedGrade == null) return;
    final paddySpecs = ConfigDao.instance.paddySpecs;
    final found = paddySpecs.firstWhere(
      (ps) => ps['variety'] == _selectedVariety && ps['grade'] == _selectedGrade,
      orElse: () => {'basePrice': 1650.0},
    );

    double base = (found['basePrice'] as num?)?.toDouble() ?? 1650.0;

    setState(() {
      _standardPrice = base;
    });
  }

  PurchaseRecord? _getExistingPurchaseForSpecs(SpecsRecord spec) {
    for (var p in _localHistory) {
      if (_editingId != null && p.id == _editingId) continue;
      if (p.specsRecordId != null && p.specsRecordId == spec.id) return p;
      if (spec.serverRecordId != null && p.specsRecordId == spec.serverRecordId) return p;
    }
    return null;
  }

  Future<bool> _confirmSpecsReuse(SpecsRecord spec, PurchaseRecord existingPurchase) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppTheme.cardBackground,
            title: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: AppTheme.amberGold, size: 22),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Specs Record Already Used',
                    style: TextStyle(color: AppTheme.textWhite, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            content: Text(
              'This Specs Record (${spec.paddyType} ${spec.selectedGrade} for ${spec.farmerName}) has already been used for purchase record "${existingPurchase.id}".\n\nDo you want to use it again?',
              style: const TextStyle(color: AppTheme.textWhite, fontSize: 13),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.amberGold),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Use Again', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _searchAndLoadSpecs() async {
    _openSpecsSelectionModal(initialQuery: _familyCodeController.text.trim());
  }

  void _openSpecsSelectionModal({String initialQuery = ''}) {
    _modalSearchController.text = initialQuery;
    String modalQuery = initialQuery.trim();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = _availableSpecs.where((s) {
              if (modalQuery.isEmpty) return true;
              final q = modalQuery.toLowerCase();
              return s.familyCode.toLowerCase().contains(q) ||
                  s.farmerName.toLowerCase().contains(q) ||
                  s.village.toLowerCase().contains(q);
            }).toList();

            return Dialog(
              backgroundColor: AppTheme.cardBackground,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                width: double.maxFinite,
                constraints: const BoxConstraints(maxHeight: 600),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.analytics, color: AppTheme.skyBlue, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Select Quality Specs Record',
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

                    Expanded(
                      child: filtered.isEmpty
                          ? const Center(
                              child: Text('No Quality Specs records found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            )
                          : ListView.builder(
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final s = filtered[index];
                                final existingPurchase = _getExistingPurchaseForSpecs(s);
                                final isAlreadyPurchased = existingPurchase != null;

                                return Card(
                                  color: AppTheme.inputBackground,
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    title: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${s.familyCode} · ${s.farmerName} (${s.village})',
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.skyBlue),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        if (isAlreadyPurchased)
                                          Container(
                                            margin: const EdgeInsets.only(left: 6),
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.amberGold.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: AppTheme.amberGold),
                                            ),
                                            child: const Text(
                                              '⚠️ Already Purchased',
                                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.amberGold),
                                            ),
                                          ),
                                      ],
                                    ),
                                    subtitle: Text(
                                      'Variety: ${s.paddyType} (${s.selectedGrade}) · Moisture: ${s.moisture}%\nBase Price: ${s.finalPrice.toInt()} KHR/kg${isAlreadyPurchased ? '\nUsed in Purchase: ${existingPurchase.id}' : ''}',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                    ),
                                    trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.emeraldPrimary),
                                    onTap: () async {
                                      if (isAlreadyPurchased) {
                                        final confirm = await _confirmSpecsReuse(s, existingPurchase);
                                        if (!confirm) return;
                                      }
                                      setState(() {
                                        _selectedLoadedSpecs = s;
                                        _familyCodeController.text = s.familyCode;
                                        _farmerNameController.text = s.farmerName;
                                        _selectedVillage = s.village;
                                        _selectedVariety = s.paddyType;
                                        _selectedGrade = s.selectedGrade;
                                        _standardPrice = s.finalPrice;
                                      });
                                      if (ctx.mounted) Navigator.pop(ctx);
                                    },
                                  ),
                                );
                              },
                            ),
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

  Future<void> _savePurchaseRecord() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedVillage == null || _selectedVariety == null || _selectedGrade == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ Please select Village, Paddy Category, and Grade.'), backgroundColor: AppTheme.amberGold, duration: Duration(seconds: 3)),
      );
      return;
    }

    if (_sackWeights.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter individual sack weights (kg).'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }

    final code = _familyCodeController.text.trim().toUpperCase();
    final name = _farmerNameController.text.trim();
    final addPremiumPerKg = double.tryParse(_premiumAmountController.text) ?? 0.0;
    final finalPricePerKg = _standardPrice + addPremiumPerKg;
    final totalWeight = _sackWeights.fold(0.0, (a, b) => a + b);
    final grossValue = totalWeight * finalPricePerKg;
    final seedBorrowedKg = double.tryParse(_seedBorrowedController.text) ?? 0.0;
    final returnedSeedKg = seedBorrowedKg * ConfigDao.instance.seedInterestRate;
    final seedDeduction = returnedSeedKg * finalPricePerKg;
    final netPayment = (grossValue - seedDeduction).clamp(0.0, double.infinity);

    String? farmerSigBase64;
    if (_farmerSignatureController.isNotEmpty) {
      final sigBytes = await _farmerSignatureController.toPngBytes();
      if (sigBytes != null) {
        farmerSigBase64 = base64Encode(sigBytes);
      }
    } else if (_existingFarmerSignatureBase64 != null) {
      farmerSigBase64 = _existingFarmerSignatureBase64;
    }

    final record = PurchaseRecord(
      id: _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_$code',
      familyCode: code,
      farmerName: name,
      village: _selectedVillage!,
      variety: _selectedVariety!,
      grade: _selectedGrade!,
      standardPrice: _standardPrice,
      additionalPrice: addPremiumPerKg,
      finalPrice: finalPricePerKg,
      sackWeights: _sackWeights,
      totalWeight: totalWeight,
      totalPayment: grossValue,
      seedBorrowed: seedBorrowedKg,
      seedRepayment: returnedSeedKg,
      seedDeduction: seedDeduction,
      additionalPremium: addPremiumPerKg,
      netPayment: netPayment,
      signatureFarmer: farmerSigBase64,
      specsRecordId: _selectedLoadedSpecs?.id,
      createdAt: DateTime.now(),
      isSynced: false,
    );

    await AppDatabase.instance.insertPurchase(record);

    if (mounted) {
      AppNotification.showSuccess(context, _editingId != null ? 'Updated' : 'Saved');
    }

    _resetForm();
    await _loadHistory();
  }

  void _editRecord(PurchaseRecord item) {
    if (item.status != 'PENDING' || item.transportRecordId != null) {
      _showAlertDialog('Locked Record', 'Cannot edit Purchase Record. This record has already been assigned to transport or dispatched.');
      return;
    }

    setState(() {
      _editingId = item.id;
      _familyCodeController.text = item.familyCode;
      _farmerNameController.text = item.farmerName;
      _selectedVillage = item.village;
      _selectedVariety = item.variety;
      _selectedGrade = item.grade;
      _standardPrice = item.standardPrice;
      _sackWeights = List.from(item.sackWeights);
      _sacksInputController.text = item.sackWeights.map((w) => w.round().toInt().toString()).join(' ');
      _seedBorrowedController.text = item.seedBorrowed.round().toInt().toString();
      _premiumAmountController.text = item.additionalPremium.round().toInt().toString();
      _existingFarmerSignatureBase64 = item.signatureFarmer;
      _farmerSignatureController.clear();
    });
  }

  Future<void> _deleteRecord(PurchaseRecord item) async {
    if (item.status != 'PENDING' || item.transportRecordId != null) {
      _showAlertDialog('Locked Record', 'Cannot delete Purchase Record. This record has already been assigned to transport or dispatched.');
      return;
    }

    // Step 1 Confirmation
    final step1 = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('⚠️ Step 1 of 2: Delete Purchase Record', style: TextStyle(color: AppTheme.amberGold, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete purchase record for ${item.familyCode} (${item.farmerName})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.amberGold),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Proceed to Step 2', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (step1 != true) return;

    // Step 2 Confirmation
    final step2 = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('🚨 Step 2 of 2: Confirm Permanent Deletion', style: TextStyle(color: AppTheme.errorRed, fontSize: 16, fontWeight: FontWeight.bold)),
        content: const Text('This action CANNOT be undone. Are you absolutely certain you want to permanently delete this purchase record?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Permanently Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (step2 == true) {
      await AppDatabase.instance.deletePurchase(item.id);
      await _loadHistory();
      if (mounted) {
        AppNotification.showSuccess(context, 'Purchase Record Deleted');
      }
    }
  }

  void _showRecordDetailsModal(PurchaseRecord item) {
    final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(item.createdAt);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('${item.familyCode} · ${item.farmerName}', style: const TextStyle(color: AppTheme.emeraldLight, fontWeight: FontWeight.bold, fontSize: 16)),
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
              Text('Village: ${item.village}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Category: ${item.variety} (${item.grade})', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Date & Time: $dateStr', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              const Divider(color: Colors.white24, height: 16),

              Text('Sacks Count: ${item.sackWeights.length} Bags', style: const TextStyle(color: AppTheme.skyBlue, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Sack Weights: [ ${item.sackWeights.join(', ')} ] kg', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              Text('Total Weight: ${item.totalWeight} kg', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),

              Text('Base Price: ${item.standardPrice.toInt()} KHR/kg${item.additionalPremium > 0 ? ' (+${item.additionalPremium.toInt()} Premium)' : ''}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
              Text('Final Price: ${item.finalPrice.toInt()} KHR/kg', style: const TextStyle(color: AppTheme.skyBlue, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Gross Value: ${item.totalPayment.toInt()} KHR', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              if (item.seedDeduction > 0)
                Text('Seed Deduction: -${item.seedDeduction.toInt()} KHR (${item.seedRepayment.toStringAsFixed(1)} kg)', style: const TextStyle(color: AppTheme.errorRed, fontSize: 12)),
              const SizedBox(height: 8),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldPrimary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('NET PAYMENT:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                    Text('${item.netPayment.toInt()} KHR', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                  ],
                ),
              ),

              if (item.signatureFarmer != null && item.signatureFarmer!.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Farmer Signature:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const SizedBox(height: 4),
                Container(
                  height: 60,
                  width: double.infinity,
                  decoration: BoxDecoration(color: AppTheme.inputBackground, borderRadius: BorderRadius.circular(8)),
                  child: Image.memory(base64Decode(item.signatureFarmer!), fit: BoxFit.contain),
                ),
              ],
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
    final varieties = ConfigDao.instance.paddyCategories;
    final grades = ConfigDao.instance.grades;

    final addPremiumPerKg = double.tryParse(_premiumAmountController.text) ?? 0.0;
    final finalPricePerKg = _standardPrice + addPremiumPerKg;
    final totalWeight = _sackWeights.isEmpty ? 0.0 : _sackWeights.fold(0.0, (a, b) => a + b);
    final grossValue = totalWeight * finalPricePerKg;
    final seedBorrowedKg = double.tryParse(_seedBorrowedController.text) ?? 0.0;
    final returnedSeedKg = seedBorrowedKg * ConfigDao.instance.seedInterestRate;
    final seedDeduction = returnedSeedKg * finalPricePerKg;
    final netPayment = (grossValue - seedDeduction).clamp(0.0, double.infinity);

    final filteredHistory = _localHistory.where((item) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return item.familyCode.toLowerCase().contains(q) ||
          item.farmerName.toLowerCase().contains(q) ||
          item.village.toLowerCase().contains(q);
    }).toList();

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
                  OrientationBuilder(
                    builder: (context, orientation) {
                      bool isLandscape = orientation == Orientation.landscape;

                      if (isLandscape) {
                        return Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.scale, color: AppTheme.amberGold, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  _editingId != null ? 'Edit Weighing & Purchase Invoice' : 'Weighing & Purchase Invoice',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                ElevatedButton.icon(
                                  onPressed: _searchAndLoadSpecs,
                                  icon: const Icon(Icons.flash_on, size: 16, color: Color(0xFF0B0F19)),
                                  label: const Text('Load Quality Specs', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.amberGold,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                ),
                                if (_editingId != null) ...[
                                  const SizedBox(width: 8),
                                  TextButton.icon(
                                    onPressed: _resetForm,
                                    icon: const Icon(Icons.cancel, size: 14, color: AppTheme.amberGold),
                                    label: const Text('Cancel Edit', style: TextStyle(fontSize: 11, color: AppTheme.amberGold)),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        );
                      } else {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.scale, color: AppTheme.amberGold, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      _editingId != null ? 'Edit Weighing & Purchase Invoice' : 'Weighing & Purchase Invoice',
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
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: _searchAndLoadSpecs,
                              icon: const Icon(Icons.flash_on, size: 16, color: Color(0xFF0B0F19)),
                              label: const Text('Load Quality Specs', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.amberGold,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ],
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 16),

                  if (_selectedLoadedSpecs != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.emeraldPrimary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, color: AppTheme.emeraldLight, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Linked Quality Specs: ${_selectedLoadedSpecs!.paddyType} (${_selectedLoadedSpecs!.selectedGrade}) · Moisture: ${_selectedLoadedSpecs!.moisture}% · Base Price: ${_selectedLoadedSpecs!.finalPrice.toInt()} KHR/kg',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Inputs: Family Code & Farmer Name
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _familyCodeController,
                                    decoration: const InputDecoration(labelText: 'FAMILY CODE *', hintText: 'e.g. FC001'),
                                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _farmerNameController,
                                    decoration: const InputDecoration(labelText: 'FARMER NAME *', hintText: 'e.g. Heng Sok'),
                                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                TextFormField(
                                  controller: _familyCodeController,
                                  decoration: const InputDecoration(labelText: 'FAMILY CODE *', hintText: 'e.g. FC001'),
                                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _farmerNameController,
                                  decoration: const InputDecoration(labelText: 'FARMER NAME *', hintText: 'e.g. Heng Sok'),
                                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                                ),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 12),

                  // Dropdowns: Village, Paddy Variety, Grade
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(
                                  child: SearchableVillageSelect(
                                    value: _selectedVillage,
                                    onChanged: (val) {
                                      if (val != null) setState(() => _selectedVillage = val);
                                    },
                                    validator: (v) => v == null || v.isEmpty ? 'Select Village' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedVariety,
                                    decoration: const InputDecoration(
                                      labelText: 'PADDY CATEGORY *', 
                                      hintText: 'Select Paddy Category',
                                      floatingLabelBehavior: FloatingLabelBehavior.always,
                                    ),
                                    hint: const Text('Select Paddy Category', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    items: varieties
                                        .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                        .toList(),
                                    validator: (v) => v == null ? 'Select Paddy Category' : null,
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() => _selectedVariety = val);
                                        _updatePaddyPrice();
                                      }
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedGrade,
                                    decoration: const InputDecoration(
                                      labelText: 'GRADE *', 
                                      hintText: 'Select Grade',
                                      floatingLabelBehavior: FloatingLabelBehavior.always,
                                    ),
                                    hint: const Text('Select Grade', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                    items: grades
                                        .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 12))))
                                        .toList(),
                                    validator: (v) => v == null ? 'Select Grade' : null,
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() => _selectedGrade = val);
                                        _updatePaddyPrice();
                                      }
                                    },
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                SearchableVillageSelect(
                                  value: _selectedVillage,
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedVillage = val);
                                  },
                                  validator: (v) => v == null || v.isEmpty ? 'Select Village' : null,
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _selectedVariety,
                                  decoration: const InputDecoration(labelText: 'PADDY CATEGORY *', hintText: 'Select Paddy Category'),
                                  hint: const Text('Select Paddy Category', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  items: varieties
                                      .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  validator: (v) => v == null ? 'Select Paddy Category' : null,
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedVariety = val;
                                        final availableGrades = ConfigDao.instance.getGradesForCategory(val);
                                        if (_selectedGrade != null && !availableGrades.contains(_selectedGrade)) {
                                          _selectedGrade = null;
                                        }
                                        _updatePaddyPrice();
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: ConfigDao.instance.getGradesForCategory(_selectedVariety).contains(_selectedGrade) ? _selectedGrade : null,
                                  decoration: const InputDecoration(labelText: 'GRADE *', hintText: 'Select Grade'),
                                  hint: Text(_selectedVariety == null ? 'Select Category First' : 'Select Grade', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                  items: ConfigDao.instance.getGradesForCategory(_selectedVariety)
                                      .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  validator: (v) => v == null ? 'Select Grade' : null,
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _selectedGrade = val);
                                      _updatePaddyPrice();
                                    }
                                  },
                                ),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _sacksInputController,
                    keyboardType: TextInputType.number,
                    maxLines: null,
                    minLines: 1,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9\s,]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'INDIVIDUAL SACK WEIGHTS (KG) *',
                      hintText: 'e.g. 90 85 92 88 or 90,85,92,88',
                    ),
                    onChanged: _parseSackWeights,
                    validator: (v) => _sackWeights.isEmpty ? 'Enter sack weights separated by spaces or commas' : null,
                  ),
                  if (_sackWeights.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: List.generate(_sackWeights.length, (idx) {
                        final w = _sackWeights[idx].round();
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldPrimary.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.3)),
                                ),
                                child: Text(
                                  '#${idx + 1}',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '$w kg',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ],
                          ),
                        );
                      }),
                    ),
                  ],
                  const SizedBox(height: 12),

                  // Summary Banner
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Sacks Count: ${_sackWeights.length} Bags', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.skyBlue)),
                        Text('Total Weight: ${totalWeight.round()} kg', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Seed Borrowed & Premium
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _seedBorrowedController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                      LengthLimitingTextInputFormatter(3),
                                    ],
                                    decoration: const InputDecoration(labelText: 'SEED BORROWED (KG)', hintText: '0'),
                                    onChanged: (v) => setState(() {}),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _premiumAmountController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                      LengthLimitingTextInputFormatter(3),
                                    ],
                                    decoration: const InputDecoration(labelText: 'ADDITIONAL PREMIUM (KHR/KG)', hintText: '0'),
                                    onChanged: (v) => setState(() {}),
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                TextFormField(
                                  controller: _seedBorrowedController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(3),
                                  ],
                                  decoration: const InputDecoration(labelText: 'SEED BORROWED (KG)', hintText: '0'),
                                  onChanged: (v) => setState(() {}),
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _premiumAmountController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(3),
                                  ],
                                  decoration: const InputDecoration(labelText: 'ADDITIONAL PREMIUM (KHR/KG)', hintText: '0'),
                                  onChanged: (v) => setState(() {}),
                                ),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Fully Responsive Net Payment Calculation Card (Fits Phones & Tablets without Overflow)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldPrimary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          spacing: 12,
                          runSpacing: 4,
                          children: [
                            Text(
                              'Base Price: ${_standardPrice.toInt()} KHR/kg${addPremiumPerKg > 0 ? ' + ${addPremiumPerKg.toInt()} Premium' : ''}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                            Text(
                              'Final Price: ${finalPricePerKg.toInt()} KHR/kg',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          spacing: 12,
                          runSpacing: 4,
                          children: [
                            Text(
                              'Gross Value (${totalWeight.toStringAsFixed(1)} kg × ${finalPricePerKg.toInt()} KHR):',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                            Text(
                              '${grossValue.toInt()} KHR',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                            ),
                          ],
                        ),
                        if (seedBorrowedKg > 0) ...[
                          const SizedBox(height: 6),
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            spacing: 12,
                            runSpacing: 4,
                            children: [
                              Text(
                                'Seed Deduction (${returnedSeedKg.toStringAsFixed(1)} kg × ${finalPricePerKg.toInt()} KHR):',
                                style: const TextStyle(fontSize: 11, color: AppTheme.errorRed),
                              ),
                              Text(
                                '-${seedDeduction.toInt()} KHR',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.errorRed),
                              ),
                            ],
                          ),
                        ],
                        const Divider(color: Colors.white24, height: 16),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            children: [
                              const Text('NET PAYMENT TO FARMER: ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                              Text('${netPayment.toInt()} KHR', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Signature Pad
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('✍️ Farmer Electronic Touch Signature', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                      TextButton(
                        onPressed: () {
                          _farmerSignatureController.clear();
                          setState(() {
                            _existingFarmerSignatureBase64 = null;
                          });
                        },
                        child: const Text('Clear Signature', style: TextStyle(fontSize: 11, color: AppTheme.amberGold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Container(
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        children: [
                          Signature(
                            controller: _farmerSignatureController,
                            height: 100,
                            backgroundColor: Colors.transparent,
                          ),
                          if (_existingFarmerSignatureBase64 != null && _existingFarmerSignatureBase64!.isNotEmpty && _farmerSignatureController.isEmpty)
                            Positioned.fill(
                              child: Container(
                                color: AppTheme.inputBackground,
                                padding: const EdgeInsets.all(8),
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Image.memory(
                                      base64Decode(_existingFarmerSignatureBase64!),
                                      fit: BoxFit.contain,
                                      errorBuilder: (_, __, ___) => const Center(
                                        child: Text('Saved Signature', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                                      ),
                                    ),
                                    Positioned(
                                      top: 4,
                                      right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.emeraldPrimary.withOpacity(0.9),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          '✓ Preserved',
                                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Save Button Always Fully Visible
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _savePurchaseRecord,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _editingId != null ? AppTheme.emeraldPrimary : AppTheme.amberGold,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _editingId != null ? 'Update Purchase Record' : 'Save Purchase Record',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // History Section Header & Search Field
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Saved Purchase Receipts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                Text('${filteredHistory.length} of ${_localHistory.length} Receipts', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
            const SizedBox(height: 8),

            // Search Bar for Saved Purchase Receipts
            TextFormField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by Farmer, Family Code, Invoice ID, or Date...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.skyBlue, size: 18),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppTheme.textMuted, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              style: const TextStyle(fontSize: 12, color: AppTheme.textWhite),
              onChanged: (val) {
                setState(() => _searchQuery = val.trim());
              },
            ),
            const SizedBox(height: 12),

            filteredHistory.isEmpty
                ? Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppTheme.cardBackground, borderRadius: BorderRadius.circular(12)),
                    child: const Center(
                      child: Text('No matching purchase records found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredHistory.length,
                    itemBuilder: (context, index) {
                      final item = filteredHistory[index];
                      final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(item.createdAt);
                      final isLocked = item.status != 'PENDING' || item.transportRecordId != null;

                      return Card(
                        color: AppTheme.cardBackground,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          onTap: () => _showRecordDetailsModal(item),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${item.familyCode} · ${item.farmerName} (${item.village})',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.emeraldLight, fontSize: 13),
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
                          subtitle: Text('Weight: ${item.totalWeight} kg · Net Payment: ${item.netPayment.toInt()} KHR\nDate: $dateStr', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
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
