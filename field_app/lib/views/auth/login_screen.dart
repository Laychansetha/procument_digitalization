import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../config/app_config.dart';
import '../../config/theme.dart';
import '../../database/app_database.dart';
import '../../database/config_dao.dart';
import '../../services/auth_service.dart';
import '../home_dashboard.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMessage = '';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    final result = await _authService.login(
      _usernameController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result.success) {
      // Trigger background sync and remote config fetch
      ConfigDao.instance.fetchRemoteConfig();
      
      // Navigate to HomeDashboard
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeDashboard()),
      );
    } else {
      setState(() {
        _errorMessage = result.message;
      });
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
                              final navigator = Navigator.of(ctx);
                              final messenger = ScaffoldMessenger.of(context);
                              navigator.pop();
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('✅ Server URL updated to: ${AppConfig.baseUrl}'),
                                  backgroundColor: AppTheme.emeraldPrimary,
                                ),
                              );
                            },
                            icon: const Icon(Icons.save, size: 16, color: Color(0xFF0B0F19)),
                            label: const Text('Save Settings', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0B0F19))),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.emeraldPrimary,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () async {
                          await AppDatabase.instance.clearAllData();
                          final navigator = Navigator.of(ctx);
                          final messenger = ScaffoldMessenger.of(context);
                          navigator.pop();
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('🧹 Local app database reset! Starts completely empty with 0 records.'),
                              backgroundColor: AppTheme.amberGold,
                            ),
                          );
                        },
                        icon: const Icon(Icons.delete_sweep, size: 16, color: AppTheme.errorRed),
                        label: const Text('Reset Local App Database (Clear 0 Records)', style: TextStyle(fontSize: 11, color: AppTheme.errorRed)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                color: AppTheme.cardBackground,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Colors.white10),
                ),
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Logo & Title
                        Center(
                          child: Column(
                            children: [
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldPrimary.withOpacity(0.15),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppTheme.emeraldPrimary.withOpacity(0.4), width: 2),
                                ),
                                child: const Icon(
                                  Icons.grass,
                                  color: AppTheme.emeraldPrimary,
                                  size: 36,
                                ),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'IBIS RICE',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.textWhite,
                                  letterSpacing: 1.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'FIELD PROCUREMENT SYSTEM',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.skyBlue,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // Error Message Banner
                        if (_errorMessage.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.errorRed.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.errorRed.withOpacity(0.5)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.error_outline, color: AppTheme.errorRed, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage,
                                    style: const TextStyle(
                                      color: AppTheme.errorRed,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Username / Email Input
                        TextFormField(
                          controller: _usernameController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'USERNAME OR EMAIL *',
                            hintText: 'Username or email',
                            prefixIcon: Icon(Icons.person_outline, color: AppTheme.skyBlue),
                            floatingLabelBehavior: FloatingLabelBehavior.always,
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your username or email';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Password Input
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _handleLogin(),
                          decoration: InputDecoration(
                            labelText: 'PASSWORD *',
                            hintText: '••••••••',
                            prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.skyBlue),
                            floatingLabelBehavior: FloatingLabelBehavior.always,
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: AppTheme.textMuted,
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your password';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 24),

                        // Login Button
                        SizedBox(
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.emeraldPrimary,
                              disabledBackgroundColor: AppTheme.emeraldPrimary.withOpacity(0.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 4,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Color(0xFF0B0F19),
                                    ),
                                  )
                                : const Text(
                                    'LOGIN TO FIELD APP',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0B0F19),
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Server IP & Settings Footer Row
                        InkWell(
                          onTap: _openServerSettingsModal,
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.settings, size: 16, color: AppTheme.skyBlue),
                                const SizedBox(width: 6),
                                Text(
                                  'Server Settings (${AppConfig.baseUrl})',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.skyBlue,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
