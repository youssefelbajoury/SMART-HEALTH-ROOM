import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/alert.dart';
import '../../../widgets/glass_card.dart';

/// Mobile-native "Latest Alerts" card, built from the same `AlertProvider`
/// data source as the web dashboard's alert bell / Live Event Center
/// (`GET /alerts`, newest-first) — just laid out as a compact list suited
/// to a phone screen instead of a dropdown.
class LatestAlertsCard extends StatelessWidget {
  final List<AppAlert> alerts;
  final bool isDay;
  final VoidCallback? onMarkAllRead;

  const LatestAlertsCard({super.key, required this.alerts, required this.isDay, this.onMarkAllRead});

  Color _colorFor(String type) => switch (type) {
        'danger' => AppColors.danger,
        'warning' => AppColors.warning,
        _ => AppColors.info,
      };

  IconData _iconFor(String type) => switch (type) {
        'danger' => Icons.error_rounded,
        'warning' => Icons.warning_rounded,
        _ => Icons.info_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final latest = alerts.take(5).toList();

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('Latest Alerts', style: TextStyle(fontWeight: FontWeight.w700, color: textColor))),
              if (alerts.any((a) => !a.read) && onMarkAllRead != null)
                TextButton(
                  onPressed: onMarkAllRead,
                  child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (latest.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text('No alerts — everything looks fine.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
              ),
            )
          else
            ...latest.map((alert) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(_iconFor(alert.type), size: 18, color: _colorFor(alert.type)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              alert.message,
                              style: TextStyle(
                                fontSize: 13,
                                color: textColor,
                                fontWeight: alert.read ? FontWeight.w400 : FontWeight.w600,
                              ),
                            ),
                            Text(
                              DateFormat('MMM d, HH:mm').format(alert.timestamp.toLocal()),
                              style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.5)),
                            ),
                          ],
                        ),
                      ),
                      if (!alert.read)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: BoxDecoration(color: _colorFor(alert.type), shape: BoxShape.circle),
                        ),
                    ],
                  ),
                )),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }
}
