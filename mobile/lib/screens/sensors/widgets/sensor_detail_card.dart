import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/thresholds.dart';
import '../../../core/utils/trend.dart';
import '../../../widgets/glass_card.dart';

/// One detailed sensor card — value, status, thresholds, a matched
/// recommendation, and a trend arrow over recent history. Reused for every
/// metric on the Sensors screen so no per-sensor layout is duplicated.
class SensorDetailCard extends StatefulWidget {
  final IconData icon;
  final String label;
  final double value;
  final String unit;
  final ThresholdLevel? level;
  final ThresholdDef? threshold;
  final String recommendation;
  final SensorTrend trend;
  final bool isDay;
  final String? heroTag;

  const SensorDetailCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.unit,
    required this.level,
    required this.threshold,
    required this.recommendation,
    required this.trend,
    required this.isDay,
    this.heroTag,
  });

  @override
  State<SensorDetailCard> createState() => _SensorDetailCardState();
}

class _SensorDetailCardState extends State<SensorDetailCard> {
  late double _previousValue = widget.value;

  @override
  void didUpdateWidget(covariant SensorDetailCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _previousValue = oldWidget.value;
    }
  }

  IconData get icon => widget.icon;
  String get label => widget.label;
  double get value => widget.value;
  String get unit => widget.unit;
  ThresholdLevel? get level => widget.level;
  ThresholdDef? get threshold => widget.threshold;
  String get recommendation => widget.recommendation;
  SensorTrend get trend => widget.trend;
  bool get isDay => widget.isDay;
  String? get heroTag => widget.heroTag;

  Color get _statusColor => switch (level) {
        ThresholdLevel.danger => AppColors.danger,
        ThresholdLevel.warning => AppColors.warning,
        ThresholdLevel.fine => AppColors.fine,
        null => AppColors.sleepViolet,
      };

  String get _statusLabel => switch (level) {
        ThresholdLevel.danger => 'Danger',
        ThresholdLevel.warning => 'Warning',
        ThresholdLevel.fine => 'Fine',
        null => 'Info',
      };

  IconData get _trendIcon => switch (trend) {
        SensorTrend.up => Icons.trending_up_rounded,
        SensorTrend.down => Icons.trending_down_rounded,
        SensorTrend.stable => Icons.trending_flat_rounded,
        SensorTrend.unknown => Icons.remove_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final icon0 = Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: _statusColor.withValues(alpha: 0.15), shape: BoxShape.circle),
      child: Icon(icon, color: _statusColor),
    );

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              heroTag != null ? Hero(tag: heroTag!, child: icon0) : icon0,
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                    Text(_statusLabel, style: TextStyle(fontSize: 12, color: _statusColor, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Icon(_trendIcon, size: 20, color: textColor.withValues(alpha: 0.5)),
            ],
          ),
          const SizedBox(height: 14),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: _previousValue, end: value),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
            builder: (context, animatedValue, _) => Text(
              '${animatedValue.toStringAsFixed(1)}$unit',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: textColor),
            ),
          ),
          if (threshold != null) ...[
            const SizedBox(height: 8),
            Text(
              'Warning ≥ ${threshold!.warning.toStringAsFixed(0)}$unit · Danger ≥ ${threshold!.danger.toStringAsFixed(0)}$unit',
              style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55)),
            ),
          ],
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: textColor.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              recommendation,
              style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.8), height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}
