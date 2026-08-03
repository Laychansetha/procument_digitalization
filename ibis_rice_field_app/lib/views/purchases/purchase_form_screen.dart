import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:signature/signature.dart';

import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/purchase_record.dart';
import '../../models/specs_record.dart';

class PurchaseFormScreen extends StatefulWidget {
  const PurchaseFormScreen({Key? key}) : super(key: key);

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
  String _selectedVillage = 'Bra';
  String _selectedVariety = 'Phka Rumduol';
  String _selectedGrade = 'A1';
  double _standardPrice = 1750.0;

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
    setState(() {
      _availableSpecs = list;
    });
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllPurchases();
    setState(() {
      _localHistory = list;
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
      _sackWeights = [];
      _selectedLoadedSpecs = null;
      _standardPrice = 1750.0;
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
      final parsed = double.tryParse(t);
      if (parsed != null && parsed > 0) {
        weights.add(parsed);
      }
    }

    setState(() {
      _sackWeights = weights;
    });
  }

  void _updatePaddyPrice() {
    final paddySpecs = ConfigDao.instance.paddySpecs;
    final found = paddySpecs.firstWhere(
      (ps) => ps['variety'] == _selectedVariety && ps['grade'] == _selectedGrade,
      orElse: () => {'basePrice': 1750.0, 'organicBonus': 100.0},
    );

    double base = (found['basePrice'] as num?)?.toDouble() ?? 1750.0;
    double bonus = (found['organicBonus'] as num?)?.toDouble() ?? 100.0;

    setState(() {
      _standardPrice = base + bonus;
    });
  }

