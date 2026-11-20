import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/admin_provider.dart';
import 'providers/alert_provider.dart';
import 'providers/analytics_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/emergency_provider.dart';
import 'providers/log_provider.dart';
import 'providers/order_provider.dart';
import 'providers/sensor_provider.dart';
import 'providers/settings_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/weather_provider.dart';
import 'screens/admin/admin_shell.dart';
import 'screens/auth/biometric_lock_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/shell/main_shell.dart';

void main() {
  runApp(const SmartHealthRoomApp());
}

class SmartHealthRoomApp extends StatelessWidget {
  const SmartHealthRoomApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SensorProvider()),
        ChangeNotifierProvider(create: (_) => AlertProvider()),
        ChangeNotifierProvider(create: (_) => EmergencyProvider()),
        ChangeNotifierProvider(create: (_) => WeatherProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => AnalyticsProvider()),
        ChangeNotifierProvider(create: (_) => LogProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) => MaterialApp(
          title: 'Smart Health Room',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.day,
          darkTheme: AppTheme.night,
          themeMode: settings.appThemeMode,
          home: const _AuthGate(),
        ),
      ),
    );
  }
}

/// Resolves whether a persisted session exists before deciding between the
/// Login screen and the main bottom-nav shell — the mobile equivalent of
/// the web app's `SessionGuard`/persisted Zustand `authStore` — and, if
/// Settings' "Biometric Login" is enabled, gates the authenticated state
/// behind a once-per-cold-start biometric unlock.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _unlockedThisSession = false;

  @override
  void initState() {
    super.initState();
    context.read<AuthProvider>().tryAutoLogin();
    context.read<SettingsProvider>().load();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();

    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.authenticated:
        if (settings.biometricEnabled && !_unlockedThisSession) {
          return BiometricLockScreen(onUnlocked: () => setState(() => _unlockedThisSession = true));
        }
        // Mirrors web's `DashboardLayout`: `role === "admin"` is sent to the
        // separate back-office shell instead of the regular-user one.
        return auth.user?.role == 'admin' ? const AdminShell() : const MainShell();
      case AuthStatus.unauthenticated:
        return const LoginScreen();
    }
  }
}
