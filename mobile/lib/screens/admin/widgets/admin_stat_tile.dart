import 'package:flutter/material.dart';
import '../../../widgets/glass_card.dart';

/// One stat card in the admin dashboard's stat grids — the mobile
/// equivalent of web's `StatsCards`/`OrderStatsCards` (same 4 numbers:
/// label, value, icon, accent color), minus the counting animation.
class AdminStatTile extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;
  final Color color;
  final bool isDay;

  const AdminStatTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDay,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    return GlassCard(
      isDay: isDay,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 18, color: color),
              ),
              Text('$value', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textColor)),
            ],
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.6), fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
