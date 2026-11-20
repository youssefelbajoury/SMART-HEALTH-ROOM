import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/emergency.dart';
import '../../../widgets/glass_card.dart';

class EmergencyStatsRow extends StatelessWidget {
  final List<Emergency> history;
  final bool isActive;
  final bool isDay;

  const EmergencyStatsRow({super.key, required this.history, required this.isActive, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final resolved = history.where((e) => e.resolvedAt != null).toList();
    final avgDuration = resolved.isEmpty
        ? Duration.zero
        : Duration(
            seconds: (resolved.map((e) => e.resolvedAt!.difference(e.createdAt).inSeconds).reduce((a, b) => a + b) /
                    resolved.length)
                .round(),
          );
    final now = DateTime.now();
    final thisMonth = history.where((e) => e.createdAt.year == now.year && e.createdAt.month == now.month).length;

    final items = [
      (Icons.history_rounded, 'Total', '${history.length}', AppColors.info),
      (Icons.warning_rounded, 'Active', isActive ? '1' : '0', isActive ? AppColors.danger : AppColors.fine),
      (Icons.calendar_month_rounded, 'This Month', '$thisMonth', AppColors.warning),
      (Icons.timer_rounded, 'Avg Resolve Time', avgDuration.inMinutes > 0 ? '${avgDuration.inMinutes}m' : '<1m', AppColors.sleepViolet),
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
