import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smart_assistant.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/stat_pill.dart';

/// Ported from `SmartAssistantSummaryCard.tsx` — a hero-style summary card
/// fed by `useSmartAssistant()`'s context + recommendations + summary
/// sentences, with a critical-red variant when any recommendation is
/// `critical` severity.
class AssistantSummaryCard extends StatelessWidget {
  final bool isDay;
  final List<String> sentences;
  final List<AssistantRecommendation> recommendations;
  final int healthScore;
  final int roomQuality;
  final bool presence;

  const AssistantSummaryCard({
    super.key,
    required this.isDay,
    required this.sentences,
    required this.recommendations,
    required this.healthScore,
    required this.roomQuality,
    required this.presence,
  });

  @override
  Widget build(BuildContext context) {
    final hasCritical = recommendations.any((r) => r.severity == AssistantSeverity.critical);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return GlassCard(
      isDay: isDay,
      tint: hasCritical ? AppColors.destructive.withValues(alpha: 0.14) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: hasCritical ? AppColors.destructive : AppColors.primary400),
              const SizedBox(width: 8),
              Text('AI Assistant', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            ],
          ),
          const SizedBox(height: 12),
          if (sentences.isNotEmpty)
            Text(
              sentences.first,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: textColor),
            ),
          if (sentences.length > 1) ...[
            const SizedBox(height: 6),
            Text(
              sentences.skip(1).join(' '),
              style: TextStyle(fontSize: 13.5, color: textColor.withValues(alpha: 0.75), height: 1.4),
            ),
          ],
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              StatPill(icon: Icons.favorite_rounded, label: 'Health $healthScore', color: AppColors.fine),
              StatPill(icon: Icons.shield_rounded, label: 'Quality $roomQuality%', color: AppColors.info),
              StatPill(
                icon: presence ? Icons.person_rounded : Icons.person_off_rounded,
                label: presence ? 'Occupied' : 'Vacant',
                color: presence ? AppColors.sleepViolet : AppColors.secondary400,
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.04, end: 0);
  }
}
