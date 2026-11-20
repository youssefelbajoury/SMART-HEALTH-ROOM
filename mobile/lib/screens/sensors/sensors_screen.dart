import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/health_score.dart';
import '../../core/utils/recommendations.dart';
import '../../core/utils/thresholds.dart';
import '../../core/utils/trend.dart';
import '../../providers/sensor_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import 'widgets/sensor_detail_card.dart';

/// Detailed sensor breakdown — Temperature, Humidity, Gas, Light, Sound,
/// Pressure — reusing the exact same `Thresholds`/`generateInsights()`
/// business logic as Home/Dashboard, just laid out for a focused, per-metric
/// deep-dive instead of a summary tile.
class SensorsScreen extends StatelessWidget {
  const SensorsScreen({super.key});

  String _recommendationFor(List<Insight> insights, List<String> idPrefixes, String fallback) {
    for (final insight in insights) {
      if (insight.type != InsightType.recommendation) continue;
      if (idPrefixes.any((prefix) => insight.id.startsWith(prefix))) return insight.message;
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    final sensor = context.watch<SensorProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final data = sensor.data;
    final sensorIsDay = data?.isDay ?? true;
    final isDay = themeProvider.resolveIsDay(sensorIsDay: sensorIsDay);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(title: Text('Sensors', style: TextStyle(color: textColor)), iconTheme: IconThemeData(color: textColor)),
      body: data == null
          ? ListView(
              padding: const EdgeInsets.all(16),
              children: List.generate(6, (i) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: ShimmerPlaceholder(isDay: isDay, height: 150),
                  )),
            )
          : RefreshIndicator(
              onRefresh: () => sensor.refresh(),
              child: Builder(builder: (context) {
                final insights = generateInsights(data, sensor.history);
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    SensorDetailCard(
                      heroTag: 'sensor-temperature',
                      icon: Icons.thermostat_rounded,
                      label: 'Temperature',
                      value: data.temperature,
                      unit: '°C',
                      level: Thresholds.levelFor('temperature', data.temperature),
                      threshold: Thresholds.temperature,
                      trend: trendFor(sensor.history, (d) => d.temperature, data.temperature),
                      recommendation: _recommendationFor(insights, ['temp-'], 'Temperature is within a healthy range.'),
                      isDay: isDay,
                    ),
                    const SizedBox(height: 14),
                    SensorDetailCard(
                      heroTag: 'sensor-humidity',
                      icon: Icons.water_drop_rounded,
                      label: 'Humidity',
                      value: data.humidity,
                      unit: '%',
                      level: Thresholds.levelFor('humidity', data.humidity),
                      threshold: Thresholds.humidity,
                      trend: trendFor(sensor.history, (d) => d.humidity, data.humidity),
                      recommendation: _recommendationFor(insights, ['humidity-'], 'Humidity is within a healthy range.'),
                      isDay: isDay,
                    ),
                    const SizedBox(height: 14),
                    SensorDetailCard(
                      heroTag: 'sensor-gas',
                      icon: Icons.air_rounded,
                      label: 'Air Quality (Gas)',
                      value: data.gas,
                      unit: 'ppm',
                      level: Thresholds.levelFor('gas', data.gas),
                      threshold: Thresholds.gas,
                      trend: trendFor(sensor.history, (d) => d.gas, data.gas),
                      recommendation: _recommendationFor(insights, ['gas-'], 'Air quality is good.'),
                      isDay: isDay,
                    ),
                    const SizedBox(height: 14),
                    SensorDetailCard(
                      heroTag: 'sensor-light',
                      icon: Icons.light_mode_rounded,
                      label: 'Light',
                      value: data.light,
                      unit: ' lx',
                      level: lightLevelFor(data.light),
                      threshold: null,
                      trend: trendFor(sensor.history, (d) => d.light, data.light),
                      recommendation: _recommendationFor(insights, ['light-'], 'Lighting level looks comfortable.'),
                      isDay: isDay,
                    ),
                    const SizedBox(height: 14),
                    SensorDetailCard(
                      heroTag: 'sensor-sound',
                      icon: Icons.volume_up_rounded,
                      label: 'Sound Level',
                      value: data.soundLevel,
                      unit: 'dB',
                      level: Thresholds.levelFor('soundLevel', data.soundLevel),
                      threshold: Thresholds.soundLevel,
                      trend: trendFor(sensor.history, (d) => d.soundLevel, data.soundLevel),
                      recommendation: _recommendationFor(insights, ['sound-'], 'Ambient noise is at a comfortable level.'),
                      isDay: isDay,
                    ),
                    const SizedBox(height: 14),
                    SensorDetailCard(
                      heroTag: 'sensor-pressure',
                      icon: Icons.bed_rounded,
                      label: 'Bed Pressure',
                      value: data.pressure,
                      unit: '',
                      level: null,
                      threshold: null,
                      trend: trendFor(sensor.history, (d) => d.pressure, data.pressure),
                      recommendation: data.isOccupied
                          ? _recommendationFor(insights, ['prolonged-bed-time'], 'Bed is currently occupied.')
                          : 'Bed is currently vacant.',
                      isDay: isDay,
                    ),
                  ],
                );
              }),
            ),
    );
  }
}
