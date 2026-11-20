import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/thresholds.dart';
import '../../../models/weather.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/shimmer_placeholder.dart';

/// Ported from `WeatherWidget.tsx` — Outside/Inside two-column comparison,
/// highlighting whichever is closer to the comfort range (real Open-Meteo
/// data, no mock values).
class WeatherCard extends StatelessWidget {
  final WeatherReading? weather;
  final double indoorTemp;
  final bool isLoading;
  final bool isDay;
  final bool useFahrenheit;

  const WeatherCard({
    super.key,
    required this.weather,
    required this.indoorTemp,
    required this.isLoading,
    required this.isDay,
    this.useFahrenheit = false,
  });

  String _fmt(double celsius) => useFahrenheit ? '${(celsius * 9 / 5 + 32).round()}°F' : '${celsius.round()}°C';

  IconData _iconFor(String? category) => switch (category) {
        'clear' => Icons.wb_sunny_rounded,
        'cloudy' => Icons.cloud_rounded,
        'fog' => Icons.foggy,
        'rain' => Icons.umbrella_rounded,
        'snow' => Icons.ac_unit_rounded,
        'storm' => Icons.thunderstorm_rounded,
        _ => Icons.wb_cloudy_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    if (isLoading && weather == null) {
      return GlassCard(
        isDay: isDay,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ShimmerPlaceholder(isDay: isDay, height: 18, width: 100),
            const SizedBox(height: 16),
            ShimmerPlaceholder(isDay: isDay, height: 60),
          ],
        ),
      );
    }

    final outdoorTemp = weather?.temperature;
    final outdoorDist = outdoorTemp != null ? Thresholds.distanceFromComfort(outdoorTemp, Thresholds.comfortTempRange) : null;
    final indoorDist = Thresholds.distanceFromComfort(indoorTemp, Thresholds.comfortTempRange);
    final outdoorIsBetter = outdoorDist != null && outdoorDist < indoorDist;

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Weather', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _WeatherColumn(
                  label: 'Outside',
                  icon: _iconFor(weather?.category),
                  value: outdoorTemp != null ? _fmt(outdoorTemp) : '—',
                  subtitle: weather?.label ?? 'Unavailable',
                  highlighted: outdoorIsBetter,
                  textColor: textColor,
                ),
              ),
              Container(width: 1, height: 56, color: textColor.withValues(alpha: 0.1)),
              Expanded(
                child: _WeatherColumn(
                  label: 'Inside',
                  icon: Icons.home_rounded,
                  value: _fmt(indoorTemp),
                  subtitle: indoorDist == 0 ? 'Comfortable' : 'Off comfort range',
                  highlighted: !outdoorIsBetter,
                  textColor: textColor,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }
}

class _WeatherColumn extends StatelessWidget {
  final String label;
  final IconData icon;
  final String value;
  final String subtitle;
  final bool highlighted;
  final Color textColor;

  const _WeatherColumn({
    required this.label,
    required this.icon,
    required this.value,
    required this.subtitle,
    required this.highlighted,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: highlighted ? Border.all(color: AppColors.fine, width: 2) : null,
          ),
          child: Icon(icon, color: highlighted ? AppColors.fine : textColor.withValues(alpha: 0.7), size: 22),
        ),
        const SizedBox(height: 6),
        Text(label, style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.6))),
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: textColor)),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.55)),
        ),
      ],
    );
  }
}
