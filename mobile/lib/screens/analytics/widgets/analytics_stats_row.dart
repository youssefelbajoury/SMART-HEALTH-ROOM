import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/analytics.dart';
import '../../../widgets/glass_card.dart';

/// The 5 range-scoped statistics computed by `computeAnalyticsStats()`.
class AnalyticsStatsRow extends StatelessWidget {
  final AnalyticsStats stats;
  final bool isDay;

  const AnalyticsStatsRow({super.key, required this.stats, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.warning_amber_rounded, 'Warnings', '${stats.warnings}', AppColors.warning),
      (Icons.emergency_rounded, 'Emergencies', '${stats.emergencies}', AppColors.danger),
      (Icons.bed_rounded, 'Bed Occupancy', '${stats.bedOccupancyPercent.toStringAsFixed(0)}%', AppColors.sleepViolet),
      (Icons.favorite_rounded, 'Avg Health', stats.avgHealthScore.toStringAsFixed(0), AppColors.fine),
      (Icons.shield_rounded, 'Avg Quality', '${stats.avgRoomQuality.toStringAsFixed(0)}%', AppColors.info),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.1,
      children: items.map((item) {
        final (icon, label, value, color) = item;
        final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
        return GlassCard(
          isDay: isDay,
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textColor)),
                    Text(label, style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.6))),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
