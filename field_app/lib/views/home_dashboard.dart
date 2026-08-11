import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../config/theme.dart';
import '../database/app_database.dart';
import '../database/config_dao.dart';
import '../services/auth_service.dart';
import '../services/sync_service.dart';
import '../utils/app_notification.dart';
import 'auth/login_screen.dart';
import 'specs/specs_form_screen.dart';
import 'farmers/farmer_form_screen.dart';
import 'purchases/purchase_form_screen.dart';
import 'transport/transport_form_screen.dart';

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  int _currentIndex = 0;
  int _unsyncedCount = 0;
  bool _isSyncing = false;
  String _syncStatusMessage = '';
  String _userName = '';
  String _userRole = '';

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _loadUnsyncedCount();
    ConfigDao.instance.fetchRemoteConfig();
  }

  Future<void> _loadUserInfo() async {
    final info = await AuthService.getUserInfo();
    if (mounted) {
      setState(() {
        _userName = info['name'] ?? 'Field Inspector';
        _userRole = info['role'] ?? 'FIELD';
      });
    }
  }

  Future<void> _loadUnsyncedCount() async {
    final count = await AppDatabase.instance.getUnsyncedCount();
    if (mounted) {
      setState(() {
        _unsyncedCount = count;
      });
    }
  }

  Future<void> _triggerSync() async {
    setState(() {
      _isSyncing = true;
      _syncStatusMessage = 'Updating Master Config & Syncing Records...';
    });

    await ConfigDao.instance.fetchRemoteConfig();

    final syncService = SyncService();
    final result = await syncService.syncAllOfflineRecords(
      onProgress: (status) {
        if (mounted) {
          setState(() {
            _syncStatusMessage = status;
          });
        }
      },
    );

    if (mounted) {
      setState(() {
        _isSyncing = false;
        _syncStatusMessage = result.message;
      });
    }

    // Auto-dismiss sync status banner after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _syncStatusMessage == result.message) {
        setState(() {
          _syncStatusMessage = '';
        });
      }
    });

    await _loadUnsyncedCount();

    if (mounted) {
      if (result.syncedCount > 0) {
        AppNotification.showSuccess(context, 'Synced');
      } else {
        AppNotification.showInfo(context, result.message.contains('No') ? 'Up to Date' : 'Synced');
      }
    }
  }

  Future<void> _confirmLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBackground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: AppTheme.errorRed, size: 22),
            SizedBox(width: 8),
            Text('Log Out?', style: TextStyle(color: AppTheme.textWhite, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Are you sure you want to log out of account "$_userName"?\n\nYou will need to enter your password again to log back in.',
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorRed,
            ),
            child: const Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthService.logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  void _openServerSettingsModal() {
    final urlController = TextEditingController(text: AppConfig.baseUrl);
    bool isTesting = false;
    String testResult = '';
    bool testSuccess = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              backgroundColor: AppTheme.cardBackground,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                padding: const EdgeInsets.all(20),
                constraints: const BoxConstraints(maxWidth: 450),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.settings, color: AppTheme.skyBlue, size: 22),
                            SizedBox(width: 8),
                            Text(
                              'Server IP & Connection',
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
                    const Text(
                      'Enter your central desktop server LAN IP address or Cloud URL (e.g. http://192.168.1.10:3000):',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: urlController,
                      decoration: const InputDecoration(
                        labelText: 'SERVER BASE URL',
                        hintText: 'http://192.168.1.10:3000',
                        prefixIcon: Icon(Icons.lan, color: AppTheme.skyBlue, size: 18),
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (testResult.isNotEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: testSuccess ? AppTheme.emeraldPrimary.withOpacity(0.15) : AppTheme.errorRed.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: testSuccess ? AppTheme.emeraldPrimary : AppTheme.errorRed),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              testSuccess ? Icons.check_circle : Icons.error_outline,
                              color: testSuccess ? AppTheme.emeraldLight : AppTheme.errorRed,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                testResult,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: testSuccess ? AppTheme.emeraldLight : AppTheme.errorRed,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: isTesting
                                ? null
                                : () async {
                                    setModalState(() {
                                      isTesting = true;
                                      testResult = 'Testing connection to server...';
                                      testSuccess = false;
                                    });

                                    String inputUrl = urlController.text.trim();
                                    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
                                      inputUrl = 'http://$inputUrl';
                                    }
                                    if (inputUrl.endsWith('/')) {
                                      inputUrl = inputUrl.substring(0, inputUrl.length - 1);
                                    }

                                    try {
                                      final uri = Uri.parse('$inputUrl/api/config');
                                      final res = await http.get(uri).timeout(const Duration(seconds: 8));
                                      if (res.statusCode == 200 || res.statusCode == 401) {
                                        setModalState(() {
                                          isTesting = false;
                                          testSuccess = true;
                                          testResult = '✅ Connected successfully to server at $inputUrl!';
                                        });
                                      } else {
                                        setModalState(() {
                                          isTesting = false;
                                          testSuccess = false;
                                          testResult = '❌ Server returned HTTP ${res.statusCode}. Check URL.';
                                        });
                                      }
                                    } on SocketException {
                                      setModalState(() {
                                        isTesting = false;
                                        testSuccess = false;
                                        testResult = '❌ Cannot reach $inputUrl. Check Wi-Fi & Windows Firewall on port 3000.';
                                      });
                                    } catch (e) {
                                      setModalState(() {
                                        isTesting = false;
                                        testSuccess = false;
                                        testResult = '❌ Connection failed ($e). Check server IP & Wi-Fi.';
                                      });
                                    }
                                  },
                            icon: isTesting
                                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.skyBlue))
                                : const Icon(Icons.wifi_find, size: 16, color: AppTheme.skyBlue),
                            label: const Text('Test Connection', style: TextStyle(fontSize: 11, color: AppTheme.skyBlue)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.skyBlue),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await AppConfig.saveBaseUrl(urlController.text.trim());
                              if (mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('✅ Server URL updated to: ${AppConfig.baseUrl}'),
                                    backgroundColor: AppTheme.emeraldPrimary,
                                  ),
                                );
                              }
                              _triggerSync();
                            },
                            icon: const Icon(Icons.save, size: 16, color: Color(0xFF0B0F19)),
                            label: const Text('Save & Sync', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19))),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.emeraldPrimary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
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

  final List<Widget> _tabs = [
    const SpecsFormScreen(),
    const FarmerFormScreen(),
    const PurchaseFormScreen(),
    const TransportFormScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 12,
        title: Row(
          children: [
            const Icon(Icons.grass, color: AppTheme.emeraldPrimary, size: 22),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'FIELD DEPARTMENT',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.textWhite, letterSpacing: 0.5),
                  ),
                  if (_userName.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 1.0),
                      child: Text(
                        '👤 $_userName ($_userRole)',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 10, color: AppTheme.skyBlue, fontWeight: FontWeight.w600),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        actions: [
          // Server Settings Icon (⚙️)
          IconButton(
            icon: const Icon(Icons.settings, color: AppTheme.skyBlue, size: 19),
            onPressed: _openServerSettingsModal,
            tooltip: 'Server Connection Settings',
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 4),
          // Sync Badge & Button
          Padding(
            padding: const EdgeInsets.only(right: 2),
            child: InkWell(
              onTap: _isSyncing ? null : _triggerSync,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _unsyncedCount > 0 ? AppTheme.amberGold.withOpacity(0.2) : Colors.white10,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _unsyncedCount > 0 ? AppTheme.amberGold : Colors.white24,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _isSyncing
                        ? const SizedBox(
                            width: 11,
                            height: 11,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.skyBlue),
                          )
                        : Icon(
                            Icons.cloud_sync,
                            size: 14,
                            color: _unsyncedCount > 0 ? AppTheme.amberGold : AppTheme.emeraldLight,
                          ),
                    const SizedBox(width: 4),
                    Text(
                      _unsyncedCount > 0 ? '$_unsyncedCount Pending' : 'Synced',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: _unsyncedCount > 0 ? AppTheme.amberGold : AppTheme.emeraldLight,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Logout Icon (🚪)
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.errorRed, size: 19),
            onPressed: _confirmLogout,
            tooltip: 'Log Out Account',
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: const EdgeInsets.only(right: 8),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_syncStatusMessage.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              color: AppTheme.skyBlue.withOpacity(0.15),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 14, color: AppTheme.skyBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _syncStatusMessage,
                      style: const TextStyle(fontSize: 11, color: AppTheme.skyBlue, fontWeight: FontWeight.bold),
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _syncStatusMessage = ''),
                    child: const Padding(
                      padding: EdgeInsets.all(4.0),
                      child: Icon(Icons.close, size: 14, color: AppTheme.textMuted),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(child: _tabs[_currentIndex]),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: AppTheme.cardBackground,
        selectedItemColor: AppTheme.emeraldPrimary,
        unselectedItemColor: AppTheme.textMuted,
        type: BottomNavigationBarType.fixed,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarViewItem(icon: Icon(Icons.analytics_outlined), label: 'Specs'),
          BottomNavigationBarViewItem(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Farmers'),
          BottomNavigationBarViewItem(icon: Icon(Icons.scale_outlined), label: 'Purchases'),
          BottomNavigationBarViewItem(icon: Icon(Icons.local_shipping_outlined), label: 'Transport'),
        ],
      ),
    );
  }
}

class BottomNavigationBarViewItem extends BottomNavigationBarItem {
  const BottomNavigationBarViewItem({required super.icon, required String super.label});
}
