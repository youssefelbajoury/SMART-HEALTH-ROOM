import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/admin_provider.dart';
import '../../providers/alert_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/theme_provider.dart';
import '../profile/profile_screen.dart';
import 'admin_alerts_screen.dart';
import 'admin_dashboard_screen.dart';
import 'admin_orders_screen.dart';
import 'admin_users_screen.dart';

/// The admin account's navigation shell — mirrors the web app's behavior of
/// sending `role: "admin"` straight to the separate `/admin` back-office
/// (`web/src/app/dashboard/layout.tsx`'s `role === "admin" -> router.push
/// ("/admin")`) instead of the regular-user `MainShell`. Same 5-tab
/// `IndexedStack` pattern as `MainShell` for consistency, covering the same
/// ground as web's Dashboard/Orders/Users/Alerts sidebar + Profile/Logout.
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  static const _pages = [
    AdminDashboardScreen(),
    AdminOrdersScreen(),
    AdminUsersScreen(),
    AdminAlertsScreen(),
    ProfileScreen(),
  ];

  static const _destinations = [
    NavigationDestination(
      icon: Icon(Icons.space_dashboard_outlined),
      selectedIcon: Icon(Icons.space_dashboard_rounded),
      label: 'Dashboard',
    ),
    NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long_rounded), label: 'Orders'),
    NavigationDestination(icon: Icon(Icons.group_outlined), selectedIcon: Icon(Icons.group_rounded), label: 'Users'),
    NavigationDestination(
      icon: Icon(Icons.notifications_outlined),
      selectedIcon: Icon(Icons.notifications_rounded),
      label: 'Alerts',
    ),
    NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    final themeProvider = context.read<ThemeProvider>();
    final adminProvider = context.read<AdminProvider>();
    final alertProvider = context.read<AlertProvider>();
    final emergencyProvider = context.read<EmergencyProvider>();
    Future.microtask(() async {
      await Future.wait([
        themeProvider.load(),
        adminProvider.init(),
        // The admin's own account can still receive `new-alert`/emergency
        // events for its own (usually deviceless) profile — kept alive so
        // Profile/Settings behave identically to the user shell.
        alertProvider.init(),
        emergencyProvider.init(),
      ]);
    });
  }

  @override
  Widget build(BuildContext context) {
    final pendingOrders = context.select<AdminProvider, int>((p) => p.orderStats.pending);

    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: AppColors.secondary900,
          indicatorColor: AppColors.primary500.withValues(alpha: 0.25),
          labelTextStyle: WidgetStateProperty.resolveWith(
            (states) => TextStyle(
              fontSize: 11.5,
              fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
              color: states.contains(WidgetState.selected) ? AppColors.primary400 : Colors.white60,
            ),
          ),
          iconTheme: WidgetStateProperty.resolveWith(
            (states) => IconThemeData(color: states.contains(WidgetState.selected) ? AppColors.primary400 : Colors.white60),
          ),
        ),
        child: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (i) {
            if (i == _index) return;
            HapticFeedback.selectionClick();
            setState(() => _index = i);
          },
          destinations: [
            _destinations[0],
            NavigationDestination(
              icon: Badge(
                isLabelVisible: pendingOrders > 0,
                label: Text(pendingOrders > 99 ? '99+' : '$pendingOrders'),
                child: const Icon(Icons.receipt_long_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: pendingOrders > 0,
                label: Text(pendingOrders > 99 ? '99+' : '$pendingOrders'),
                child: const Icon(Icons.receipt_long_rounded),
              ),
              label: 'Orders',
            ),
            _destinations[2],
            _destinations[3],
            _destinations[4],
          ],
        ),
      ),
    );
  }
}
