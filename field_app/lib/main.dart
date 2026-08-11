import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'config/theme.dart';
import 'database/config_dao.dart';
import 'services/auth_service.dart';
import 'views/auth/login_screen.dart';
import 'views/home_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.loadBaseUrl();
  await ConfigDao.instance.initAndAutoRefresh();

  final bool isLoggedIn = await AuthService.isLoggedIn();

  runApp(IbisRiceFieldApp(isLoggedIn: isLoggedIn));
}

class IbisRiceFieldApp extends StatelessWidget {
  final bool isLoggedIn;

  const IbisRiceFieldApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Field App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: isLoggedIn ? const HomeDashboard() : const LoginScreen(),
    );
  }
}
