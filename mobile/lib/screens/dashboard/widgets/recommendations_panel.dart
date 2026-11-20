import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smart_assistant.dart';
import '../../../widgets/glass_card.dart';

/// Ported from `SmartRecommendationsPanel.tsx` — expandable list showing
/// each recommendation's `reasons[]` and computed `confidence`.
class RecommendationsPanel extends StatelessWidget {
  final List<AssistantRecommendation> recommendations;
  final bool isDay;

  const RecommendationsPanel({super.key, required this.recommendations, required this.isDay});

  Color _colorFor(AssistantSeverity severity) => switch (severity) {
        AssistantSeverity.critical => AppColors.danger,
        AssistantSeverity.warning => AppColors.warning,
        AssistantSeverity.info => AppColors.info,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb_rounded, color: AppColors.primary400, size: 20),
              const SizedBox(width: 8),
              Text('Recommendations', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            ],
          ),
          const SizedBox(height: 10),
          if (recommendations.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text('No recommendations right now — everything looks good.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
            )
          else
            ...recommendations.map((rec) => _RecommendationTile(rec: rec, color: _colorFor(rec.severity), textColor: textColor)),
        ],
      ),
    );
  }
}

class _RecommendationTile extends StatefulWidget {
  final AssistantRecommendation rec;
  final Color color;
  final Color textColor;

  const _RecommendationTile({required this.rec, required this.color, required this.textColor});

  @override
  State<_RecommendationTile> createState() => _RecommendationTileState();
}

class _RecommendationTileState extends State<_RecommendationTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Material(
        color: widget.color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => setState(() => _expanded = !_expanded),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(width: 6, height: 6, decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(widget.rec.message, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: widget.textColor)),
                    ),
                    Text('${widget.rec.confidence}%', style: TextStyle(fontSize: 11, color: widget.color, fontWeight: FontWeight.w700)),
                    Icon(_expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, size: 18, color: widget.textColor.withValues(alpha: 0.5)),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 8),
                  ...widget.rec.reasons.map((reason) => Padding(
                        padding: const EdgeInsets.only(top: 3, left: 14),
                        child: Text('• $reason', style: TextStyle(fontSize: 12, color: widget.textColor.withValues(alpha: 0.65))),
                      )),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
