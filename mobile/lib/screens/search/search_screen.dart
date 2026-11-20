import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/dashboard_insights.dart';
import '../../core/utils/order_status.dart';
import '../../core/utils/page_transitions.dart';
import '../../models/search_result.dart';
import '../../providers/alert_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/log_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/weather_provider.dart';
import '../analytics/analytics_screen.dart';
import '../assistant/assistant_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../emergency/emergency_screen.dart';
import '../health_report/health_report_screen.dart';
import '../home/home_screen.dart';
import '../logs/logs_screen.dart';
import '../notifications/notification_center_screen.dart';
import '../orders/order_detail_screen.dart';
import '../orders/order_history_screen.dart';
import '../profile/profile_screen.dart';
import '../room/room_screen.dart';
import '../sensors/sensors_screen.dart';
import '../settings/settings_screen.dart';
import '../timeline/timeline_screen.dart';

/// Global Search — client-side, instant filtering across every page and
/// every live data source the app already holds in memory (no new
/// endpoints; everything here is data already fetched by its owning
/// provider).
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<SearchResult> _buildResults(BuildContext context) {
    final sensor = context.read<SensorProvider>();
    final alertProvider = context.read<AlertProvider>();
    final emergencyProvider = context.read<EmergencyProvider>();
    final orderProvider = context.read<OrderProvider>();
    final logProvider = context.read<LogProvider>();
    final weatherProvider = context.read<WeatherProvider>();
    final auth = context.read<AuthProvider>();

    void push(Widget screen) => Navigator.of(context).push(fadeSlideRoute(screen));

    final results = <SearchResult>[
      // Pages
      SearchResult(category: 'Pages', icon: Icons.home_rounded, color: AppColors.primary500, title: 'Home', onTap: () => push(const HomeScreen())),
      SearchResult(category: 'Pages', icon: Icons.space_dashboard_rounded, color: AppColors.primary500, title: 'Dashboard', onTap: () => push(const DashboardScreen())),
      SearchResult(category: 'Pages', icon: Icons.meeting_room_rounded, color: AppColors.primary500, title: 'Room', onTap: () => push(const RoomScreen())),
      SearchResult(category: 'Pages', icon: Icons.sensors_rounded, color: AppColors.primary500, title: 'Sensors', onTap: () => push(const SensorsScreen())),
      SearchResult(category: 'Pages', icon: Icons.bar_chart_rounded, color: AppColors.primary500, title: 'Analytics', onTap: () => push(const AnalyticsScreen())),
      SearchResult(category: 'Pages', icon: Icons.auto_awesome_rounded, color: AppColors.primary500, title: 'AI Assistant', onTap: () => push(const AssistantScreen())),
      SearchResult(category: 'Pages', icon: Icons.warning_amber_rounded, color: AppColors.primary500, title: 'Emergency', onTap: () => push(const EmergencyScreen())),
      SearchResult(category: 'Pages', icon: Icons.notifications_rounded, color: AppColors.primary500, title: 'Notification Center', onTap: () => push(const NotificationCenterScreen())),
      SearchResult(category: 'Pages', icon: Icons.inventory_2_rounded, color: AppColors.primary500, title: 'My Orders', onTap: () => push(const OrderHistoryScreen())),
      SearchResult(category: 'Pages', icon: Icons.timeline_rounded, color: AppColors.primary500, title: 'Timeline', onTap: () => push(const TimelineScreen())),
      SearchResult(category: 'Pages', icon: Icons.article_rounded, color: AppColors.primary500, title: 'System Logs', onTap: () => push(const LogsScreen())),
      SearchResult(category: 'Pages', icon: Icons.picture_as_pdf_rounded, color: AppColors.primary500, title: 'Health Report', onTap: () => push(const HealthReportScreen())),
      SearchResult(category: 'Pages', icon: Icons.settings_rounded, color: AppColors.primary500, title: 'Settings', onTap: () => push(const SettingsScreen())),
      SearchResult(category: 'Profile', icon: Icons.person_rounded, color: AppColors.info, title: auth.user?.name ?? 'Profile', subtitle: auth.user?.email, onTap: () => push(const ProfileScreen())),

      // Sensors (live values)
      if (sensor.data != null) ...[
        SearchResult(category: 'Sensors', icon: Icons.thermostat_rounded, color: AppColors.warning, title: 'Temperature', subtitle: '${sensor.data!.temperature.toStringAsFixed(1)}°C', onTap: () => push(const SensorsScreen())),
        SearchResult(category: 'Sensors', icon: Icons.water_drop_rounded, color: AppColors.info, title: 'Humidity', subtitle: '${sensor.data!.humidity.toStringAsFixed(0)}%', onTap: () => push(const SensorsScreen())),
        SearchResult(category: 'Sensors', icon: Icons.air_rounded, color: AppColors.fine, title: 'Gas', subtitle: '${sensor.data!.gas.toStringAsFixed(0)} ppm', onTap: () => push(const SensorsScreen())),
        SearchResult(category: 'Sensors', icon: Icons.light_mode_rounded, color: AppColors.warning, title: 'Light', subtitle: '${sensor.data!.light.toStringAsFixed(0)} lx', onTap: () => push(const SensorsScreen())),
        SearchResult(category: 'Sensors', icon: Icons.volume_up_rounded, color: AppColors.info, title: 'Sound Level', subtitle: '${sensor.data!.soundLevel.toStringAsFixed(0)} dB', onTap: () => push(const SensorsScreen())),
        SearchResult(category: 'Sensors', icon: Icons.bed_rounded, color: AppColors.sleepViolet, title: 'Bed Pressure', subtitle: sensor.data!.isOccupied ? 'Occupied' : 'Vacant', onTap: () => push(const SensorsScreen())),
      ],

      // Settings sections
      SearchResult(category: 'Settings', icon: Icons.palette_rounded, color: AppColors.secondary400, title: 'Appearance', onTap: () => push(const SettingsScreen())),
      SearchResult(category: 'Settings', icon: Icons.notifications_rounded, color: AppColors.secondary400, title: 'Notifications', onTap: () => push(const SettingsScreen())),
      SearchResult(category: 'Settings', icon: Icons.fingerprint_rounded, color: AppColors.secondary400, title: 'Biometric Login', onTap: () => push(const SettingsScreen())),
      SearchResult(category: 'Settings', icon: Icons.cached_rounded, color: AppColors.secondary400, title: 'Cache & Offline Data', onTap: () => push(const SettingsScreen())),

      // Alerts
      ...alertProvider.alerts.take(20).map((a) => SearchResult(
            category: 'Alerts',
            icon: Icons.warning_amber_rounded,
            color: a.type == 'danger' ? AppColors.danger : (a.type == 'warning' ? AppColors.warning : AppColors.info),
            title: a.message,
            subtitle: a.sensor,
            onTap: () => push(const HomeScreen()),
          )),

      // Emergencies
      ...emergencyProvider.history.take(20).map((e) => SearchResult(
            category: 'Emergency',
            icon: Icons.emergency_rounded,
            color: e.isActive ? AppColors.danger : AppColors.fine,
            title: e.message,
            subtitle: e.isActive ? 'Active' : 'Resolved',
            onTap: () => push(const EmergencyScreen()),
          )),

      // Orders
      ...orderProvider.orders.take(20).map((o) => SearchResult(
            category: 'Orders',
            icon: orderStatusStyle(o.status).icon,
            color: orderStatusStyle(o.status).color,
            title: o.fullName,
            subtitle: orderStatusStyle(o.status).label,
            onTap: () => push(OrderDetailScreen(order: o)),
          )),

      // Logs
      ...logProvider.logs.take(30).map((l) => SearchResult(
            category: 'Logs',
            icon: Icons.article_rounded,
            color: AppColors.secondary400,
            title: l.message,
            subtitle: l.source,
            onTap: () => push(const LogsScreen()),
          )),

      // Recommendations (computed live, same engine as Home/Dashboard)
      if (sensor.data != null)
        ...computeDashboardInsights(
          data: sensor.data!,
          history: sensor.history,
          weather: weatherProvider.weather,
          outdoorAqi: weatherProvider.outdoorAqi,
          emergencyActive: emergencyProvider.active != null,
          userName: auth.user?.displayFirstName ?? 'there',
        ).recommendations.map((r) => SearchResult(
              category: 'Recommendations',
              icon: Icons.lightbulb_rounded,
              color: AppColors.primary400,
              title: r.message,
              subtitle: '${r.confidence}% confidence',
              onTap: () => push(const DashboardScreen()),
            )),
    ];

    return results;
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final all = _buildResults(context);
    final filtered = _query.isEmpty ? <SearchResult>[] : all.where((r) => r.matches(_query)).toList();

    final grouped = <String, List<SearchResult>>{};
    for (final r in filtered) {
      grouped.putIfAbsent(r.category, () => []).add(r);
    }

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          style: TextStyle(color: textColor),
          onChanged: (v) => setState(() => _query = v),
          decoration: InputDecoration(
            hintText: 'Search everything…',
            hintStyle: TextStyle(color: textColor.withValues(alpha: 0.4)),
            border: InputBorder.none,
          ),
        ),
        iconTheme: IconThemeData(color: textColor),
        actions: [
          if (_query.isNotEmpty)
            IconButton(icon: const Icon(Icons.clear_rounded), onPressed: () => setState(() { _controller.clear(); _query = ''; })),
        ],
      ),
      body: _query.isEmpty
          ? _buildEmptyState(textColor)
          : filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.search_off_rounded, size: 48, color: textColor.withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      Text('No results for "$_query".', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: grouped.entries.map((entry) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            entry.key,
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: textColor.withValues(alpha: 0.6)),
                          ),
                        ),
                        ...entry.value.asMap().entries.map((e) => _ResultTile(result: e.value, isDay: isDay, index: e.key)),
                        const SizedBox(height: 8),
                      ],
                    );
                  }).toList(),
                ),
    );
  }

  Widget _buildEmptyState(Color textColor) {
    const categories = [
      ('Pages', Icons.apps_rounded),
      ('Orders', Icons.inventory_2_rounded),
      ('Alerts', Icons.warning_amber_rounded),
      ('Logs', Icons.article_rounded),
      ('Recommendations', Icons.lightbulb_rounded),
      ('Sensors', Icons.sensors_rounded),
      ('Emergency', Icons.emergency_rounded),
      ('Settings', Icons.settings_rounded),
      ('Profile', Icons.person_rounded),
    ];
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.travel_explore_rounded, size: 56, color: textColor.withValues(alpha: 0.3))
                .animate()
                .fadeIn(duration: 400.ms)
                .scale(begin: const Offset(0.85, 0.85)),
            const SizedBox(height: 16),
            Text('Search everything', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: categories.map((c) {
                final (label, icon) = c;
                return Chip(
                  avatar: Icon(icon, size: 16, color: textColor.withValues(alpha: 0.6)),
                  label: Text(label, style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.7))),
                  backgroundColor: textColor.withValues(alpha: 0.06),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultTile extends StatelessWidget {
  final SearchResult result;
  final bool isDay;
  final int index;

  const _ResultTile({required this.result, required this.isDay, required this.index});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
      ),
      child: ListTile(
        onTap: result.onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: result.color.withValues(alpha: 0.15), shape: BoxShape.circle),
          child: Icon(result.icon, size: 16, color: result.color),
        ),
        title: Text(result.title, style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 13.5), maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: result.subtitle != null
            ? Text(result.subtitle!, style: TextStyle(color: textColor.withValues(alpha: 0.55), fontSize: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis)
            : null,
        trailing: Icon(Icons.chevron_right_rounded, color: textColor.withValues(alpha: 0.4)),
      ),
    ).animate().fadeIn(delay: (index.clamp(0, 10) * 30).ms, duration: 250.ms).slideX(begin: 0.02, end: 0);
  }
}
