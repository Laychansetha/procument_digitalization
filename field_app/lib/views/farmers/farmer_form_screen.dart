import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../models/farmer_profile.dart';
import '../../services/auth_service.dart';
import '../../utils/app_notification.dart';
import '../../widgets/searchable_village_select.dart';
import '../../widgets/bank_document_preview.dart';

class FarmerFormScreen extends StatefulWidget {
  const FarmerFormScreen({super.key});

  @override
  State<FarmerFormScreen> createState() => _FarmerFormScreenState();
}

class _FarmerFormScreenState extends State<FarmerFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _familyCodeController = TextEditingController();
  final _farmerNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _customRelationshipController = TextEditingController();
  final _searchController = TextEditingController();

  final FocusNode _familyCodeFocusNode = FocusNode();

  String? _editingId;
  String? _editingServerRecordId;
  String? _village;
  String? _paymentMethod = 'Bank Transfer';
  String? _bankName;
  String? _relationship = 'Self';
  String? _passbookPhotoPath;
  String _searchQuery = '';

  List<FarmerProfile> _localHistory = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
    AppDatabase.instance.dbChangeNotifier.addListener(_onDbChanged);
    ConfigDao.instance.configChangeNotifier.addListener(_onConfigChanged);
  }

  void _onDbChanged() {
    if (mounted) _loadHistory();
  }

  void _onConfigChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    AppDatabase.instance.dbChangeNotifier.removeListener(_onDbChanged);
    ConfigDao.instance.configChangeNotifier.removeListener(_onConfigChanged);
    _familyCodeController.dispose();
    _farmerNameController.dispose();
    _phoneController.dispose();
    _accountNumberController.dispose();
    _accountHolderController.dispose();
    _familyCodeFocusNode.dispose();
    _customRelationshipController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final list = await AppDatabase.instance.getAllFarmers();
    final userProvinces = await AuthService.getAssignedProvinceList();
    final allowedVillages = ConfigDao.instance.getVillagesForProvinces(userProvinces);

    final filtered = (userProvinces.isEmpty || userProvinces.length >= 4)
        ? list
        : list.where((f) => allowedVillages.contains(f.village)).toList();

    if (mounted) {
      setState(() {
        _localHistory = filtered;
      });
    }
  }

  void _resetForm() {
    _familyCodeController.clear();
    _farmerNameController.clear();
    _phoneController.clear();
    _accountNumberController.clear();
    _accountHolderController.clear();
    _customRelationshipController.clear();
    setState(() {
      _editingId = null;
      _editingServerRecordId = null;
      _village = null;
      _paymentMethod = 'Bank Transfer';
      _bankName = null;
      _relationship = 'Self';
      _passbookPhotoPath = null;
    });
    _familyCodeFocusNode.requestFocus();
  }

  Future<void> _autoFillFromFamilyCode(String codeVal) async {
    final norm = codeVal.trim().toLowerCase();
    if (norm.isEmpty) return;

    final specs = await AppDatabase.instance.getAllSpecs();
    final sMatches = specs.where((s) => s.familyCode.trim().toLowerCase() == norm).toList();
    if (sMatches.length == 1) {
      final match = sMatches.first;
      setState(() {
        if (_farmerNameController.text.trim().isEmpty) {
          _farmerNameController.text = match.farmerName;
        }
        _village ??= match.village;
        if (_relationship == 'Self' && _accountHolderController.text.trim().isEmpty) {
          _accountHolderController.text = match.farmerName;
        }
      });
      return;
    }

    final purchases = await AppDatabase.instance.getAllPurchases();
    final pMatches = purchases.where((p) => p.familyCode.trim().toLowerCase() == norm).toList();
    if (pMatches.length == 1) {
      final match = pMatches.first;
      setState(() {
        if (_farmerNameController.text.trim().isEmpty) {
          _farmerNameController.text = match.farmerName;
        }
        _village ??= match.village;
        if (_relationship == 'Self' && _accountHolderController.text.trim().isEmpty) {
          _accountHolderController.text = match.farmerName;
        }
      });
    }
  }

  Future<void> _searchAndLoadFarmerInfo() async {
    final queryCode = _familyCodeController.text.trim().toLowerCase();
    final queryName = _farmerNameController.text.trim().toLowerCase();
    final currentVillage = _village?.toLowerCase();

    if (queryCode.isEmpty && queryName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Family Code or Farmer Name to search inspection records.'), backgroundColor: AppTheme.amberGold),
      );
      return;
    }

    // 1. Search Quality Specs Database with Combined Key (Family Code + Village)
    final specs = await AppDatabase.instance.getAllSpecs();
    final matchingSpecs = specs.where((s) {
      final codeMatch = queryCode.isNotEmpty && s.familyCode.toLowerCase() == queryCode;
      final nameMatch = queryName.isNotEmpty && s.farmerName.toLowerCase().contains(queryName);
      final villageMatch = currentVillage == null || currentVillage.isEmpty || s.village.toLowerCase() == currentVillage;
      return (codeMatch || nameMatch) && villageMatch;
    }).toList();

    if (matchingSpecs.isNotEmpty) {
      if (matchingSpecs.length == 1) {
        final s = matchingSpecs.first;
        setState(() {
          _familyCodeController.text = s.familyCode;
          _farmerNameController.text = s.farmerName;
          _village = s.village;
          if (_relationship == 'Self' && _accountHolderController.text.trim().isEmpty) {
            _accountHolderController.text = s.farmerName;
          }
        });
        if (mounted) AppNotification.showSuccess(context, 'Farmer Loaded');
      } else {
        _showFarmerSelectionDialog(matchingSpecs.map((s) => {'code': s.familyCode, 'name': s.farmerName, 'village': s.village}).toList());
      }
      return;
    }

    // 2. Search Purchase Database with Combined Key (Family Code + Village)
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
          if (_relationship == 'Self' && _accountHolderController.text.trim().isEmpty) {
            _accountHolderController.text = p.farmerName;
          }
        });
        if (mounted) AppNotification.showSuccess(context, 'Farmer Loaded');
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
                      title: Text('${item['code']} · ${item['name']}', style: const TextStyle(color: AppTheme.skyBlue, fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: Text('Village: ${item['village']}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _familyCodeController.text = item['code']!;
                          _farmerNameController.text = item['name']!;
                          _village = item['village'];
                          if (_relationship == 'Self' && _accountHolderController.text.trim().isEmpty) {
                            _accountHolderController.text = item['name']!;
                          }
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

  Future<void> _takePhoto() async {
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
                'Attach Bank Passbook / Document Photo',
                style: TextStyle(color: AppTheme.textWhite, fontWeight: FontWeight.bold, fontSize: 15),
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
          _passbookPhotoPath = image.path;
        });
      }
    }
  }

  Future<void> _saveFarmer() async {
    if (!_formKey.currentState!.validate()) return;

    if (_village == null || _paymentMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select Village and Payment Method.'), backgroundColor: AppTheme.errorRed),
      );
      return;
    }

    final finalRelationship = _relationship == 'Other'
        ? (_customRelationshipController.text.trim().isEmpty ? 'Other' : _customRelationshipController.text.trim())
        : (_relationship ?? 'Self');

    final normCode = _familyCodeController.text.trim().toUpperCase();
    final normVillage = _village!.trim();
    final farmerName = _farmerNameController.text.trim();

    // Upsert locally by composite key (Family Code + Village) matching Web App POST /api/farmers
    String targetId = _editingId ?? 'offline_${DateTime.now().millisecondsSinceEpoch}_${const Uuid().v4().substring(0, 4)}';
    String? targetServerId = _editingServerRecordId;
    if (_editingId == null) {
      for (final existing in _localHistory) {
        if (existing.familyCode.toUpperCase() == normCode && existing.village == normVillage) {
          targetId = existing.id;
          targetServerId = existing.serverRecordId;
          break;
        }
      }
    }

    final cleanedAccountNumber = _accountNumberController.text.trim();
    if (_paymentMethod == 'Bank Transfer') {
      if (cleanedAccountNumber.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bank Account Number is required for Bank Transfer.'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
        return;
      }
      if (!RegExp(r'^[0-9]+$').hasMatch(cleanedAccountNumber)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bank Account Number must contain numbers only (0-9).'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
        return;
      }
    }

    final record = FarmerProfile(
      id: targetId,
      serverRecordId: targetServerId,
      familyCode: normCode,
      farmerName: farmerName,
      village: normVillage,
      phone: _phoneController.text.trim(),
      paymentMethod: _paymentMethod!,
      bankName: _paymentMethod == 'Bank Transfer' ? (_bankName ?? (ConfigDao.instance.banks.isNotEmpty ? ConfigDao.instance.banks.first : 'ABA Bank')) : 'Cash',
      accountNumber: _paymentMethod == 'Bank Transfer' ? cleanedAccountNumber : '—',
      accountHolder: _accountHolderController.text.trim().isEmpty ? farmerName : _accountHolderController.text.trim(),
      relationship: finalRelationship,
      bankDocumentUrl: _passbookPhotoPath,
      createdAt: DateTime.now(),
      isSynced: false,
      syncError: null,
    );

    await AppDatabase.instance.insertFarmer(record);

    if (mounted) {
      AppNotification.showSuccess(context, _editingId != null ? 'Updated' : 'Saved');
    }

    _resetForm();
    await _loadHistory();
  }

  void _editRecord(FarmerProfile item) {
    final rel = item.relationship;
    const stdValues = ['Self', 'Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother'];
    final banks = ConfigDao.instance.banks;

    setState(() {
      _editingId = item.id;
      _editingServerRecordId = item.serverRecordId;
      _familyCodeController.text = item.familyCode;
      _farmerNameController.text = item.farmerName;
      _phoneController.text = item.phone ?? '';
      _village = item.village;
      _paymentMethod = ['Bank Transfer', 'Cash'].contains(item.paymentMethod) ? item.paymentMethod : 'Bank Transfer';
      _bankName = (item.bankName != null && banks.contains(item.bankName))
          ? item.bankName
          : (banks.isNotEmpty ? banks.first : null);
      _accountNumberController.text = (item.accountNumber == '—')
          ? ''
          : (item.accountNumber ?? '').replaceAll(RegExp(r'[^0-9]'), '');
      _accountHolderController.text = item.accountHolder ?? item.farmerName;

      if (stdValues.contains(rel)) {
        _relationship = rel;
        _customRelationshipController.clear();
      } else if (rel.isNotEmpty && rel != 'Self') {
        _relationship = 'Other';
        _customRelationshipController.text = rel;
      } else {
        _relationship = 'Self';
        _customRelationshipController.clear();
      }

      _passbookPhotoPath = item.bankDocumentUrl;
    });

    _familyCodeFocusNode.requestFocus();
  }

  Future<void> _deleteRecord(FarmerProfile item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        title: const Text('Delete Profile', style: TextStyle(color: AppTheme.textWhite)),
        content: Text('Are you sure you want to delete payment profile for ${item.familyCode} (${item.farmerName}) in ${item.village}?'),
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
      await AppDatabase.instance.deleteFarmer(item.id);
      await _loadHistory();
      if (mounted) {
        AppNotification.showSuccess(context, 'Deleted');
      }
    }
  }

  void _showRecordOptionsDialog(FarmerProfile item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text('${item.familyCode} · ${item.farmerName}', style: const TextStyle(color: AppTheme.skyBlue, fontWeight: FontWeight.bold, fontSize: 16)),
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
              Text('Village: ${item.village}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 13)),
              Text('Phone: ${item.phone != null && item.phone!.isNotEmpty ? item.phone : 'N/A'}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 13)),
              Text('Bank: ${item.bankName ?? 'N/A'} (${item.paymentMethod})', style: const TextStyle(color: AppTheme.textWhite, fontSize: 13)),
              Text('Account #: ${item.accountNumber ?? 'N/A'} (${item.accountHolder ?? item.farmerName})', style: const TextStyle(color: AppTheme.textWhite, fontSize: 13)),
              Text('Relationship: ${item.relationship == 'Self' ? 'Own Account' : item.relationship}', style: const TextStyle(color: AppTheme.textWhite, fontSize: 13)),
              if (item.syncError != null && item.syncError!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('⚠️ Sync Warning: ${item.syncError}', style: const TextStyle(color: AppTheme.errorRed, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
              if (item.bankDocumentUrl != null && item.bankDocumentUrl!.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text('Bank Passbook Attachment:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 160,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.inputBackground,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.skyBlue.withOpacity(0.4)),
                    ),
                    child: BankDocumentPreview(
                      imagePath: item.bankDocumentUrl!,
                      size: 160,
                      enableZoomOnClick: true,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
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

  Widget _buildFormCard() {
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
        mainAxisSize: MainAxisSize.min,
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
                  const Icon(Icons.account_balance_wallet, color: AppTheme.skyBlue, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    _editingId != null ? 'Edit Farmer Payment Profile' : 'Farmer Payment Info Entry',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite),
                  ),
                ],
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton.icon(
                    onPressed: _searchAndLoadFarmerInfo,
                    icon: const Icon(Icons.person_search, size: 16, color: Colors.white),
                    label: const Text('Load Farmer Info', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.skyBlue,
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
          ),
          const SizedBox(height: 20),

          // Row 1: Family Code, Farmer Name, Phone
          LayoutBuilder(
            builder: (context, constraints) {
              bool isWide = constraints.maxWidth > 520;
              return isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: _buildFamilyCodeInput()),
                        const SizedBox(width: 12),
                        Expanded(child: _buildFarmerNameInput()),
                        const SizedBox(width: 12),
                        Expanded(child: _buildPhoneInput()),
                      ],
                    )
                  : Column(
                      children: [
                        _buildFamilyCodeInput(),
                        const SizedBox(height: 12),
                        _buildFarmerNameInput(),
                        const SizedBox(height: 12),
                        _buildPhoneInput(),
                      ],
                    );
            },
          ),
          const SizedBox(height: 16),

          // Row 2: Village, Payment Method, Commercial Bank
          LayoutBuilder(
            builder: (context, constraints) {
              bool isWide = constraints.maxWidth > 520;
              return isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: _buildVillageDropdown()),
                        const SizedBox(width: 12),
                        Expanded(child: _buildPaymentMethodDropdown()),
                        if (_paymentMethod != 'Cash') ...[
                          const SizedBox(width: 12),
                          Expanded(child: _buildBankDropdown()),
                        ],
                      ],
                    )
                  : Column(
                      children: [
                        _buildVillageDropdown(),
                        const SizedBox(height: 12),
                        _buildPaymentMethodDropdown(),
                        if (_paymentMethod != 'Cash') ...[
                          const SizedBox(height: 12),
                          _buildBankDropdown(),
                        ],
                      ],
                    );
            },
          ),
          const SizedBox(height: 16),

          // Row 3: Account Number, Account Holder, Relationship
          LayoutBuilder(
            builder: (context, constraints) {
              bool isWide = constraints.maxWidth > 520;
              return isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_paymentMethod != 'Cash') ...[
                          Expanded(child: _buildAccountNumberInput()),
                          const SizedBox(width: 12),
                        ],
                        Expanded(child: _buildAccountHolderInput()),
                        const SizedBox(width: 12),
                        Expanded(child: _buildRelationshipDropdown()),
                      ],
                    )
                  : Column(
                      children: [
                        if (_paymentMethod != 'Cash') ...[
                          _buildAccountNumberInput(),
                          const SizedBox(height: 12),
                        ],
                        _buildAccountHolderInput(),
                        const SizedBox(height: 12),
                        _buildRelationshipDropdown(),
                      ],
                    );
            },
          ),
          const SizedBox(height: 20),

          InkWell(
            onTap: _takePhoto,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.skyBlue.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  _passbookPhotoPath != null && _passbookPhotoPath!.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: BankDocumentPreview(
                            imagePath: _passbookPhotoPath!,
                            size: 48,
                            enableZoomOnClick: true,
                          ),
                        )
                      : const Icon(Icons.camera_alt, color: AppTheme.skyBlue, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _passbookPhotoPath != null && _passbookPhotoPath!.isNotEmpty
                              ? '✓ Bank Passbook Photo Attached'
                              : 'Select / Snap Photo of Bank Passbook',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _passbookPhotoPath != null && _passbookPhotoPath!.isNotEmpty
                                ? AppTheme.emeraldLight
                                : AppTheme.textWhite,
                          ),
                        ),
                        const Text(
                          'Tap to choose from Camera or Gallery. Tap thumbnail to expand.',
                          style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  if (_passbookPhotoPath != null && _passbookPhotoPath!.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear, color: AppTheme.amberGold, size: 18),
                      onPressed: () => setState(() => _passbookPhotoPath = null),
                      tooltip: 'Remove attached photo',
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _saveFarmer,
              icon: Icon(_editingId != null ? Icons.check_circle : Icons.save, size: 18, color: const Color(0xFF0B0F19)),
              label: Text(
                _editingId != null ? 'Update Farmer Payment Profile' : 'Save Farmer Payment Profile',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19)),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _editingId != null ? AppTheme.emeraldPrimary : AppTheme.skyBlue,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistorySection(List<FarmerProfile> filteredHistory) {
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.account_balance, color: AppTheme.skyBlue, size: 18),
                  SizedBox(width: 8),
                  Text('Registered Payment Accounts', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.skyBlue.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${filteredHistory.length} Profiles', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue)),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Search Box
          TextFormField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by Family Code, Farmer Name, Village, or Bank...',
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
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: AppTheme.inputBackground, borderRadius: BorderRadius.circular(12)),
                  child: const Center(
                    child: Text('No matching farmer payment profiles found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredHistory.length,
                  itemBuilder: (context, index) {
                    final item = filteredHistory[index];
                    final hasError = item.syncError != null && item.syncError!.isNotEmpty;
                    return Card(
                      color: AppTheme.inputBackground,
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: hasError ? AppTheme.errorRed : AppTheme.borderLight),
                      ),
                      child: ListTile(
                        onTap: () => _showRecordOptionsDialog(item),
                        leading: item.bankDocumentUrl != null && item.bankDocumentUrl!.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: BankDocumentPreview(
                                  imagePath: item.bankDocumentUrl!,
                                  size: 40,
                                  enableZoomOnClick: true,
                                ),
                              )
                            : const Icon(Icons.account_balance, color: AppTheme.skyBlue),
                        title: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '${item.familyCode} · ${item.farmerName}',
                                style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.skyBlue, fontSize: 13),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: hasError
                                    ? AppTheme.errorRed.withOpacity(0.15)
                                    : (item.isSynced ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.amberGold.withOpacity(0.15)),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: hasError ? AppTheme.errorRed : (item.isSynced ? AppTheme.emeraldPrimary : AppTheme.amberGold),
                                ),
                              ),
                              child: Text(
                                hasError ? '⚠️ Error' : (item.isSynced ? '✓ Synced' : '⏳ Offline'),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: hasError ? AppTheme.errorRed : (item.isSynced ? AppTheme.emeraldLight : AppTheme.amberGold),
                                ),
                              ),
                            ),
                          ],
                        ),
                        subtitle: Text(
                          '${item.village} · ${item.bankName ?? item.paymentMethod}\nAcc: ${item.accountNumber ?? 'N/A'} (${item.accountHolder ?? item.farmerName} · ${item.relationship == 'Self' ? 'Own Account' : item.relationship})',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                        trailing: const Icon(
                          Icons.chevron_right,
                          color: AppTheme.skyBlue,
                          size: 18,
                        ),
                      ),
                    );
                  },
                ),
        ],
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
          item.village.toLowerCase().contains(q) ||
          (item.bankName?.toLowerCase().contains(q) ?? false);
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTabletLandscape = constraints.maxWidth >= 900;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: isTabletLandscape
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 6, child: _buildFormCard()),
                      const SizedBox(width: 16),
                      Expanded(flex: 5, child: _buildHistorySection(filteredHistory)),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildFormCard(),
                      const SizedBox(height: 20),
                      _buildHistorySection(filteredHistory),
                    ],
                  ),
          ),
        );
      },
    );
  }

  Widget _buildFamilyCodeInput() {
    return TextFormField(
      controller: _familyCodeController,
      focusNode: _familyCodeFocusNode,
      textCapitalization: TextCapitalization.characters,
      onChanged: _autoFillFromFamilyCode,
      decoration: InputDecoration(
        labelText: 'FAMILY CODE *',
        hintText: 'e.g. TB034',
        suffixIcon: IconButton(
          icon: const Icon(Icons.search, color: AppTheme.skyBlue, size: 20),
          tooltip: 'Search Farmer Info',
          onPressed: _searchAndLoadFarmerInfo,
        ),
      ),
      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
    );
  }

  Widget _buildFarmerNameInput() {
    return TextFormField(
      controller: _farmerNameController,
      onChanged: (val) {
        if (_relationship == 'Self') {
          _accountHolderController.text = val;
        }
      },
      decoration: InputDecoration(
        labelText: 'FARMER NAME *',
        hintText: 'e.g. Sok San',
        suffixIcon: IconButton(
          icon: const Icon(Icons.search, color: AppTheme.skyBlue, size: 20),
          tooltip: 'Search Farmer Info',
          onPressed: _searchAndLoadFarmerInfo,
        ),
      ),
      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
    );
  }

  Widget _buildPhoneInput() {
    return TextFormField(
      controller: _phoneController,
      keyboardType: TextInputType.phone,
      decoration: const InputDecoration(labelText: 'PHONE NUMBER', hintText: '012 345 678'),
    );
  }

  Widget _buildVillageDropdown() {
    return SearchableVillageSelect(
      value: _village,
      onChanged: (val) => setState(() => _village = val),
      validator: (v) => v == null || v.isEmpty ? 'Select Village' : null,
    );
  }

  Widget _buildPaymentMethodDropdown() {
    const methods = ['Bank Transfer', 'Cash'];
    final currentMethod = methods.contains(_paymentMethod) ? _paymentMethod : 'Bank Transfer';

    return DropdownButtonFormField<String>(
      value: currentMethod,
      isExpanded: true,
      isDense: true,
      icon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
      decoration: const InputDecoration(
        labelText: 'PAYMENT METHOD *',
        hintText: 'Select Method',
        floatingLabelBehavior: FloatingLabelBehavior.always,
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      hint: const Text(
        'Select Method',
        style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
        maxLines: 1,
        softWrap: false,
        overflow: TextOverflow.ellipsis,
      ),
      items: methods
          .map((m) => DropdownMenuItem(
                value: m,
                child: Text(
                  m,
                  style: const TextStyle(fontSize: 13),
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.ellipsis,
                ),
              ))
          .toList(),
      validator: (v) => v == null ? 'Select Method' : null,
      onChanged: (val) => setState(() => _paymentMethod = val),
    );
  }

  Widget _buildBankDropdown() {
    final banks = ConfigDao.instance.banks;
    final currentBank = banks.contains(_bankName) ? _bankName : null;

    return DropdownButtonFormField<String>(
      value: currentBank,
      isExpanded: true,
      isDense: true,
      icon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
      decoration: const InputDecoration(
        labelText: 'COMMERCIAL BANK *',
        hintText: 'Select Bank',
        floatingLabelBehavior: FloatingLabelBehavior.always,
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      hint: const Text(
        'Select Bank',
        style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
        maxLines: 1,
        softWrap: false,
        overflow: TextOverflow.ellipsis,
      ),
      items: banks
          .map((b) => DropdownMenuItem(
                value: b,
                child: Text(
                  b,
                  style: const TextStyle(fontSize: 13),
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.ellipsis,
                ),
              ))
          .toList(),
      validator: (v) => _paymentMethod == 'Bank Transfer' && (v == null || v.isEmpty) ? 'Select Bank' : null,
      onChanged: (val) => setState(() => _bankName = val),
    );
  }

  Widget _buildAccountNumberInput() {
    return TextFormField(
      controller: _accountNumberController,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
      ],
      decoration: const InputDecoration(
        labelText: 'BANK ACCOUNT NUMBER *',
        hintText: '000123456',
      ),
      validator: (v) {
        if (_paymentMethod != 'Bank Transfer') return null;
        final val = v?.trim() ?? '';
        if (val.isEmpty) return 'Enter Account #';
        if (!RegExp(r'^[0-9]+$').hasMatch(val)) {
          return 'Numbers only (0-9)';
        }
        return null;
      },
    );
  }

  Widget _buildAccountHolderInput() {
    return TextFormField(
      controller: _accountHolderController,
      decoration: const InputDecoration(labelText: 'ACCOUNT HOLDER NAME', hintText: 'Defaults to Farmer Name'),
    );
  }

  static const List<Map<String, String>> _relationshipOptions = [
    {'value': 'Self', 'label': 'Own Account'},
    {'value': 'Husband', 'label': 'Husband'},
    {'value': 'Wife', 'label': 'Wife'},
    {'value': 'Father', 'label': 'Father'},
    {'value': 'Mother', 'label': 'Mother'},
    {'value': 'Son', 'label': 'Son'},
    {'value': 'Daughter', 'label': 'Daughter'},
    {'value': 'Brother', 'label': 'Brother'},
    {'value': 'Sister', 'label': 'Sister'},
    {'value': 'Grandfather', 'label': 'Grandfather'},
    {'value': 'Grandmother', 'label': 'Grandmother'},
    {'value': 'Other', 'label': 'Other (Specify Below)'},
  ];

  Widget _buildRelationshipDropdown() {
    final validValues = _relationshipOptions.map((r) => r['value']!).toSet();
    final currentRel = validValues.contains(_relationship) ? _relationship : 'Self';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          value: currentRel,
          isExpanded: true,
          isDense: true,
          icon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
          decoration: const InputDecoration(
            labelText: 'RELATIONSHIP TO FARMER',
            hintText: 'Select Relationship',
            floatingLabelBehavior: FloatingLabelBehavior.always,
            isDense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          ),
          hint: const Text(
            'Select Relationship',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            maxLines: 1,
            softWrap: false,
            overflow: TextOverflow.ellipsis,
          ),
          items: _relationshipOptions
              .map((r) => DropdownMenuItem(
                    value: r['value'],
                    child: Text(
                      r['label']!,
                      style: const TextStyle(fontSize: 13),
                      maxLines: 1,
                      softWrap: false,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ))
              .toList(),
          onChanged: (val) {
            setState(() {
              _relationship = val;
              if (val == 'Self' && _farmerNameController.text.trim().isNotEmpty) {
                _accountHolderController.text = _farmerNameController.text.trim();
              }
            });
          },
        ),
        if (_relationship == 'Other') ...[
          const SizedBox(height: 12),
          TextFormField(
            controller: _customRelationshipController,
            decoration: const InputDecoration(
              labelText: 'SPECIFY OTHER RELATIONSHIP *',
              hintText: 'e.g. Uncle / Legal Guardian',
            ),
            validator: (v) => _relationship == 'Other' && (v == null || v.trim().isEmpty) ? 'Required' : null,
          ),
        ],
      ],
    );
  }
}
