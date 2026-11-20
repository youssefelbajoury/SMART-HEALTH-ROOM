enum NotificationCategory { success, warning, emergency, information }

/// Unifies `AppAlert` (danger/warning/info) and `Emergency` (active/resolved)
/// into the 4 categories the Notification Center groups by — the mobile
/// equivalent of the web app's merged event feed (`useUnifiedEvents`),
/// scoped to the two realtime sources this app already fetches.
class NotificationItem {
  final String id;
  final NotificationCategory category;
  final String message;
  final DateTime timestamp;
  final bool read;
  final bool isDeletable;

  NotificationItem({
    required this.id,
    required this.category,
    required this.message,
    required this.timestamp,
    required this.read,
    required this.isDeletable,
  });
}
