import 'package:flutter/material.dart';
import '../../../core/utils/trend.dart';
import '../../../widgets/glass_card.dart';

/// Compact min/avg/max + trend-arrow summary for one metric over the
/// selected Analytics range — reuses the same `trendFor()` classifier as
/// the Sensors screen.
class TrendStatCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final double min;
  final double max;
  final double avg;
  final String unit;
  final SensorTrend trend;
  final bool isDay;

  const TrendStatCard({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.min,
    required this.max,
    required this.avg,
    required this.unit,
    required this.trend,
    required this.isDay,
  });

  IconData get _trendIcon => switch (trend) {
        SensorTrend.up => Icons.trending_up_rounded,
        SensorTrend.down => Icons.trending_down_rounded,
        SensorTrend.stable => Icons.trending_flat_rounded,
        SensorTrend.unknown => Icons.remove_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return GlassCard(
      isDay: isDay,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textColor))),
              Icon(_trendIcon, size: 16, color: textColor.withValues(alpha: 0.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text('${avg.toStringAsFixed(1)}$unit', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textColor)),
          Text(
            'min ${min.toStringAsFixed(1)} · max ${max.toStringAsFixed(1)}',
            style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.55)),
          ),
        ],
      ),
    );
  }
}
