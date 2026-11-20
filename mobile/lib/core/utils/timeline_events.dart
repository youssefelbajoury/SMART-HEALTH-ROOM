import 'package:flutter/material.dart';
import '../../models/alert.dart';
import '../../models/emergency.dart';
import '../../models/log_entry.dart';
import '../../models/order.dart';
import '../theme/app_colors.dart';
import 'order_status.dart';

enum TimelineCategory { alert, emergency, order, log }

/// A single normalized timeline entry — the shared shape behind both the
/// Dashboard's compact "Latest Activity" card and the full Timeline screen,
/// so the merge/sort logic lives in exactly one place.
class TimelineEvent {
  final DateTime time;
  final String message;
  final IconData icon;
  final Color color;
  final TimelineCategory category;

  TimelineEvent({
    required this.time,
    required this.message,
    required this.icon,
    required this.color,
    required this.category,
  });
}

IconData _alertIcon(String type) => switch (type) {
      'danger' => Icons.error_rounded,
      'warning' => Icons.warning_rounded,
      _ => Icons.info_rounded,
    };

Color _alertColor(String type) => switch (type) {
      'danger' => AppColors.danger,
      'warning' => AppColors.warning,
      _ => AppColors.info,
    };

/// Merges any subset of the app's realtime-backed sources into one
/// newest-first timeline — the mobile equivalent of the web app's
/// `useUnifiedEvents`, built only from data this app already fetches (no
/// new endpoints).
List<TimelineEvent> buildTimelineEvents({
  List<AppAlert> alerts = const [],
  List<Emergency> emergencies = const [],
  List<Order> orders = const [],
  List<LogEntry> logs = const [],
}) {
  final events = <TimelineEvent>[
    ...alerts.map((a) => TimelineEvent(
          time: a.timestamp,
          message: a.message,
          icon: _alertIcon(a.type),
          color: _alertColor(a.type),
          category: TimelineCategory.alert,
        )),
    ...emergencies.expand((e) {
      final items = [
        TimelineEvent(
          time: e.createdAt,
          message: 'Emergency: ${e.message}',
          icon: Icons.warning_rounded,
          color: AppColors.danger,
          category: TimelineCategory.emergency,
        ),
      ];
      if (e.resolvedAt != null) {
        items.add(TimelineEvent(
          time: e.resolvedAt!,
          message: 'Emergency resolved: ${e.message}',
          icon: Icons.check_circle_rounded,
          color: AppColors.fine,
          category: TimelineCategory.emergency,
        ));
      }
      return items;
    }),
    ...orders.expand((o) => o.timeline.map((t) {
          final style = orderStatusStyle(t.status);
          return TimelineEvent(
            time: t.at,
            message: 'Order (${o.fullName}): ${style.label}',
            icon: style.icon,
            color: style.color,
            category: TimelineCategory.order,
          );
        })),
    ...logs.map((l) => TimelineEvent(
          time: l.createdAt,
          message: l.message,
          icon: switch (l.level) {
            'error' => Icons.error_rounded,
            'warning' => Icons.warning_rounded,
            'success' => Icons.check_circle_rounded,
            _ => Icons.info_rounded,
          },
          color: switch (l.level) {
            'error' => AppColors.danger,
            'warning' => AppColors.warning,
            'success' => AppColors.fine,
            _ => AppColors.info,
          },
          category: TimelineCategory.log,
        )),
  ];
  events.sort((a, b) => b.time.compareTo(a.time));
  return events;
}

/// Groups already-sorted (newest-first) events by calendar day, with
/// "Today"/"Yesterday" labels for the two most recent groups.
Map<String, List<TimelineEvent>> groupByDay(List<TimelineEvent> events) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final yesterday = today.subtract(const Duration(days: 1));
  final grouped = <String, List<TimelineEvent>>{};

  for (final event in events) {
    final day = DateTime(event.time.year, event.time.month, event.time.day);
    final String label;
    if (day == today) {
      label = 'Today';
    } else if (day == yesterday) {
      label = 'Yesterday';
    } else {
      label = '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    }
    grouped.putIfAbsent(label, () => []).add(event);
  }
  return grouped;
}
