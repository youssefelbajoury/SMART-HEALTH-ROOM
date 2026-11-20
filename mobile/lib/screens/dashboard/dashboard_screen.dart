import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/dashboard_insights.dart';
import '../../core/utils/page_transitions.dart';
import '../../providers/alert_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/weather_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import '../analytics/analytics_screen.dart';
import '../assistant/assistant_screen.dart';
import '../emergency/emergency_screen.dart';
import '../home/widgets/assistant_summary_card.dart';
import '../home/widgets/emergency_banner.dart';
import '../home/widgets/health_score_card.dart';
import '../home/widgets/predictive_warning_banner.dart';
import '../home/widgets/quick_actions_row.dart';
import '../home/widgets/room_quality_card.dart';
import '../notifications/notification_center_screen.dart';
import '../room/widgets/remote_control_sheet.dart';
import '../search/search_screen.dart';
import 'widgets/emergency_status_tile.dart';
import 'widgets/indoor_weather_card.dart';
import 'widgets/last_sync_tile.dart';
import 'widgets/latest_activity_card.dart';
import 'widgets/outdoor_weather_card.dart';
import 'widgets/recommendations_panel.dart';

/// The premium Dashboard tab — a deeper, more analytical companion to Home,
/// reusing every card/widget already built (`HealthScoreCard`,
/// `RoomQualityCard`, `AssistantSummaryCard`, etc.) plus a few
/// Dashboard-specific additions (split Indoor/Outdoor weather, full
/// Recommendations panel, Emergency Status, Last Synchronization, Latest
/// Activity). No business logic is duplicated — everything is derived via
/// the same `computeDashboardInsights()` helper Home uses.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Future<void> _onRefresh(BuildContext context) {
    return Future.wait([
      context.read<SensorProvider>().refresh(),
      context.read<AlertProvider>().fetchAlerts(),
      context.read<EmergencyProvider>().fetchActive(),
      context.read<EmergencyProvider>().fetchHistory(),
      context.read<WeatherProvider>().fetchWeather(force: true),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final sensor = context.watch<SensorProvider>();
    final alertProvider = context.watch<AlertProvider>();
    final emergencyProvider = context.watch<EmergencyProvider>();
    final weatherProvider = context.watch<WeatherProvider>();
    final themeProvider = context.watch<ThemeProvider>();

    final data = sensor.data;
    final isDay = themeProvider.resolveIsDay(sensorIsDay: data?.isDay ?? true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final insights = data == null
        ? null
        : computeDashboardInsights(
            data: data,
            history: sensor.history,
            weather: weatherProvider.weather,
            outdoorAqi: weatherProvider.outdoorAqi,
            emergencyActive: emergencyProvider.active != null,
            userName: auth.user?.displayFirstName ?? 'there',
          );

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Dashboard', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            tooltip: 'Search',
            onPressed: () => Navigator.of(context).push(fadeSlideRoute(const SearchScreen())),
          ),
          IconButton(
            icon: Badge(
              isLabelVisible: alertProvider.unreadCount > 0,
              label: Text(alertProvider.unreadCount > 99 ? '99+' : '${alertProvider.unreadCount}'),
              child: const Icon(Icons.notifications_rounded),
            ),
            tooltip: 'Notifications',
            onPressed: () => Navigator.of(context).push(fadeSlideRoute(const NotificationCenterScreen())),
          ),
        ],
      ),
      body: data == null || insights == null
          ? _buildLoading(isDay)
          : RefreshIndicator(
              onRefresh: () => _onRefresh(context),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth > 640;
                  return ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                    children: [
                      QuickActionsRow(
                        isDay: isDay,
                        onRemoteControl: () => showRemoteControlSheet(context),
                        onEmergencies: () => Navigator.of(context).push(fadeSlideRoute(const EmergencyScreen())),
                        onAskAssistant: () => Navigator.of(context).push(fadeSlideRoute(const AssistantScreen())),
                        onAnalytics: () => Navigator.of(context).push(fadeSlideRoute(const AnalyticsScreen())),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: EmergencyStatusTile(
                              active: emergencyProvider.active,
                              isDay: isDay,
                              onTap: () => Navigator.of(context).push(fadeSlideRoute(const EmergencyScreen())),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      LastSyncTile(
                        lastUpdate: data.timestamp,
                        isConnected: sensor.isSocketConnected,
                        isDay: isDay,
                      ),
                      const SizedBox(height: 14),
                      AssistantSummaryCard(
                        isDay: isDay,
                        sentences: insights.summarySentences,
                        recommendations: insights.recommendations,
                        healthScore: insights.healthScore.score,
                        roomQuality: insights.roomQuality.overall,
                        presence: data.isOccupied,
                      ),
                      if (emergencyProvider.active != null) ...[
                        const SizedBox(height: 14),
                        EmergencyBannerCard(
                          emergency: emergencyProvider.active!,
                          isResolving: emergencyProvider.isLoading,
                          onResolve: () => context.read<EmergencyProvider>().resolve(),
                        ),
                      ],
                      if (insights.predictiveWarning != null) ...[
                        const SizedBox(height: 14),
                        PredictiveWarningBannerCard(warning: insights.predictiveWarning!),
                      ],
                      const SizedBox(height: 14),
                      isWide
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: HealthScoreCard(result: insights.healthScore, isDay: isDay)),
                                const SizedBox(width: 14),
                                Expanded(child: RoomQualityCard(result: insights.roomQuality, isDay: isDay)),
                              ],
                            )
                          : Column(
                              children: [
                                HealthScoreCard(result: insights.healthScore, isDay: isDay),
                                const SizedBox(height: 14),
                                RoomQualityCard(result: insights.roomQuality, isDay: isDay),
                              ],
                            ),
                      const SizedBox(height: 14),
                      isWide
                          ? Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: IndoorWeatherCard(data: data, isDay: isDay)),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: OutdoorWeatherCard(
                                    weather: weatherProvider.weather,
                                    isLoading: weatherProvider.isLoading,
                                    isDay: isDay,
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                IndoorWeatherCard(data: data, isDay: isDay),
                                const SizedBox(height: 14),
                                OutdoorWeatherCard(
                                  weather: weatherProvider.weather,
                                  isLoading: weatherProvider.isLoading,
                                  isDay: isDay,
                                ),
                              ],
                            ),
                      const SizedBox(height: 14),
                      RecommendationsPanel(recommendations: insights.recommendations, isDay: isDay),
                      const SizedBox(height: 14),
                      LatestActivityCard(
                        alerts: alertProvider.alerts,
                        emergencies: emergencyProvider.history,
                        isDay: isDay,
                      ),
                    ],
                  );
                },
              ),
            ),
      floatingActionButton: data == null
          ? null
          : FloatingActionButton(
              onPressed: () => showRemoteControlSheet(context),
              backgroundColor: const Color(0xFF0EA5E9),
              child: const Icon(Icons.sports_esports_rounded),
            ),
    );
  }

  Widget _buildLoading(bool isDay) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ShimmerPlaceholder(isDay: isDay, height: 44),
        const SizedBox(height: 14),
        ShimmerPlaceholder(isDay: isDay, height: 60),
        const SizedBox(height: 14),
        ShimmerPlaceholder(isDay: isDay, height: 140),
        const SizedBox(height: 14),
        ShimmerPlaceholder(isDay: isDay, height: 200),
      ],
    );
  }
}
