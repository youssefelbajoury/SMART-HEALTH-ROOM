import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/thresholds.dart';
import '../../../models/sensor_data.dart';
import '../../../widgets/glass_card.dart';

/// Indoor climate summary — split out from the combined `WeatherCard` used
/// on Home so Dashboard can show Indoor/Outdoor as two distinct cards, per
/// the requested layout.
class IndoorWeatherCard extends StatelessWidget {
  final SensorData data;
  final bool isDay;

  const IndoorWeatherCard({super.key, required this.data, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final comfortable = Thresholds.distanceFromComfort(data.temperature, Thresholds.comfortTempRange) == 0;

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.home_rounded, color: comfortable ? AppColors.fine : AppColors.warning, size: 20),
              const SizedBox(width: 8),
              Text('Indoor', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            ],
          ),
          const SizedBox(height: 12),
          Text('${data.temperature.toStringAsFixed(1)}°C', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: textColor)),
          Text(
            comfortable ? 'Comfortable' : 'Outside comfort range',
            style: TextStyle(fontSize: 12, color: (comfortable ? AppColors.fine : AppColors.warning)),
          ),
          const SizedBox(height: 10),
          _Row(icon: Icons.water_drop_rounded, label: '${data.humidity.toStringAsFixed(0)}% humidity', textColor: textColor),
          _Row(icon: Icons.air_rounded, label: '${data.gas.toStringAsFixed(0)} ppm gas', textColor: textColor),
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
