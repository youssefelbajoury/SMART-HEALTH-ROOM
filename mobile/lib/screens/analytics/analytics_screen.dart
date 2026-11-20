import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/analytics.dart';
import '../../core/utils/health_score.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/room_quality.dart';
import '../../core/utils/trend.dart';
import '../../providers/analytics_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/weather_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import '../health_report/health_report_screen.dart';
import 'widgets/analytics_chart_card.dart';
import 'widgets/analytics_stats_row.dart';
import 'widgets/trend_stat_card.dart';

/// Premium Analytics tab — 5 time ranges (24h/7d/15d/30d/1y), reusing the
/// exact same `SensorRepository.history()` endpoint, and the exact same
/// `calculateHealthScore()`/`calculateRoomQuality()`/`trendFor()` formulas
/// used everywhere else in the app, just aggregated over the selected range.
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  @override
  void initState() {
    super.initState();
    final analytics = context.read<AnalyticsProvider>();
    if (analytics.history.isEmpty) {
      Future.microtask(() => analytics.load());
    }
  }

  @override
  Widget build(BuildContext context) {
    final analytics = context.watch<AnalyticsProvider>();
    final emergencyProvider = context.watch<EmergencyProvider>();
    final weatherProvider = context.watch<WeatherProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final cutoff = DateTime.now().subtract(Duration(hours: analytics.range.hours));
    final emergenciesInRange = emergencyProvider.history.where((e) => e.createdAt.isAfter(cutoff)).toList();

    final stats = computeAnalyticsStats(
      history: analytics.history,
      alertsInRange: analytics.alertsInRange,
      emergenciesInRange: emergenciesInRange,
      weather: weatherProvider.weather,
      outdoorAqi: weatherProvider.outdoorAqi,
    );

    final sampled = downsample(analytics.history, 150);

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Analytics', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded),
            tooltip: 'Health Report',
            onPressed: () => Navigator.of(context).push(fadeSlideRoute(const HealthReportScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => analytics.load(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: AnalyticsRange.values.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final r = AnalyticsRange.values[i];
                  final selected = analytics.range == r;
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      analytics.setRange(r);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary500 : (isDay ? Colors.white : Colors.white.withValues(alpha: 0.06)),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: selected ? AppColors.primary500 : (isDay ? const Color(0xFFE2E8F0) : Colors.white12)),
                      ),
                      child: Text(
                        r.label,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: selected ? Colors.white : textColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            if (analytics.isLoading && analytics.history.isEmpty)
              Column(
                children: List.generate(4, (i) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: ShimmerPlaceholder(isDay: isDay, height: 120),
                    )),
              )
            else if (analytics.history.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.query_stats_rounded, size: 48, color: textColor.withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      Text('No data recorded for this range yet.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                    ],
                  ),
                ),
              )
            else ...[
              AnalyticsStatsRow(stats: stats, isDay: isDay),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 0.95,
                children: [
                  TrendStatCard(
                    label: 'Temperature',
                    icon: Icons.thermostat_rounded,
                    color: AppColors.warning,
                    min: analytics.history.map((d) => d.temperature).reduce((a, b) => a < b ? a : b),
                    max: analytics.history.map((d) => d.temperature).reduce((a, b) => a > b ? a : b),
                    avg: analytics.history.map((d) => d.temperature).reduce((a, b) => a + b) / analytics.history.length,
                    unit: '°',
                    trend: trendFor(analytics.history, (d) => d.temperature, analytics.history.last.temperature),
                    isDay: isDay,
                  ),
                  TrendStatCard(
                    label: 'Humidity',
                    icon: Icons.water_drop_rounded,
                    color: AppColors.info,
                    min: analytics.history.map((d) => d.humidity).reduce((a, b) => a < b ? a : b),
                    max: analytics.history.map((d) => d.humidity).reduce((a, b) => a > b ? a : b),
                    avg: analytics.history.map((d) => d.humidity).reduce((a, b) => a + b) / analytics.history.length,
                    unit: '%',
                    trend: trendFor(analytics.history, (d) => d.humidity, analytics.history.last.humidity),
                    isDay: isDay,
                  ),
                  TrendStatCard(
                    label: 'Gas',
                    icon: Icons.air_rounded,
                    color: AppColors.fine,
                    min: analytics.history.map((d) => d.gas).reduce((a, b) => a < b ? a : b),
                    max: analytics.history.map((d) => d.gas).reduce((a, b) => a > b ? a : b),
                    avg: analytics.history.map((d) => d.gas).reduce((a, b) => a + b) / analytics.history.length,
                    unit: 'ppm',
                    trend: trendFor(analytics.history, (d) => d.gas, analytics.history.last.gas),
                    isDay: isDay,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AnalyticsChartCard(
                title: 'Temperature Evolution',
                unit: '°C',
                color: AppColors.warning,
                isDay: isDay,
                spots: [for (var i = 0; i < sampled.length; i++) FlSpot(i.toDouble(), sampled[i].temperature)],
              ),
              const SizedBox(height: 14),
              AnalyticsChartCard(
                title: 'Humidity Evolution',
                unit: '%',
                color: AppColors.info,
                isDay: isDay,
                spots: [for (var i = 0; i < sampled.length; i++) FlSpot(i.toDouble(), sampled[i].humidity)],
              ),
              const SizedBox(height: 14),
              AnalyticsChartCard(
                title: 'Gas Evolution',
                unit: 'ppm',
                color: AppColors.fine,
                isDay: isDay,
                spots: [for (var i = 0; i < sampled.length; i++) FlSpot(i.toDouble(), sampled[i].gas)],
              ),
              const SizedBox(height: 14),
              AnalyticsChartCard(
                title: 'Health Score Evolution',
                unit: '',
                color: AppColors.sleepViolet,
                isDay: isDay,
                minY: 0,
                maxY: 100,
                spots: [
                  for (var i = 0; i < sampled.length; i++)
                    FlSpot(i.toDouble(), calculateHealthScore(sampled[i]).score.toDouble()),
                ],
              ),
              const SizedBox(height: 14),
              AnalyticsChartCard(
                title: 'Room Quality Evolution',
                unit: '%',
                color: AppColors.primary500,
                isDay: isDay,
                minY: 0,
                maxY: 100,
                spots: [
                  for (var i = 0; i < sampled.length; i++)
                    FlSpot(
                      i.toDouble(),
                      calculateRoomQuality(
                        sampled[i],
                        outdoorAqi: weatherProvider.outdoorAqi,
                        outdoorTemp: weatherProvider.weather?.temperature,
                      ).overall.toDouble(),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
