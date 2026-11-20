import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/alert_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/weather_provider.dart';
import '../alerts/alerts_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../room/room_screen.dart';

/// The app's main navigation shell — 5 bottom-nav tabs (Home, Dashboard,
/// Room, Alerts, Profile) over an `IndexedStack` so every tab's scroll
/// position/state is preserved when switching, while all providers stay
/// alive at the `MaterialApp` level regardless of which tab is visible.
/// Also the single place that kicks off the app's initial data load, so
/// every tab has data ready no matter which one is opened first.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _pages = [
    HomeScreen(),
    DashboardScreen(),
    RoomScreen(),
    AlertsScreen(),
    ProfileScreen(),
  ];

  static const _destinations = [
    NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
    NavigationDestination(
      icon: Icon(Icons.space_dashboard_outlined),
      selectedIcon: Icon(Icons.space_dashboard_rounded),
      label: 'Dashboard',
    ),
    NavigationDestination(icon: Icon(Icons.meeting_room_outlined), selectedIcon: Icon(Icons.meeting_room_rounded), label: 'Room'),
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
    final weatherProvider = context.read<WeatherProvider>();
    final sensorProvider = context.read<SensorProvider>();
    final alertProvider = context.read<AlertProvider>();
    final emergencyProvider = context.read<EmergencyProvider>();
    Future.microtask(() async {
      await Future.wait([
        themeProvider.load(),
        sensorProvider.init(),
        alertProvider.init(),
        emergencyProvider.init(),
        weatherProvider.fetchWeather(),
      ]);
      weatherProvider.startAutoRefresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = context.select<AlertProvider, int>((p) => p.unreadCount);

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
            _destinations[1],
            _destinations[2],
            NavigationDestination(
              icon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.notifications_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: unreadCount > 0,
                label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                child: const Icon(Icons.notifications_rounded),
              ),
              label: 'Alerts',
            ),
            _destinations[4],
          ],
        ),
      ),
    );
  }
}
