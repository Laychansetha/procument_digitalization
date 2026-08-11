import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/specs_record.dart';
import '../../services/auth_service.dart';
import '../../utils/app_notification.dart';
import '../../widgets/searchable_village_select.dart';

class SpecsFormScreen extends StatefulWidget {
  const SpecsFormScreen({super.key});

  @override
  State<SpecsFormScreen> createState() => _SpecsFormScreenState();
}

class _SpecsFormScreenState extends State<SpecsFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _familyCodeController = TextEditingController();
  final _farmerNameController = TextEditingController();
  final _moistureController = TextEditingController();
  final _foreignMatterController = TextEditingController();
  final _wholeGrainController = TextEditingController();
  final _brokenRiceController = TextEditingController();
  final _impurityController = TextEditingController();
  final _searchController = TextEditingController();

  final FocusNode _familyCodeFocusNode = FocusNode();

  String? _editingId;
  String? _village;
  String? _paddyType;
  String? _selectedGrade;
  bool _isOrganic = true;
  String _searchQuery = '';

  List<SpecsRecord> _localHistory = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _familyCodeFocusNode.dispose();
    _searchController.dispose();
    _impurityController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllSpecs();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? list
        : list.where((s) => allowedVillages.contains(s.village)).toList();

    setState(() {
      _localHistory = filtered;
    });
  }

  void _applyMasterSpecsForGrade(String variety, String grade) {
    final specList = ConfigDao.instance.paddySpecs;
    final match = specList.firstWhere(
      (s) => s['variety'] == variety && s['grade'] == grade,
      orElse: () => <String, dynamic>{},
    );

    if (match.isNotEmpty) {
      _wholeGrainController.text = match['minWholeGrain'] != null ? match['minWholeGrain'].toString() : (match['wholeGrain'] != null ? match['wholeGrain'].toString() : '');
      _brokenRiceController.text = match['maxBrokenRice'] != null ? match['maxBrokenRice'].toString() : (match['brokenRice'] != null ? match['brokenRice'].toString() : '');
      _impurityController.text = match['impurity'] != null ? match['impurity'].toString() : '';
      _foreignMatterController.text = match['maxForeignMatter'] != null ? match['maxForeignMatter'].toString() : (match['foreignMatter'] != null ? match['foreignMatter'].toString() : '6.0');
      _moistureController.text = match['maxMoisture'] != null ? match['maxMoisture'].toString() : (match['moisture'] != null ? match['moisture'].toString() : '13.5');
    } else {
      if (variety == 'Phka Rumduol') {
        if (grade == 'A1') { _wholeGrainController.text = '75'; _brokenRiceController.text = '25'; _impurityController.text = '2'; _foreignMatterController.text = '6.0'; _moistureController.text = '13.5'; }
        else if (grade == 'A2') { _wholeGrainController.text = '70'; _brokenRiceController.text = '30'; _impurityController.text = '4'; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
        else if (grade == 'B1') { _wholeGrainController.text = '60'; _brokenRiceController.text = '40'; _impurityController.text = '2'; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
        else if (grade == 'B2') { _wholeGrainController.text = '50'; _brokenRiceController.text = '50'; _impurityController.text = '4'; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
      } else if (variety == 'Red Jasmine') {
        if (grade == 'A1') { _wholeGrainController.text = '75'; _brokenRiceController.text = '25'; _impurityController.text = ''; _foreignMatterController.text = '6.0'; _moistureController.text = '13.5'; }
        else if (grade == 'A2') { _wholeGrainController.text = '70'; _brokenRiceController.text = '30'; _impurityController.text = ''; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
        else if (grade == 'B1') { _wholeGrainController.text = '60'; _brokenRiceController.text = '40'; _impurityController.text = ''; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
        else if (grade == 'B2') { _wholeGrainController.text = '50'; _brokenRiceController.text = '50'; _impurityController.text = ''; _foreignMatterController.text = '6.0'; _moistureController.text = '14.0'; }
      } else if (variety.contains('Foundation Seed')) {
        _wholeGrainController.text = '98'; _brokenRiceController.text = ''; _impurityController.text = '1'; _foreignMatterController.text = '1.0'; _moistureController.text = '12.0';
      } else if (variety == 'Certified Seed') {
        _wholeGrainController.text = '96'; _brokenRiceController.text = ''; _impurityController.text = '2'; _foreignMatterController.text = '2.0'; _moistureController.text = '12.0';
      } else if (variety == 'White Rice') {
        _wholeGrainController.text = ''; _brokenRiceController.text = ''; _impurityController.text = '';
        if (grade == 'B') _foreignMatterController.text = '8.0'; else _foreignMatterController.text = '4.0';
        _moistureController.text = '13.5';
      }
    }
  }

  void _resetForm() {
    _familyCodeController.clear();
    _farmerNameController.clear();
    _moistureController.clear();
    _foreignMatterController.clear();
    _wholeGrainController.clear();
    _brokenRiceController.clear();
    _impurityController.clear();
    setState(() {
      _editingId = null;
      _village = null;
      _paddyType = null;
      _selectedGrade = null;
      _isOrganic = true;
    });
    _familyCodeFocusNode.requestFocus();
  }

  Future<void> _searchAndLoadFarmerInfo() async {
    final queryCode = _familyCodeController.text.trim().toLowerCase();
    final queryName = _farmerNameController.text.trim().toLowerCase();
    final currentVillage = _village?.toLowerCase();

    if (queryCode.isEmpty && queryName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Family Code or Farmer Name to search profiles.'), backgroundColor: AppTheme.amberGold),
      );
      return;
    }

    // 1. Search Farmer Payment Info with Combined Key (Family Code + Village)
    final farmers = await AppDatabase.instance.getAllFarmers();
    final matchingFarmers = farmers.where((f) {
      final codeMatch = queryCode.isNotEmpty && f.familyCode.toLowerCase() == queryCode;
      final nameMatch = queryName.isNotEmpty && f.farmerName.toLowerCase().contains(queryName);
      final villageMatch = currentVillage == null || currentVillage.isEmpty || f.village.toLowerCase() == currentVillage;
      return (codeMatch || nameMatch) && villageMatch;
    }).toList();

    if (matchingFarmers.isNotEmpty) {
      if (matchingFarmers.length == 1) {
        final f = matchingFarmers.first;
        setState(() {
          _familyCodeController.text = f.familyCode;
          _farmerNameController.text = f.farmerName;
          _village = f.village;
        });
        AppNotification.showSuccess(context, 'Farmer Loaded');
      } else {
        _showFarmerSelectionDialog(matchingFarmers.map((f) => {'code': f.familyCode, 'name': f.farmerName, 'village': f.village}).toList());
      }
      return;
    }

    // 2. Search Purchase Records Database with Combined Key (Family Code + Village)
    final purchases = await AppDatabase.instance.getAllPurchases();
    final matchingPurchases = purchases.where((p) {
      final codeMatch = queryCode.isNotEmpty && p.familyCode.toLowerCase() == queryCode;
      final nameMatch = queryName.isNotEmpty && p.farmerName.toLowerCase().contains(queryName);
      final villageMatch = currentVillage == null || currentVillage.isEmpty || p.village.toLowerCase() == currentVillage;
      return (codeMatch || nameMatch) && villageMatch;
    }).toList();

    if (matchingPurchases.isNotEmpty) {
      if (matchingPurchases.length == 1) {
        final p = matchingPurchases.first;
        setState(() {
          _familyCodeController.text = p.familyCode;
          _farmerNameController.text = p.farmerName;
          _village = p.village;
        });
        AppNotification.showSuccess(context, 'Farmer Loaded');
      } else {
        _showFarmerSelectionDialog(matchingPurchases.map((p) => {'code': p.familyCode, 'name': p.farmerName, 'village': p.village}).toList());
      }
      return;
    }

    if (mounted) {
      AppNotification.showInfo(context, 'No Match Found');
    }
  }

  void _showFarmerSelectionDialog(List<Map<String, String>> choices) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('Select Matching Farmer & Village', style: TextStyle(color: AppTheme.textWhite, fontSize: 16, fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Multiple farmers match this Family Code across different villages. Select the exact village:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: choices.length,
                  itemBuilder: (context, index) {
                    final item = choices[index];
                    return ListTile(
                      title: Text('${item['code']} · ${item['name']}', style: const TextStyle(color: AppTheme.emeraldLight, fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: Text('Village: ${item['village']}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _familyCodeController.text = item['code']!;
                          _farmerNameController.text = item['name']!;
                          _village = item['village'];
                        });
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveSpecs() async {
    if (!_formKey.currentState!.validate()) return;

    if (_village == null || _paddyType == null || _selectedGrade == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select Village, Paddy Category, and Grade.'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }

    final moisture = double.tryParse(_moistureController.text) ?? 13.5;
    final foreignMatter = double.tryParse(_foreignMatterController.text) ?? 6.0;
    final wholeGrain = double.tryParse(_wholeGrainController.text);
    final brokenRice = double.tryParse(_brokenRiceController.text);
    final impurity = double.tryParse(_impurityController.text);

    final currentSpecList = ConfigDao.instance.paddySpecs;
    final match = currentSpecList.firstWhere(
      (s) => s['variety'] == _paddyType && s['grade'] == _selectedGrade,
      orElse: () => <String, dynamic>{'basePrice': 1650.0},
    );
    final basePrice = (match['basePrice'] as num?)?.toDouble() ?? 1650.0;
    const organicBonus = 0.0;
    final finalPrice = basePrice;
    final maxM = (match['maxMoisture'] as num?)?.toDouble() ?? 15.5;
    final maxF = (match['maxForeignMatter'] as num?)?.toDouble() ?? 8.0;
    final isValid = moisture <= maxM && foreignMatter <= maxF;

    final record = SpecsRecord(
      id: _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 4)}',
      familyCode: _familyCodeController.text.trim(),
      farmerName: _farmerNameController.text.trim(),
      village: _village!,
      paddyType: _paddyType!,
      selectedGrade: _selectedGrade!,
      isOrganic: _isOrganic,
      moisture: moisture,
      foreignMatter: foreignMatter,
      wholeGrain: wholeGrain,
      brokenRice: brokenRice,
      impurity: impurity,
      isValid: isValid,
      basePrice: basePrice,
      organicBonus: organicBonus,
      finalPrice: finalPrice,
      createdAt: DateTime.now(),
      isSynced: false,
    );

    await AppDatabase.instance.insertSpecs(record);

    if (mounted) {
      AppNotification.showSuccess(context, _editingId != null ? 'Updated' : 'Saved');
    }

    _resetForm();
    await _loadHistory();
  }

  Future<void> _editRecord(SpecsRecord item) async {
    final purchases = await AppDatabase.instance.getAllPurchases();
    final isUsedInPurchase = purchases.any((p) => p.specsRecordId == item.id);
    if (isUsedInPurchase) {
      if (mounted) {
        _showAlertDialog('Locked Record', 'This Specs Record has already been used for a Purchase Record and cannot be edited.');
      }
      return;
    }

    setState(() {
      _editingId = item.id;
      _familyCodeController.text = item.familyCode;
      _farmerNameController.text = item.farmerName;
      _village = item.village;
      _paddyType = item.paddyType;
      _selectedGrade = item.selectedGrade;
      _isOrganic = item.isOrganic;
      _moistureController.text = item.moisture.toString();
      _foreignMatterController.text = item.foreignMatter.toString();
      _wholeGrainController.text = item.wholeGrain != null ? item.wholeGrain.toString() : '';
      _brokenRiceController.text = item.brokenRice != null ? item.brokenRice.toString() : '';
      _impurityController.text = item.impurity != null ? item.impurity.toString() : '';
    });

    _familyCodeFocusNode.requestFocus();
  }

  Future<void> _deleteRecord(SpecsRecord item) async {
    final purchases = await AppDatabase.instance.getAllPurchases();
    final isUsedInPurchase = purchases.any((p) => p.specsRecordId == item.id);
    if (isUsedInPurchase) {
      if (mounted) {
        _showAlertDialog('Locked Record', 'Cannot delete Specs Record. This record is currently linked to an active Purchase Record.');
      }
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('Delete Quality Specs', style: TextStyle(color: AppTheme.textWhite)),
        content: Text('Are you sure you want to delete quality inspection for ${item.familyCode} (${item.farmerName}) in ${item.village}?'),
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
      await AppDatabase.instance.deleteSpecs(item.id);
      await _loadHistory();
      if (mounted) {
        AppNotification.showSuccess(context, 'Deleted');
      }
    }
  }

  void _showRecordOptionsDialog(SpecsRecord item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: Text('${item.familyCode} · ${item.farmerName}', style: const TextStyle(color: AppTheme.emeraldLight, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Village: ${item.village}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
            Text('Paddy Category: ${item.paddyType} (${item.selectedGrade})', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
            Text('Moisture: ${item.moisture}% · Foreign Matter: ${item.foreignMatter}%', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
            Text('Whole Grain: ${item.wholeGrain}% · Broken: ${item.brokenRice}%', style: const TextStyle(color: AppTheme.textWhite, fontSize: 12)),
            Text('Base Price: ${item.finalPrice.toInt()} KHR/kg', style: const TextStyle(color: AppTheme.emeraldLight, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Status: ${item.isSynced ? '🟢 Synced with Server' : '⏳ Pending Local Sync'}', style: TextStyle(color: item.isSynced ? AppTheme.emeraldLight : AppTheme.amberGold, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
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
          ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
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
                                const Icon(Icons.analytics, color: AppTheme.emeraldPrimary, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  _editingId != null ? 'Edit Quality Specs Record' : 'Quality Specs Inspection Entry',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                ElevatedButton.icon(
                                  onPressed: _searchAndLoadFarmerInfo,
                                  icon: const Icon(Icons.person_search, size: 16, color: Colors.white),
                                  label: const Text('Load Farmer Info', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.emeraldPrimary,
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
                                    const Icon(Icons.analytics, color: AppTheme.emeraldPrimary, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      _editingId != null ? 'Edit Quality Specs Record' : 'Quality Specs Inspection Entry',
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
                              onPressed: _searchAndLoadFarmerInfo,
                              icon: const Icon(Icons.person_search, size: 16, color: Colors.white),
                              label: const Text('Load Farmer Info', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.emeraldPrimary,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ],
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 20),

                  // Row 1: Family Code, Farmer Name, Village
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(child: _buildFamilyCodeInput()),
                                const SizedBox(width: 12),
                                Expanded(child: _buildFarmerNameInput()),
                                const SizedBox(width: 12),
                                Expanded(child: _buildVillageDropdown()),
                              ],
                            )
                          : Column(
                              children: [
                                _buildFamilyCodeInput(),
                                const SizedBox(height: 12),
                                _buildFarmerNameInput(),
                                const SizedBox(height: 12),
                                _buildVillageDropdown(),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Row 2: Paddy Category, Grade, Organic Switch
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(child: _buildPaddyCategoryDropdown()),
                                const SizedBox(width: 12),
                                Expanded(child: _buildGradeDropdown()),
                              ],
                            )
                          : Column(
                              children: [
                                _buildPaddyCategoryDropdown(),
                                const SizedBox(height: 12),
                                _buildGradeDropdown(),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Row 3: Quality Parameters following Master Grading order
                  LayoutBuilder(
                    builder: (context, constraints) {
                      bool isDesktop = constraints.maxWidth > 600;
                      return isDesktop
                          ? Row(
                              children: [
                                Expanded(child: _buildWholeGrainInput()),
                                const SizedBox(width: 10),
                                Expanded(child: _buildBrokenRiceInput()),
                                const SizedBox(width: 10),
                                Expanded(child: _buildImpurityInput()),
                                const SizedBox(width: 10),
                                Expanded(child: _buildForeignMatterInput()),
                                const SizedBox(width: 10),
                                Expanded(child: _buildMoistureInput()),
                              ],
                            )
                          : Column(
                              children: [
                                _buildWholeGrainInput(),
                                const SizedBox(height: 12),
                                _buildBrokenRiceInput(),
                                const SizedBox(height: 12),
                                _buildImpurityInput(),
                                const SizedBox(height: 12),
                                _buildForeignMatterInput(),
                                const SizedBox(height: 12),
                                _buildMoistureInput(),
                              ],
                            );
                    },
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saveSpecs,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emeraldPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _editingId != null ? 'Update Quality Specs Record' : 'Save Quality Specs Record',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Saved Records List & Real-time Search Box
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Saved Inspection History', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                Text('${filteredHistory.length} Records', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
            const SizedBox(height: 10),

            // Search Box
            TextFormField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by Family Code, Farmer Name, or Village...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted, size: 18),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
            const SizedBox(height: 12),

            filteredHistory.isEmpty
                ? Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppTheme.cardBackground, borderRadius: BorderRadius.circular(12)),
                    child: const Center(
                      child: Text('No matching quality inspection records found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredHistory.length,
                    itemBuilder: (context, index) {
                      final item = filteredHistory[index];
                      return Card(
                        color: AppTheme.cardBackground,
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: AppTheme.borderLight),
                        ),
                        child: ListTile(
                          onTap: () => _showRecordOptionsDialog(item),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${item.familyCode} · ${item.farmerName}',
                                  style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.emeraldLight, fontSize: 13),
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
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: item.isSynced ? AppTheme.emeraldLight : AppTheme.amberGold),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text('${item.village} · ${item.paddyType} (${item.selectedGrade})\nMoisture: ${item.moisture}% · Final Price: ${item.finalPrice.toInt()} KHR/kg', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          trailing: const Icon(
                            Icons.chevron_right,
                            color: AppTheme.emeraldLight,
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

  Widget _buildFamilyCodeInput() {
    return TextFormField(
      controller: _familyCodeController,
      focusNode: _familyCodeFocusNode,
      decoration: InputDecoration(
        labelText: 'FAMILY CODE *',
        hintText: 'e.g. TB034',
        suffixIcon: IconButton(
          icon: const Icon(Icons.search, color: AppTheme.emeraldLight, size: 20),
          tooltip: 'Search Farmer Info',
          onPressed: _searchAndLoadFarmerInfo,
        ),
      ),
      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
    );
  }

  Widget _buildFarmerNameInput() {
    return TextFormField(
      controller: _farmerNameController,
      decoration: InputDecoration(
        labelText: 'FARMER NAME *',
        hintText: 'e.g. Sok San',
        suffixIcon: IconButton(
          icon: const Icon(Icons.search, color: AppTheme.emeraldLight, size: 20),
          tooltip: 'Search Farmer Info',
          onPressed: _searchAndLoadFarmerInfo,
        ),
      ),
      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
    );
  }

  Widget _buildVillageDropdown() {
    return SearchableVillageSelect(
      value: _village,
      onChanged: (val) => setState(() => _village = val),
      validator: (v) => v == null || v.isEmpty ? 'Select Village' : null,
    );
  }

  Widget _buildPaddyCategoryDropdown() {
    return DropdownButtonFormField<String>(
      value: _paddyType,
      decoration: const InputDecoration(
        labelText: 'PADDY CATEGORY *',
        hintText: 'Select Category',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
      hint: const Text('Select Paddy Category', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
      items: ConfigDao.instance.paddyCategories
          .map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12))))
          .toList(),
      validator: (v) => v == null ? 'Select Category' : null,
      onChanged: (val) {
        setState(() {
          _paddyType = val;
          final availableGrades = ConfigDao.instance.getGradesForCategory(val);
          if (_selectedGrade != null && !availableGrades.contains(_selectedGrade)) {
            _selectedGrade = null;
          }
          if (_selectedGrade != null && val != null) {
            _applyMasterSpecsForGrade(val, _selectedGrade!);
          }
        });
      },
    );
  }

  Widget _buildGradeDropdown() {
    final availableGrades = ConfigDao.instance.getGradesForCategory(_paddyType);
    final currentGradeValue = availableGrades.contains(_selectedGrade) ? _selectedGrade : null;

    return DropdownButtonFormField<String>(
      value: currentGradeValue,
      decoration: const InputDecoration(
        labelText: 'GRADE *',
        hintText: 'Select Grade',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
      hint: Text(_paddyType == null ? 'Select Category First' : 'Select Grade', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
      items: availableGrades
          .map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 12))))
          .toList(),
      validator: (v) => v == null ? 'Select Grade' : null,
      onChanged: (val) {
        setState(() {
          _selectedGrade = val;
          if (_paddyType != null && val != null) {
            _applyMasterSpecsForGrade(_paddyType!, val);
          }
        });
      },
    );
  }

  Widget _buildWholeGrainInput() {
    return TextFormField(
      controller: _wholeGrainController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(
        labelText: 'WHOLE GRAIN (%)',
        hintText: 'e.g. 75.0',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
    );
  }

  Widget _buildBrokenRiceInput() {
    return TextFormField(
      controller: _brokenRiceController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(
        labelText: 'BROKEN RICE (%)',
        hintText: 'e.g. 25.0',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
    );
  }

  Widget _buildImpurityInput() {
    return TextFormField(
      controller: _impurityController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(
        labelText: 'IMPURITY (%)',
        hintText: 'e.g. 2.0',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
    );
  }

  Widget _buildForeignMatterInput() {
    return TextFormField(
      controller: _foreignMatterController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(
        labelText: 'FOREIGN MATTER (%)',
        hintText: 'e.g. 6.0',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
    );
  }

  Widget _buildMoistureInput() {
    return TextFormField(
      controller: _moistureController,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: const InputDecoration(
        labelText: 'MOISTURE (%)',
        hintText: 'e.g. 13.5',
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
    );
  }
}
