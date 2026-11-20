import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/log_entry.dart';

class LogRow extends StatelessWidget {
  final LogEntry log;
  final bool isDay;
  final int index;

  const LogRow({super.key, required this.log, required this.isDay, this.index = 0});

  Color get _color => switch (log.level) {
        'error' => AppColors.danger,
        'warning' => AppColors.warning,
        'success' => AppColors.fine,
        _ => AppColors.info,
      };

  IconData get _icon => switch (log.level) {
        'error' => Icons.error_rounded,
        'warning' => Icons.warning_rounded,
        'success' => Icons.check_circle_rounded,
        _ => Icons.info_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border(left: BorderSide(color: _color, width: 3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(_icon, size: 16, color: _color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log.message, style: TextStyle(fontSize: 13, color: textColor)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: textColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(log.source, style: TextStyle(fontSize: 9.5, color: textColor.withValues(alpha: 0.6))),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('MMM d, HH:mm:ss').format(log.createdAt),
                      style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.45)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: (index.clamp(0, 20) * 20).ms, duration: 250.ms).slideX(begin: 0.02, end: 0);
  }
}
