import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/room_quality.dart';
import '../../../widgets/circular_gauge.dart';
import '../../../widgets/glass_card.dart';

/// Ported from `RoomQualityIndexCard.tsx` — circular gauge for the overall
/// score, plus 4 progress rows (comfort/airQuality/safety/energyEfficiency)
/// with their `explanations[key]` captions.
class RoomQualityCard extends StatelessWidget {
  final RoomQualityResult result;
  final bool isDay;

  const RoomQualityCard({super.key, required this.result, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final rows = [
      (_SubScore('Comfort', Icons.thermostat_rounded, result.comfort, result.explanations['comfort'])),
      (_SubScore('Air Quality', Icons.air_rounded, result.airQuality, result.explanations['airQuality'])),
      (_SubScore('Safety', Icons.shield_rounded, result.safety, result.explanations['safety'])),
      (_SubScore('Efficiency', Icons.bolt_rounded, result.energyEfficiency, result.explanations['energyEfficiency'])),
    ];

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Room Quality', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
          const SizedBox(height: 12),
          Center(
            child: CircularGauge(
              value: result.overall,
              color: AppColors.info,
              trackColor: textColor.withValues(alpha: 0.1),
              size: 108,
              center: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${result.overall}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.info)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          ...rows.map((row) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(row.icon, size: 15, color: textColor.withValues(alpha: 0.7)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(row.label, style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.85))),
                        ),
                        Text('${row.score}%', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: textColor)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: row.score / 100,
                        minHeight: 5,
                        backgroundColor: textColor.withValues(alpha: 0.08),
                        valueColor: AlwaysStoppedAnimation(_scoreColor(row.score)),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Color _scoreColor(int score) {
    if (score >= 80) return AppColors.fine;
    if (score >= 50) return AppColors.warning;
    return AppColors.danger;
  }
}

class _SubScore {
  final String label;
  final IconData icon;
  final int score;
  final String? explanation;
  _SubScore(this.label, this.icon, this.score, this.explanation);
}
