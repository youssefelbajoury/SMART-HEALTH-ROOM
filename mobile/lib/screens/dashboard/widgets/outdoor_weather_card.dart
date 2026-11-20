import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/weather.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/shimmer_placeholder.dart';

/// Outdoor conditions — real Open-Meteo data (`WeatherProvider`), split out
/// from the combined `WeatherCard` on Home into its own Dashboard card.
class OutdoorWeatherCard extends StatelessWidget {
  final WeatherReading? weather;
  final bool isLoading;
  final bool isDay;

  const OutdoorWeatherCard({super.key, required this.weather, required this.isLoading, required this.isDay});

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
            ShimmerPlaceholder(isDay: isDay, height: 18, width: 90),
            const SizedBox(height: 16),
            ShimmerPlaceholder(isDay: isDay, height: 50),
          ],
        ),
      );
    }

    if (weather == null) {
      return GlassCard(
        isDay: isDay,
        child: Text('Outdoor weather unavailable.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
      );
    }

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_iconFor(weather!.category), color: AppColors.info, size: 20),
              const SizedBox(width: 8),
              Text('Outdoor', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            ],
          ),
          const SizedBox(height: 12),
          Text('${weather!.temperature.toStringAsFixed(1)}°C', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: textColor)),
          Text(weather!.label, style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.6))),
          const SizedBox(height: 10),
          if (weather!.sunrise != null)
            _Row(icon: Icons.wb_twilight_rounded, label: 'Sunrise ${DateFormat('HH:mm').format(weather!.sunrise!)}', textColor: textColor),
          if (weather!.sunset != null)
            _Row(icon: Icons.nights_stay_rounded, label: 'Sunset ${DateFormat('HH:mm').format(weather!.sunset!)}', textColor: textColor),
          _Row(icon: Icons.wb_sunny_outlined, label: 'UV index ${weather!.uvIndex.toStringAsFixed(0)}', textColor: textColor),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color textColor;

  const _Row({required this.icon, required this.label, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: textColor.withValues(alpha: 0.6)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.75))),
        ],
      ),
    );
  }
}
