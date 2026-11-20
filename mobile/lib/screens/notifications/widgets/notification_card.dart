import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/notification_item.dart';

class NotificationCard extends StatelessWidget {
  final NotificationItem item;
  final bool isDay;
  final VoidCallback? onTap;

  const NotificationCard({super.key, required this.item, required this.isDay, this.onTap});

  Color get _color => switch (item.category) {
        NotificationCategory.success => AppColors.fine,
        NotificationCategory.warning => AppColors.warning,
        NotificationCategory.emergency => AppColors.danger,
        NotificationCategory.information => AppColors.info,
      };

  IconData get _icon => switch (item.category) {
        NotificationCategory.success => Icons.check_circle_rounded,
        NotificationCategory.warning => Icons.warning_rounded,
        NotificationCategory.emergency => Icons.emergency_rounded,
        NotificationCategory.information => Icons.info_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Material(
      color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: _color.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(_icon, size: 16, color: _color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.message,
                      style: TextStyle(
                        color: textColor,
                        fontWeight: item.read ? FontWeight.w400 : FontWeight.w700,
                        fontSize: 13.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('MMM d, HH:mm').format(item.timestamp.toLocal()),
                      style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.5)),
                    ),
                  ],
                ),
              ),
              if (!item.read)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(color: _color, shape: BoxShape.circle),
                ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.03, end: 0);
  }
}
