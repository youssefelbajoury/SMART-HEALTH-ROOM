import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../widgets/glass_card.dart';

/// A single status tile in the Room grid — reused for both sensors
/// (Temperature, Humidity, Gas, Light, Sound) and actuators/state
/// (Door, Lamp, RGB, Bed) so the grid stays visually consistent.
class RoomStatusTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? subtitle;
  final Color color;
  final bool isDay;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool isBusy;
  final String? heroTag;

  const RoomStatusTile({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.subtitle,
    required this.color,
    required this.isDay,
    this.onTap,
    this.trailing,
    this.isBusy = false,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final iconWidget = Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
      child: isBusy
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: color),
            )
          : Icon(icon, color: color, size: 20),
    );

    return GlassCard(
      isDay: isDay,
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              heroTag != null ? Hero(tag: heroTag!, child: iconWidget) : iconWidget,
              ?trailing,
            ],
          ),
          const SizedBox(height: 10),
          Text(label, style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.65))),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: textColor),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!, style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.55))),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}
