import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../database/config_dao.dart';
import '../services/auth_service.dart';

class SearchableVillageSelect extends StatefulWidget {
  final String? value;
  final ValueChanged<String?> onChanged;
  final String label;
  final String hint;
  final String? Function(String?)? validator;

  const SearchableVillageSelect({
    Key? key,
    required this.value,
    required this.onChanged,
    this.label = 'VILLAGE *',
    this.hint = 'Select Village...',
    this.validator,
  }) : super(key: key);

  @override
  State<SearchableVillageSelect> createState() => _SearchableVillageSelectState();
}

class _SearchableVillageSelectState extends State<SearchableVillageSelect> {
  void _openVillagePickerModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _VillagePickerBottomSheet(
        selectedVillage: widget.value,
        titleLabel: widget.label,
        onSelect: (village) {
          widget.onChanged(village);
          Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      initialValue: widget.value,
      validator: widget.validator,
      builder: (state) {
        final selectedText = widget.value;
        final hasSelection = selectedText != null && selectedText.isNotEmpty;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            InkWell(
              onTap: () => _openVillagePickerModal(context),
              borderRadius: BorderRadius.circular(10),
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: widget.label,
                  floatingLabelBehavior: FloatingLabelBehavior.always,
                  errorText: state.errorText,
                  suffixIcon: const Icon(Icons.arrow_drop_down, color: AppTheme.skyBlue),
                ),
                isEmpty: false,
                child: Text(
                  hasSelection ? selectedText : widget.hint,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: hasSelection ? FontWeight.bold : FontWeight.normal,
                    color: hasSelection ? AppTheme.textWhite : AppTheme.textMuted,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _VillagePickerBottomSheet extends StatefulWidget {
  final String? selectedVillage;
  final String titleLabel;
  final ValueChanged<String> onSelect;

  const _VillagePickerBottomSheet({
    Key? key,
    this.selectedVillage,
    this.titleLabel = 'VILLAGE',
    required this.onSelect,
  }) : super(key: key);

  @override
  State<_VillagePickerBottomSheet> createState() => _VillagePickerBottomSheetState();
}

class _VillagePickerBottomSheetState extends State<_VillagePickerBottomSheet> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<String> _userAssignedProvinces = [];

  @override
  void initState() {
    super.initState();
    _loadUserProvinces();
  }

  Future<void> _loadUserProvinces() async {
    final provinces = await AuthService.getAssignedProvinceList();
    if (mounted) {
      setState(() {
        _userAssignedProvinces = provinces;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allVillages = ConfigDao.instance.getVillagesForProvinces(_userAssignedProvinces);
    final filtered = allVillages.where((v) {
      if (_searchQuery.isEmpty) return true;
      return v.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    final cleanTitle = widget.titleLabel.replaceAll(RegExp(r'[\*\:]'), '').trim();
    final modalHeaderTitle = cleanTitle.toLowerCase().contains('select') ? cleanTitle : 'Select $cleanTitle';

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppTheme.borderLight, width: 1)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, color: AppTheme.skyBlue, size: 20),
                    const SizedBox(width: 8),
                    Text(modalHeaderTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textWhite)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.skyBlue.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${filtered.length} Villages',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.skyBlue),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Search input box
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search village name...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.skyBlue, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppTheme.textMuted, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                filled: true,
                fillColor: AppTheme.inputBackground,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.borderLight)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.skyBlue)),
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppTheme.borderLight),

          // Scrollable Village List
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Text('No matching village found.', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                  )
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final village = filtered[index];
                      final isSelected = widget.selectedVillage == village;

                      return ListTile(
                        onTap: () => widget.onSelect(village),
                        leading: Icon(
                          isSelected ? Icons.check_circle : Icons.location_city_outlined,
                          color: isSelected ? AppTheme.emeraldLight : AppTheme.textMuted,
                          size: 20,
                        ),
                        title: Text(
                          village,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppTheme.emeraldLight : AppTheme.textWhite,
                          ),
                        ),
                        trailing: isSelected
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldPrimary.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('Selected', style: TextStyle(fontSize: 10, color: AppTheme.emeraldLight, fontWeight: FontWeight.bold)),
                              )
                            : const Icon(Icons.chevron_right, color: Colors.white24, size: 16),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
