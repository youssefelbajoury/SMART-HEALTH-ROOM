import 'package:flutter/material.dart';
import '../../../core/utils/time_format.dart';
import '../../../core/utils/timeline_events.dart';
import '../../../models/alert.dart';
import '../../../models/emergency.dart';
import '../../../widgets/glass_card.dart';

/// A lightweight "Latest Activity" feed for the Dashboard — reuses the same
/// `buildTimelineEvents()` merge/sort helper as the full Timeline screen
/// (scoped to just alerts + emergency history here), so the merge logic
/// lives in one place instead of being duplicated per screen.
class LatestActivityCard extends StatelessWidget {
  final List<AppAlert> alerts;
  final List<Emergency> emergencies;
  final bool isDay;

  const LatestActivityCard({super.key, required this.alerts, required this.emergencies, required this.isDay});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final latest = buildTimelineEvents(alerts: alerts, emergencies: emergencies).take(8).toList();

    return GlassCard(
      isDay: isDay,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Latest Activity', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
          const SizedBox(height: 10),
          if (latest.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text('No recent activity.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
            )
          else
            ...latest.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(item.icon, size: 16, color: item.color),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(item.message, style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.85))),
                      ),
                      Text(timeAgo(item.time), style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.45))),
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}
