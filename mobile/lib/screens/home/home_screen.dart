import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/sky_theme.dart';
import '../../core/utils/dashboard_insights.dart';
import '../../core/utils/page_transitions.dart';
import '../../providers/alert_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/weather_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import '../../widgets/sky_background.dart';
import '../analytics/analytics_screen.dart';
import '../assistant/assistant_screen.dart';
import '../auth/login_screen.dart';
import '../emergency/emergency_screen.dart';
import '../notifications/notification_center_screen.dart';
import '../search/search_screen.dart';
import '../room/widgets/remote_control_sheet.dart';
import 'widgets/assistant_summary_card.dart';
import 'widgets/emergency_banner.dart';
import 'widgets/health_score_card.dart';
import 'widgets/hero_section.dart';
import 'widgets/latest_alerts_card.dart';
import 'widgets/predictive_warning_banner.dart';
import 'widgets/quick_actions_row.dart';
import 'widgets/room_quality_card.dart';
import 'widgets/weather_card.dart';

/// The mobile Home screen — the first fully-implemented feature of the
/// Smart Health Room mobile app. Reproduces the web dashboard's home page
/// (`web/src/app/dashboard/page.tsx`) widget-for-widget, reusing the exact
/// same backend endpoints, Socket.IO events, and scoring/recommendation
/// logic (ported under `core/utils/`) — redesigned as native mobile cards.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Data loading (SensorProvider/AlertProvider/EmergencyProvider/WeatherProvider
  // init + ThemeProvider.load) is centralized once in `MainShell.initState()`
  // so every tab has data ready regardless of which one is opened first.

  Future<void> _onRefresh() async {
    await Future.wait([
      context.read<SensorProvider>().refresh(),
      context.read<AlertProvider>().fetchAlerts(),
      context.read<AlertProvider>().fetchUnreadCount(),
      context.read<EmergencyProvider>().fetchActive(),
      context.read<WeatherProvider>().fetchWeather(force: true),
    ]);
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final sensor = context.watch<SensorProvider>();
    final alertProvider = context.watch<AlertProvider>();
    final emergencyProvider = context.watch<EmergencyProvider>();
    final weatherProvider = context.watch<WeatherProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final settings = context.watch<SettingsProvider>();

    final data = sensor.data;
    final sensorIsDay = data?.isDay ?? (DateTime.now().hour >= 6 && DateTime.now().hour < 18);
    final isDay = themeProvider.resolveIsDay(sensorIsDay: sensorIsDay);
    final skyPeriod = SkyTheme.periodFor(
      now: DateTime.now(),
      sunrise: weatherProvider.weather?.sunrise,
      sunset: weatherProvider.weather?.sunset,
    );
    final veil = SkyTheme.veilFor(weatherProvider.weather?.category);

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
    final healthScore = insights?.healthScore;
    final roomQuality = insights?.roomQuality;
    final predictiveWarning = insights?.predictiveWarning;
    final recommendations = insights?.recommendations ?? const [];
    final summarySentences = insights?.summarySentences ?? const [];

    return Scaffold(
      body: SkyBackground(
        period: skyPeriod,
        veil: veil,
        child: SafeArea(
          child: RefreshIndicator(
            onRefresh: _onRefresh,
            child: sensor.isLoading && data == null
                ? _buildLoading(isDay)
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 640;
                      return ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        children: [
                          if (sensor.isShowingCachedData)
                            Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.secondary400.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.cloud_off_rounded, size: 14, color: AppColors.secondary400),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Offline — showing last known data',
                                    style: TextStyle(fontSize: 11.5, color: isDay ? const Color(0xFF0F172A) : Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                          Row(
                            children: [
                              Expanded(
                                child: HeroSection(
                                  firstName: auth.user?.displayFirstName ?? 'there',
                                  isDay: isDay,
                                ),
                              ),
                              IconButton(
                                icon: Icon(Icons.search_rounded, color: isDay ? const Color(0xFF0F172A) : Colors.white),
                                onPressed: () => Navigator.of(context).push(fadeSlideRoute(const SearchScreen())),
                                tooltip: 'Search',
                              ),
                              IconButton(
                                icon: Badge(
                                  isLabelVisible: alertProvider.unreadCount > 0,
                                  label: Text(alertProvider.unreadCount > 99 ? '99+' : '${alertProvider.unreadCount}'),
                                  child: Icon(Icons.notifications_rounded, color: isDay ? const Color(0xFF0F172A) : Colors.white),
                                ),
                                onPressed: () => Navigator.of(context).push(fadeSlideRoute(const NotificationCenterScreen())),
                                tooltip: 'Notifications',
                              ),
                              IconButton(
                                icon: Icon(Icons.logout_rounded, color: isDay ? const Color(0xFF0F172A) : Colors.white),
                                onPressed: _logout,
                                tooltip: 'Sign out',
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          QuickActionsRow(
                            isDay: isDay,
                            onRemoteControl: () => showRemoteControlSheet(context),
                            onEmergencies: () => Navigator.of(context).push(fadeSlideRoute(const EmergencyScreen())),
                            onAskAssistant: () => Navigator.of(context).push(fadeSlideRoute(const AssistantScreen())),
                            onAnalytics: () => Navigator.of(context).push(fadeSlideRoute(const AnalyticsScreen())),
                          ),
                          const SizedBox(height: 16),
                          if (data != null && healthScore != null && roomQuality != null)
                            AssistantSummaryCard(
                              isDay: isDay,
                              sentences: summarySentences,
                              recommendations: recommendations,
                              healthScore: healthScore.score,
                              roomQuality: roomQuality.overall,
                              presence: data.isOccupied,
                            ),
                          if (emergencyProvider.active != null) ...[
                            const SizedBox(height: 16),
                            EmergencyBannerCard(
                              emergency: emergencyProvider.active!,
                              isResolving: emergencyProvider.isLoading,
                              onResolve: () => context.read<EmergencyProvider>().resolve(),
                            ),
                          ],
                          if (predictiveWarning != null) ...[
                            const SizedBox(height: 16),
                            PredictiveWarningBannerCard(warning: predictiveWarning),
                          ],
                          const SizedBox(height: 16),
                          if (data != null && healthScore != null && roomQuality != null)
                            isWide
                                ? Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(child: HealthScoreCard(result: healthScore, isDay: isDay)),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: WeatherCard(
                                          weather: weatherProvider.weather,
                                          indoorTemp: data.temperature,
                                          isLoading: weatherProvider.isLoading,
                                          isDay: isDay,
                                          useFahrenheit: settings.temperatureUnit == TemperatureUnit.fahrenheit,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(child: RoomQualityCard(result: roomQuality, isDay: isDay)),
                                    ],
                                  )
                                : Column(
                                    children: [
                                      HealthScoreCard(result: healthScore, isDay: isDay),
                                      const SizedBox(height: 14),
                                      WeatherCard(
                                        weather: weatherProvider.weather,
                                        indoorTemp: data.temperature,
                                        isLoading: weatherProvider.isLoading,
                                        isDay: isDay,
                                        useFahrenheit: settings.temperatureUnit == TemperatureUnit.fahrenheit,
                                      ),
                                      const SizedBox(height: 14),
                                      RoomQualityCard(result: roomQuality, isDay: isDay),
                                    ],
                                  ),
                          const SizedBox(height: 16),
                          LatestAlertsCard(
                            alerts: alertProvider.alerts,
                            isDay: isDay,
                            onMarkAllRead:
                                alertProvider.unreadCount > 0 ? () => alertProvider.markAllAsRead() : null,
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoading(bool isDay) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ShimmerPlaceholder(isDay: isDay, height: 60),
        const SizedBox(height: 16),
        ShimmerPlaceholder(isDay: isDay, height: 44),
        const SizedBox(height: 16),
        ShimmerPlaceholder(isDay: isDay, height: 140),
        const SizedBox(height: 16),
        ShimmerPlaceholder(isDay: isDay, height: 220),
      ],
    );
  }
}
