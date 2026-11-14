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
import '../../utils/id_formatter.dart';

class PurchaseFormScreen extends StatefulWidget {
  const PurchaseFormScreen({super.key});

  @override
  State<PurchaseFormScreen> createState() => _PurchaseFormScreenState();
}

class _PurchaseFormScreenState extends State<PurchaseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _familyCodeController = TextEditingController();
  final _farmerNameController = TextEditingController();
  final _sacksCountController = TextEditingController();
  final _quantityKgController = TextEditingController();
  final _seedBorrowedController = TextEditingController();
  final _premiumAmountController = TextEditingController();
  final _seedBorrowedFocusNode = FocusNode();
  final _premiumFocusNode = FocusNode();
  final _searchController = TextEditingController();
  final _modalSearchController = TextEditingController();

  final SignatureController _farmerSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.white,
    exportBackgroundColor: Colors.transparent,
  );

  String? _editingId;
  DateTime? _editingCreatedAt;
  String? _editingServerRecordId;
  String? _selectedVillage;
  String? _selectedVariety;
  String? _selectedGrade;
  double _standardPrice = 0.0;
  String? _existingFarmerSignatureBase64;

  List<PurchaseRecord> _localHistory = [];
  List<SpecsRecord> _availableSpecs = [];
  SpecsRecord? _selectedLoadedSpecs;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _seedBorrowedController.text = '0';
    _premiumAmountController.text = '0';
    _seedBorrowedFocusNode.addListener(_onSeedBorrowedFocusChange);
    _premiumFocusNode.addListener(_onPremiumFocusChange);
    _loadAvailableSpecs();
    _loadHistory();
    ConfigDao.instance.fetchRemoteConfig();
    AppDatabase.instance.dbChangeNotifier.addListener(_onDbChanged);
    ConfigDao.instance.configChangeNotifier.addListener(_onConfigChanged);
  }

  void _onSeedBorrowedFocusChange() {
    if (_seedBorrowedFocusNode.hasFocus) {
      if (_seedBorrowedController.text.trim() == '0') {
        _seedBorrowedController.clear();
      }
    } else {
      if (_seedBorrowedController.text.trim().isEmpty) {
        _seedBorrowedController.text = '0';
        if (mounted) setState(() {});
      }
    }
  }

  void _onPremiumFocusChange() {
    if (_premiumFocusNode.hasFocus) {
      if (_premiumAmountController.text.trim() == '0') {
        _premiumAmountController.clear();
      }
    } else {
      if (_premiumAmountController.text.trim().isEmpty) {
        _premiumAmountController.text = '0';
        if (mounted) setState(() {});
      }
    }
  }

  void _onDbChanged() {
    if (mounted) {
      _loadAvailableSpecs();
      _loadHistory();
    }
  }

  void _onConfigChanged() {
    if (mounted) {
      _loadAvailableSpecs();
      _loadHistory();
    }
  }

  @override
  void dispose() {
    AppDatabase.instance.dbChangeNotifier.removeListener(_onDbChanged);
    ConfigDao.instance.configChangeNotifier.removeListener(_onConfigChanged);
    _familyCodeController.dispose();
    _farmerNameController.dispose();
    _sacksCountController.dispose();
    _quantityKgController.dispose();
    _seedBorrowedFocusNode.removeListener(_onSeedBorrowedFocusChange);
    _premiumFocusNode.removeListener(_onPremiumFocusChange);
    _seedBorrowedFocusNode.dispose();
    _premiumFocusNode.dispose();
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

    if (mounted) {
      setState(() {
        _availableSpecs = filtered;
      });
    }
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllPurchases();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? list
        : list.where((p) => allowedVillages.contains(p.village)).toList();

    if (mounted) {
      setState(() {
        _localHistory = filtered;
      });
    }
  }

  void _resetForm() {
    _familyCodeController.clear();
    _farmerNameController.clear();
    _sacksCountController.clear();
    _quantityKgController.clear();
    _seedBorrowedController.text = '0';
    _premiumAmountController.text = '0';
    _farmerSignatureController.clear();
    setState(() {
      _editingId = null;
      _editingCreatedAt = null;
      _editingServerRecordId = null;
      _selectedVillage = null;
      _selectedVariety = null;
      _selectedGrade = null;
      _selectedLoadedSpecs = null;
      _standardPrice = 0.0;
      _existingFarmerSignatureBase64 = null;
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
    final formattedId = IdFormatter.formatPurchaseId(existingPurchase);
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
              'This Specs Record (${spec.paddyType} ${spec.selectedGrade} for ${spec.farmerName}) has already been used for purchase record "$formattedId".\n\nDo you want to use it again?',
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
                constraints: const BoxConstraints(maxWidth: 680, maxHeight: 620),
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
                                      'Variety: ${s.paddyType} (${s.selectedGrade}) · Moisture: ${s.moisture}% · Impurity: ${s.impurity}%\nBase Price: ${s.finalPrice.toInt()} KHR/kg${isAlreadyPurchased ? '\nUsed in Purchase: ${IdFormatter.formatPurchaseId(existingPurchase)}' : ''}',
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
    if (_seedBorrowedController.text.trim().isEmpty) {
      _seedBorrowedController.text = '0';
    }
    if (_premiumAmountController.text.trim().isEmpty) {
      _premiumAmountController.text = '0';
    }

    if ((_editingId == null && _selectedLoadedSpecs == null) ||
        _selectedVillage == null ||
        _selectedVariety == null ||
        _selectedGrade == null ||
        _familyCodeController.text.trim().isEmpty ||
        _farmerNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please tap "Load Quality Specs" to select a farmer\'s approved specs record first.'),
          backgroundColor: AppTheme.amberGold,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final sacksCount = int.tryParse(_sacksCountController.text.trim()) ?? 0;
    final totalWeight = double.tryParse(_quantityKgController.text.trim()) ?? 0.0;

    if (sacksCount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Number of Sacks.'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }

    if (totalWeight <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Quantity (Kg).'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }

    final code = _familyCodeController.text.trim().toUpperCase();
    final name = _farmerNameController.text.trim();
    final addPremiumPerKg = double.tryParse(_premiumAmountController.text) ?? 0.0;
    final finalPricePerKg = _standardPrice + addPremiumPerKg;
    final grossValue = (totalWeight * finalPricePerKg).roundToDouble();
    final seedBorrowedKg = double.tryParse(_seedBorrowedController.text) ?? 0.0;
    final returnedSeedKg = seedBorrowedKg * ConfigDao.instance.seedInterestRate;
    final seedDeduction = (returnedSeedKg * finalPricePerKg).roundToDouble();
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

    final isEditing = _editingId != null;
    final now = DateTime.now();
    final recordId = isEditing
        ? _editingId!
        : IdFormatter.generateUniquePurchaseId(code, _localHistory, now);

    final record = PurchaseRecord(
      id: recordId,
      familyCode: code,
      farmerName: name,
      village: _selectedVillage!,
      variety: _selectedVariety!,
      grade: _selectedGrade!,
      standardPrice: _standardPrice,
      additionalPrice: addPremiumPerKg,
      finalPrice: finalPricePerKg,
      sacks: sacksCount,
      totalWeight: totalWeight,
      totalPayment: grossValue,
      seedBorrowed: seedBorrowedKg,
      seedRepayment: returnedSeedKg,
      seedDeduction: seedDeduction,
      additionalPremium: addPremiumPerKg,
      netPayment: netPayment,
      signatureFarmer: farmerSigBase64,
      specsRecordId: _selectedLoadedSpecs?.id,
      createdAt: _editingCreatedAt ?? now,
      isSynced: false,
      serverRecordId: _editingServerRecordId,
    );

    await AppDatabase.instance.insertPurchase(record);

    if (mounted) {
      AppNotification.showSuccess(context, isEditing ? 'Purchase Record Updated' : 'Purchase Record Saved ($recordId)');
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
      _editingCreatedAt = item.createdAt;
      _editingServerRecordId = item.serverRecordId;
      _familyCodeController.text = item.familyCode;
      _farmerNameController.text = item.farmerName;
      _selectedVillage = item.village;
      _selectedVariety = item.variety;
      _selectedGrade = item.grade;
      _standardPrice = item.standardPrice;
      _sacksCountController.text = item.sacks > 0 ? item.sacks.toString() : '';
      _quantityKgController.text = item.totalWeight > 0 ? item.totalWeight.round().toString() : '';
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

    final formattedId = IdFormatter.formatPurchaseId(item);

    final step1 = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('⚠️ Step 1 of 2: Delete Purchase Record', style: TextStyle(color: AppTheme.amberGold, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete purchase record $formattedId for ${item.familyCode} (${item.farmerName})?'),
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
    if (!mounted) return;

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
      if (_editingId == item.id) {
        _resetForm();
      }
      await _loadHistory();
      if (mounted) {
        AppNotification.showSuccess(context, 'Purchase Record Deleted');
      }
    }
  }

  void _showRecordDetailsModal(PurchaseRecord item) {
    final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(item.createdAt);
    final formattedId = IdFormatter.formatPurchaseId(item);
    final numberFormat = NumberFormat('#,###');
    final isLocked = item.status != 'PENDING' || item.transportRecordId != null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formattedId,
                    style: const TextStyle(color: AppTheme.amberGold, fontWeight: FontWeight.w900, fontSize: 12),
                  ),
                  Text(
                    '${item.familyCode} · ${item.farmerName}',
                    style: const TextStyle(color: AppTheme.emeraldLight, fontWeight: FontWeight.bold, fontSize: 15),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
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
              Text('Purchase ID: $formattedId', style: const TextStyle(color: AppTheme.skyBlue, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Village: ${item.village}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Category: ${item.variety} (${item.grade})', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Status: ${item.status}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              Text('Date & Time: $dateStr', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              if (item.syncError != null && item.syncError!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text('Sync Warning: ${item.syncError}', style: const TextStyle(color: AppTheme.errorRed, fontSize: 11)),
              ],
              const Divider(color: Colors.white24, height: 16),

              Text('Number of Sacks: ${item.sacks} Sacks', style: const TextStyle(color: AppTheme.skyBlue, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Quantity (Kg): ${item.totalWeight.round()} kg', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),

              Text('Base Price: ${numberFormat.format(item.standardPrice.toInt())} KHR/kg${item.additionalPremium > 0 ? ' (+${numberFormat.format(item.additionalPremium.toInt())} Premium)' : ''}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
              Text('Final Price: ${numberFormat.format(item.finalPrice.toInt())} KHR/kg', style: const TextStyle(color: AppTheme.skyBlue, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Gross Value: ${numberFormat.format(item.totalPayment.toInt())} KHR', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
              if (item.seedDeduction > 0)
                Text('Seed Deduction: -${numberFormat.format(item.seedDeduction.toInt())} KHR (${item.seedRepayment.toStringAsFixed(1)} kg)', style: const TextStyle(color: AppTheme.errorRed, fontSize: 12)),
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
                    Text('${numberFormat.format(item.netPayment.toInt())} KHR', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
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
                  child: Image.memory(
                    base64Decode(item.signatureFarmer!.contains(',') ? item.signatureFarmer!.split(',').last : item.signatureFarmer!),
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.draw, color: AppTheme.textMuted)),
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          if (!item.isSynced && !isLocked)
            TextButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _editRecord(item);
              },
              icon: const Icon(Icons.edit, size: 16, color: AppTheme.skyBlue),
              label: const Text('Edit', style: TextStyle(color: AppTheme.skyBlue)),
            ),
          if (!item.isSynced && !isLocked)
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

  Widget _buildFormCard({
    required List<String> varieties,
    required List<String> availableGrades,
    required String? safeSelectedVariety,
    required String? safeSelectedGrade,
    required double addPremiumPerKg,
    required double finalPricePerKg,
    required double totalWeight,
    required double grossValue,
    required double seedBorrowedKg,
    required double returnedSeedKg,
    required double seedDeduction,
    required double netPayment,
  }) {
    final numberFormat = NumberFormat('#,###');

    return Container(
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
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 10,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
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
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton.icon(
                    onPressed: _searchAndLoadSpecs,
                    icon: const Icon(Icons.flash_on, size: 16, color: Color(0xFF0B0F19)),
                    label: const Text('Load Quality Specs', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19))),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.amberGold,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                      'Linked Quality Specs: ${_selectedLoadedSpecs!.paddyType} (${_selectedLoadedSpecs!.selectedGrade}) · Moisture: ${_selectedLoadedSpecs!.moisture}% · Base Price: ${numberFormat.format(_selectedLoadedSpecs!.finalPrice.toInt())} KHR/kg',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.emeraldLight),
                    ),
                  ),
                ],
              ),
            ),

          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 500;
              final isSpecsMissing = _selectedLoadedSpecs == null && _editingId == null;

              final familyCodeField = TextFormField(
                controller: _familyCodeController,
                readOnly: true,
                canRequestFocus: false,
                onTap: isSpecsMissing ? _searchAndLoadSpecs : null,
                decoration: const InputDecoration(
                  labelText: 'FAMILY CODE * (AUTO FROM SPECS)',
                  hintText: 'Load from Quality Specs...',
                  suffixIcon: Icon(Icons.lock_outline, size: 16, color: AppTheme.emeraldLight),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Load Quality Specs first' : null,
              );

              final farmerNameField = TextFormField(
                controller: _farmerNameController,
                readOnly: true,
                canRequestFocus: false,
                onTap: isSpecsMissing ? _searchAndLoadSpecs : null,
                decoration: const InputDecoration(
                  labelText: 'FARMER NAME * (AUTO FROM SPECS)',
                  hintText: 'Load from Quality Specs...',
                  suffixIcon: Icon(Icons.lock_outline, size: 16, color: AppTheme.emeraldLight),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Load Quality Specs first' : null,
              );

              return isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: familyCodeField),
                        const SizedBox(width: 12),
                        Expanded(child: farmerNameField),
                      ],
                    )
                  : Column(
                      children: [
                        familyCodeField,
                        const SizedBox(height: 12),
                        farmerNameField,
                      ],
                    );
            },
          ),
          const SizedBox(height: 12),

          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 520;
              final isSpecsMissing = _selectedLoadedSpecs == null && _editingId == null;

              final villageField = TextFormField(
                key: ValueKey('village_${_selectedVillage ?? ''}'),
                initialValue: _selectedVillage ?? '',
                readOnly: true,
                canRequestFocus: false,
                onTap: isSpecsMissing ? _searchAndLoadSpecs : null,
                decoration: const InputDecoration(
                  labelText: 'VILLAGE * (AUTO FROM SPECS)',
                  hintText: 'Load from Quality Specs...',
                  suffixIcon: Icon(Icons.lock_outline, size: 16, color: AppTheme.emeraldLight),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Load Quality Specs first' : null,
              );

              final categoryField = TextFormField(
                key: ValueKey('variety_${safeSelectedVariety ?? _selectedVariety ?? ''}'),
                initialValue: safeSelectedVariety ?? _selectedVariety ?? '',
                readOnly: true,
                canRequestFocus: false,
                onTap: isSpecsMissing ? _searchAndLoadSpecs : null,
                decoration: const InputDecoration(
                  labelText: 'PADDY CATEGORY * (AUTO FROM SPECS)',
                  hintText: 'Load from Quality Specs...',
                  suffixIcon: Icon(Icons.lock_outline, size: 16, color: AppTheme.emeraldLight),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Load Quality Specs first' : null,
              );

              final gradeField = TextFormField(
                key: ValueKey('grade_${safeSelectedGrade ?? _selectedGrade ?? ''}'),
                initialValue: safeSelectedGrade ?? _selectedGrade ?? '',
                readOnly: true,
                canRequestFocus: false,
                onTap: isSpecsMissing ? _searchAndLoadSpecs : null,
                decoration: const InputDecoration(
                  labelText: 'GRADE * (AUTO FROM SPECS)',
                  hintText: 'Load from Quality Specs...',
                  suffixIcon: Icon(Icons.lock_outline, size: 16, color: AppTheme.emeraldLight),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Load Quality Specs first' : null,
              );

              return isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: villageField),
                        const SizedBox(width: 12),
                        Expanded(child: categoryField),
                        const SizedBox(width: 12),
                        Expanded(child: gradeField),
                      ],
                    )
                  : Column(
                      children: [
                        villageField,
                        const SizedBox(height: 12),
                        categoryField,
                        const SizedBox(height: 12),
                        gradeField,
                      ],
                    );
            },
          ),
          const SizedBox(height: 16),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextFormField(
                  controller: _sacksCountController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  decoration: const InputDecoration(
                    labelText: 'NUMBER OF SACKS *',
                    hintText: 'e.g. 20',
                  ),
                  onChanged: (v) => setState(() {}),
                  validator: (v) {
                    final parsed = int.tryParse((v ?? '').trim()) ?? 0;
                    return parsed <= 0 ? 'Required' : null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _quantityKgController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'QUANTITY (KG) *',
                    hintText: 'e.g. 1000',
                  ),
                  onChanged: (v) => setState(() {}),
                  validator: (v) {
                    final parsed = double.tryParse((v ?? '').trim()) ?? 0.0;
                    return parsed <= 0 ? 'Required' : null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 500;
              final seedBorrowedField = TextFormField(
                controller: _seedBorrowedController,
                focusNode: _seedBorrowedFocusNode,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(3),
                ],
                decoration: const InputDecoration(labelText: 'SEED BORROWED (KG)', hintText: '0'),
                onChanged: (v) => setState(() {}),
              );

              final premiumField = TextFormField(
                controller: _premiumAmountController,
                focusNode: _premiumFocusNode,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(3),
                ],
                decoration: const InputDecoration(labelText: 'ADDITIONAL PREMIUM (KHR/KG)', hintText: '0'),
                onChanged: (v) => setState(() {}),
              );

              return isWide
                  ? Row(
                      children: [
                        Expanded(child: seedBorrowedField),
                        const SizedBox(width: 12),
                        Expanded(child: premiumField),
                      ],
                    )
                  : Column(
                      children: [
                        seedBorrowedField,
                        const SizedBox(height: 12),
                        premiumField,
                      ],
                    );
            },
          ),
          const SizedBox(height: 16),

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
                      'Base Price: ${numberFormat.format(_standardPrice.toInt())} KHR/kg${addPremiumPerKg > 0 ? ' + ${numberFormat.format(addPremiumPerKg.toInt())} Premium' : ''}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    Text(
                      'Final Price: ${numberFormat.format(finalPricePerKg.toInt())} KHR/kg',
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
                      'Gross Value (${totalWeight.toStringAsFixed(0)} kg × ${numberFormat.format(finalPricePerKg.toInt())} KHR):',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    Text(
                      '${numberFormat.format(grossValue.toInt())} KHR',
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
                        'Seed Deduction (${returnedSeedKg.toStringAsFixed(1)} kg × ${numberFormat.format(finalPricePerKg.toInt())} KHR):',
                        style: const TextStyle(fontSize: 11, color: AppTheme.errorRed),
                      ),
                      Text(
                        '-${numberFormat.format(seedDeduction.toInt())} KHR',
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
                      Text('${numberFormat.format(netPayment.toInt())} KHR', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

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
                              base64Decode(_existingFarmerSignatureBase64!.contains(',')
                                  ? _existingFarmerSignatureBase64!.split(',').last
                                  : _existingFarmerSignatureBase64!),
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
    );
  }

  Widget _buildHistorySection(List<PurchaseRecord> filteredHistory, {required bool isTabletSplit}) {
    final numberFormat = NumberFormat('#,###');

    final listWidget = filteredHistory.isEmpty
        ? Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: AppTheme.inputBackground, borderRadius: BorderRadius.circular(12)),
            child: const Center(
              child: Text('No matching purchase records found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            ),
          )
        : ListView.builder(
            shrinkWrap: true,
            physics: isTabletSplit ? const AlwaysScrollableScrollPhysics() : const NeverScrollableScrollPhysics(),
            itemCount: filteredHistory.length,
            itemBuilder: (context, index) {
              final item = filteredHistory[index];
              final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(item.createdAt);
              final formattedId = IdFormatter.formatPurchaseId(item);
              final isLocked = item.status != 'PENDING' || item.transportRecordId != null;

              return Card(
                color: isTabletSplit ? AppTheme.inputBackground : AppTheme.cardBackground,
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
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppTheme.amberGold.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.amberGold.withOpacity(0.4)),
                            ),
                            child: Text(
                              formattedId,
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.amberGold),
                            ),
                          ),
                          const SizedBox(width: 6),
                          if (item.status != 'PENDING')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppTheme.skyBlue.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                item.status,
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.skyBlue),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${item.variety} (${item.grade}) · Weight: ${item.totalWeight.round()} kg (${item.sacks} Sacks)\nNet Payment: ${numberFormat.format(item.netPayment.toInt())} KHR · $dateStr',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                  trailing: Icon(
                    isLocked ? Icons.lock_outline : Icons.chevron_right,
                    color: isLocked ? AppTheme.textMuted : AppTheme.skyBlue,
                    size: 18,
                  ),
                ),
              );
            },
          );

    return Container(
      padding: isTabletSplit ? const EdgeInsets.all(20) : EdgeInsets.zero,
      decoration: isTabletSplit
          ? BoxDecoration(
              color: AppTheme.cardBackground,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4)),
              ],
            )
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Saved Purchase Receipts', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
              Text('${filteredHistory.length} of ${_localHistory.length} Receipts', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by Purchase ID, Farmer, Family Code, Village...',
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
          if (isTabletSplit && filteredHistory.isNotEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 740),
              child: listWidget,
            )
          else
            listWidget,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final varieties = ConfigDao.instance.paddyCategories;
    final availableGrades = ConfigDao.instance.getGradesForCategory(_selectedVariety);
    final safeSelectedVariety = varieties.contains(_selectedVariety) ? _selectedVariety : null;
    final safeSelectedGrade = availableGrades.contains(_selectedGrade) ? _selectedGrade : null;

    final addPremiumPerKg = double.tryParse(_premiumAmountController.text) ?? 0.0;
    final finalPricePerKg = _standardPrice + addPremiumPerKg;
    final totalWeight = double.tryParse(_quantityKgController.text.trim()) ?? 0.0;
    final grossValue = (totalWeight * finalPricePerKg).roundToDouble();
    final seedBorrowedKg = double.tryParse(_seedBorrowedController.text) ?? 0.0;
    final returnedSeedKg = seedBorrowedKg * ConfigDao.instance.seedInterestRate;
    final seedDeduction = (returnedSeedKg * finalPricePerKg).roundToDouble();
    final netPayment = (grossValue - seedDeduction).clamp(0.0, double.infinity);

    final filteredHistory = _localHistory.where((item) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final formattedId = IdFormatter.formatPurchaseId(item).toLowerCase();
      final dateStr = DateFormat('yyyy-MM-dd').format(item.createdAt).toLowerCase();
      return formattedId.contains(q) ||
          item.familyCode.toLowerCase().contains(q) ||
          item.farmerName.toLowerCase().contains(q) ||
          item.village.toLowerCase().contains(q) ||
          dateStr.contains(q);
    }).toList();

    return LayoutBuilder(
      builder: (context, outerConstraints) {
        final isTabletSplit = outerConstraints.maxWidth >= 900;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: isTabletSplit
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 11,
                        child: _buildFormCard(
                          varieties: varieties,
                          availableGrades: availableGrades,
                          safeSelectedVariety: safeSelectedVariety,
                          safeSelectedGrade: safeSelectedGrade,
                          addPremiumPerKg: addPremiumPerKg,
                          finalPricePerKg: finalPricePerKg,
                          totalWeight: totalWeight,
                          grossValue: grossValue,
                          seedBorrowedKg: seedBorrowedKg,
                          returnedSeedKg: returnedSeedKg,
                          seedDeduction: seedDeduction,
                          netPayment: netPayment,
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        flex: 9,
                        child: _buildHistorySection(filteredHistory, isTabletSplit: true),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildFormCard(
                        varieties: varieties,
                        availableGrades: availableGrades,
                        safeSelectedVariety: safeSelectedVariety,
                        safeSelectedGrade: safeSelectedGrade,
                        addPremiumPerKg: addPremiumPerKg,
                        finalPricePerKg: finalPricePerKg,
                        totalWeight: totalWeight,
                        grossValue: grossValue,
                        seedBorrowedKg: seedBorrowedKg,
                        returnedSeedKg: returnedSeedKg,
                        seedDeduction: seedDeduction,
                        netPayment: netPayment,
                      ),
                      const SizedBox(height: 24),
                      _buildHistorySection(filteredHistory, isTabletSplit: false),
                    ],
                  ),
          ),
        );
      },
    );
  }
}