  Future<void> _searchAndLoadSpecs() async {
    final code = _familyCodeController.text.trim();
    if (code.isEmpty) {
      _openSpecsSelectionModal();
      return;
    }

    final matches = _availableSpecs.where((s) {
      return s.familyCode.toUpperCase() == code.toUpperCase() &&
          s.village.toLowerCase() == _selectedVillage.toLowerCase();
    }).toList();

    if (matches.isNotEmpty) {
      final bestMatch = matches.first;
      setState(() {
        _selectedLoadedSpecs = bestMatch;
        _farmerNameController.text = bestMatch.farmerName;
        _selectedVillage = bestMatch.village;
        _selectedVariety = bestMatch.paddyType;
        _selectedGrade = bestMatch.selectedGrade;
        _standardPrice = bestMatch.finalPrice;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Loaded Quality Specs for ${bestMatch.familyCode} (${bestMatch.village})!'),
          backgroundColor: AppTheme.emeraldPrimary,
        ),
      );
    } else {
      _openSpecsSelectionModal(initialQuery: code);
    }
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.analytics, color: AppTheme.skyBlue, size: 22),
                            SizedBox(width: 8),
                            Text(
                              'Select Quality Specs Record',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppTheme.textMuted),
                          onPressed: () => Navigator.pop(ctx),
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
                                return Card(
                                  color: AppTheme.inputBackground,
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    title: Text(
                                      '${s.familyCode} · ${s.farmerName} (${s.village})',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.skyBlue),
                                    ),
                                    subtitle: Text(
                                      'Variety: ${s.paddyType} (${s.selectedGrade}) · Moisture: ${s.moisture}%\nBase Price: ${s.finalPrice.toInt()} KHR/kg',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                    ),
                                    trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.emeraldPrimary),
                                    onTap: () {
                                      setState(() {
                                        _selectedLoadedSpecs = s;
                                        _familyCodeController.text = s.familyCode;
                                        _farmerNameController.text = s.farmerName;
                                        _selectedVillage = s.village;
                                        _selectedVariety = s.paddyType;
                                        _selectedGrade = s.selectedGrade;
                                        _standardPrice = s.finalPrice;
                                      });
                                      Navigator.pop(ctx);
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
    }

    final record = PurchaseRecord(
      id: _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_${code}',
      familyCode: code,
      farmerName: name,
      village: _selectedVillage,
      variety: _selectedVariety,
      grade: _selectedGrade,
      standardPrice: _standardPrice,
      additionalPrice: 0.0,
      finalPrice: finalPricePerKg,
      sackWeights: _sackWeights,
      totalWeight: totalWeight,
      totalPayment: grossValue,
      seedBorrowed: seedBorrowedKg,
      seedRepayment: returnedSeedKg,
      seedDeduction: seedDeduction,
      premiumDescription: addPremiumPerKg > 0 ? 'Distance Premium (+${addPremiumPerKg.toInt()} KHR)' : null,
      additionalPremium: addPremiumPerKg,
      netPayment: netPayment,
      signatureFarmer: farmerSigBase64,
      specsRecordId: _selectedLoadedSpecs?.id,
      createdAt: DateTime.now(),
      isSynced: false,
    );

    await AppDatabase.instance.insertPurchase(record);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_editingId != null ? '✅ Purchase Invoice updated!' : '✅ Purchase Receipt saved locally!'),
          backgroundColor: AppTheme.emeraldPrimary,
        ),
      );
    }

    _resetForm();
    await _loadHistory();
  }

  void _editRecord(PurchaseRecord item) {
    if (item.isSynced) {
      _showAlertDialog('Locked Record', 'This purchase record has already been synchronized with the central PostgreSQL server and cannot be edited locally.');
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
      _sacksInputController.text = item.sackWeights.join(' ');
      _seedBorrowedController.text = (item.seedBorrowed / ConfigDao.instance.seedInterestRate).toStringAsFixed(1);
      _premiumAmountController.text = item.additionalPremium.toInt().toString();
    });
  }

  Future<void> _deleteRecord(PurchaseRecord item) async {
    if (item.isSynced) {
      _showAlertDialog('Locked Record', 'Synchronized purchase records cannot be deleted locally.');
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('Delete Purchase Record', style: TextStyle(color: AppTheme.textWhite)),
        content: Text('Are you sure you want to delete purchase record for ${item.familyCode} (${item.farmerName})?'),
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
      await AppDatabase.instance.deletePurchase(item.id);
      await _loadHistory();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Purchase record deleted.')));
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

              Text('Base Price: ${item.standardPrice.toInt()} KHR/kg' + (item.additionalPremium > 0 ? ' (+${item.additionalPremium.toInt()} Premium)' : ''), style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
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
    final villages = ConfigDao.instance.villages;
    final paddySpecs = ConfigDao.instance.paddySpecs;
    final varieties = paddySpecs.map((ps) => ps['variety'] as String).toSet().toList();
    if (varieties.isEmpty) varieties.addAll(['Phka Rumduol', 'Red Jasmine', 'Sen Kra Ob']);
    final grades = ['A1', 'B1', 'C1'];

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
                                  _editingId != null ? 'Edit Paddy Purchase Record' : 'Paddy Purchase Invoice & Weighing',
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
                                      _editingId != null ? 'Edit Paddy Purchase Record' : 'Paddy Purchase Invoice & Weighing',
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
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedVillage,
                                    decoration: const InputDecoration(labelText: 'VILLAGE *'),
                                    items: villages
                                        .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                        .toList(),
                                    onChanged: (val) {
                                      if (val != null) setState(() => _selectedVillage = val);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _selectedVariety,
                                    decoration: const InputDecoration(labelText: 'PADDY CATEGORY *'),
                                    items: varieties
                                        .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                        .toList(),
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
                                    decoration: const InputDecoration(labelText: 'GRADE *'),
                                    items: grades
                                        .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 12))))
                                        .toList(),
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
                                DropdownButtonFormField<String>(
                                  value: _selectedVillage,
                                  decoration: const InputDecoration(labelText: 'VILLAGE *'),
                                  items: villages
                                      .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedVillage = val);
                                  },
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _selectedVariety,
                                  decoration: const InputDecoration(labelText: 'PADDY CATEGORY *'),
                                  items: varieties
                                      .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _selectedVariety = val);
                                      _updatePaddyPrice();
                                    }
                                  },
                                ),
                                const SizedBox(height: 12),
                                DropdownButtonFormField<String>(
                                  value: _selectedGrade,
                                  decoration: const InputDecoration(labelText: 'GRADE *'),
                                  items: grades
                                      .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 12))))
                                      .toList(),
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
                    decoration: const InputDecoration(labelText: 'INDIVIDUAL SACK WEIGHTS (KG) *', hintText: 'e.g. 100 102 98.5 101.5'),
                    onChanged: _parseSackWeights,
                    validator: (v) => _sackWeights.isEmpty ? 'Enter sack weights separated by spaces' : null,
                  ),
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
                        Text('Total Weight: ${totalWeight.toStringAsFixed(1)} kg', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppTheme.emeraldLight)),
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
                                    decoration: const InputDecoration(labelText: 'SEED BORROWED (KG)', hintText: '0'),
                                    onChanged: (v) => setState(() {}),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _premiumAmountController,
                                    keyboardType: TextInputType.number,
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
                                  decoration: const InputDecoration(labelText: 'SEED BORROWED (KG)', hintText: '0'),
                                  onChanged: (v) => setState(() {}),
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _premiumAmountController,
                                  keyboardType: TextInputType.number,
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
                              'Base Price: ${_standardPrice.toInt()} KHR/kg' + (addPremiumPerKg > 0 ? ' + ${addPremiumPerKg.toInt()} Premium' : ''),
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
                        onPressed: () => _farmerSignatureController.clear(),
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
                      child: Signature(
                        controller: _farmerSignatureController,
                        height: 100,
                        backgroundColor: Colors.transparent,
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

            // History Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Saved Purchase Receipts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                Text('${_localHistory.length} Receipts', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
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

                      return Card(
                        color: AppTheme.cardBackground,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          onTap: () => _showRecordDetailsModal(item),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${item.familyCode} · ${item.farmerName} (${item.village})', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.emeraldLight, fontSize: 13)),
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
                          subtitle: Text('Weight: ${item.totalWeight} kg · Net Payment: ${item.netPayment.toInt()} KHR\nDate: $dateStr', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
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
