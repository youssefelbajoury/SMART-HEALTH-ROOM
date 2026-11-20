import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/health_score.dart';
import '../../../core/utils/thresholds.dart';
import '../../../widgets/circular_gauge.dart';
import '../../../widgets/glass_card.dart';

/// Ported from `HealthScoreCard.tsx` — circular gauge + top breakdown items,
/// computed locally from the live `SensorData` via `calculateHealthScore()`.
class HealthScoreCard extends StatelessWidget {
  final HealthScoreResult result;
  final bool isDay;

  const HealthScoreCard({super.key, required this.result, required this.isDay});

  Color get _statusColor => switch (result.status) {
        'excellent' => AppColors.fine,
        'warning' => AppColors.warning,
        _ => AppColors.danger,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final top = [...result.breakdown]..sort((a, b) => a.score.compareTo(b.score));

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Health Score', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
          const SizedBox(height: 12),
          Center(
            child: CircularGauge(
              value: result.score,
              color: _statusColor,
              trackColor: textColor.withValues(alpha: 0.1),
              size: 108,
              center: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${result.score}', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: _statusColor)),
                  Text(
                    result.status,
                    style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.6)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          ...top.take(4).map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(color: _levelColor(item.level), shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(item.label, style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.8))),
                    ),
                    Text('${item.score}', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: textColor)),
                  ],
                ),
              )),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Color _levelColor(ThresholdLevel level) => switch (level) {
        ThresholdLevel.fine => AppColors.fine,
        ThresholdLevel.warning => AppColors.warning,
        ThresholdLevel.danger => AppColors.danger,
      };
}
