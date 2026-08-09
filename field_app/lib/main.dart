import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'config/theme.dart';
import 'database/config_dao.dart';
import 'views/home_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.loadBaseUrl();
  await ConfigDao.instance.initAndAutoRefresh();
  runApp(const IbisRiceFieldApp());
}

class IbisRiceFieldApp extends StatelessWidget {
  const IbisRiceFieldApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Field',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const HomeDashboard(),
    );
  }
}
