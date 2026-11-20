import 'package:flutter/foundation.dart';
import '../models/alert.dart';
import '../repositories/alert_repository.dart';
import '../services/socket_service.dart';

/// Mirrors `web/src/store/alertStore.ts`: fetch once, then prepend/cap on
/// the realtime `new-alert` broadcast (server also emits this per threshold
/// breach — see `AlertService.checkAndCreate`).
class AlertProvider extends ChangeNotifier {
  final AlertRepository _repo = AlertRepository();

  List<AppAlert> alerts = [];
  int unreadCount = 0;
  bool isLoading = false;
  bool _subscribed = false;

  Future<void> init() async {
    await Future.wait([fetchAlerts(), fetchUnreadCount()]);
    _subscribeToSocket();
  }

  void _subscribeToSocket() {
    if (_subscribed) return;
    _subscribed = true;
    SocketService.instance.on('new-alert', (payload) {
      if (payload is! Map) return;
      // Backend (AlertService.checkAndCreate) broadcasts { alert: {...}, unreadCount } —
      // the alert fields are nested under "alert", matching web/SocketProvider.tsx's
      // `data.alert` — not at the payload's top level.
      final alertJson = payload['alert'];
      if (alertJson is! Map) return;
      final alert = AppAlert.fromJson(Map<String, dynamic>.from(alertJson));
      alerts = [alert, ...alerts].take(50).toList();
      final serverUnreadCount = payload['unreadCount'];
      unreadCount = serverUnreadCount is num ? serverUnreadCount.toInt() : (unreadCount + (alert.read ? 0 : 1));
      notifyListeners();
    });

    // The following three mirror web/SocketProvider.tsx's `alert-read` /
    // `all-alerts-read` / `alert-deleted` handlers exactly, so that marking
    // as read or deleting from ANY client (web or another mobile session)
    // updates this session in realtime too — local-only, never re-issues
    // the REST call that triggered the broadcast in the first place.
    SocketService.instance.on('alert-read', (payload) {
      if (payload is! Map) return;
      final alertId = payload['alertId'] as String?;
      if (alertId != null) {
        alerts = alerts.map((a) => a.id == alertId ? a.copyWith(read: true) : a).toList();
      }
      final serverUnreadCount = payload['unreadCount'];
      if (serverUnreadCount is num) unreadCount = serverUnreadCount.toInt();
      notifyListeners();
    });

    SocketService.instance.on('all-alerts-read', (payload) {
      alerts = alerts.map((a) => a.copyWith(read: true)).toList();
      final serverUnreadCount = payload is Map ? payload['unreadCount'] : null;
      unreadCount = serverUnreadCount is num ? serverUnreadCount.toInt() : 0;
      notifyListeners();
    });

    SocketService.instance.on('alert-deleted', (payload) {
      if (payload is! Map) return;
      final alertId = payload['alertId'] as String?;
      if (alertId != null) {
        alerts = alerts.where((a) => a.id != alertId).toList();
      }
      final serverUnreadCount = payload['unreadCount'];
      if (serverUnreadCount is num) unreadCount = serverUnreadCount.toInt();
      notifyListeners();
    });
  }

  Future<void> fetchAlerts() async {
    isLoading = true;
    notifyListeners();
    try {
      alerts = await _repo.list();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUnreadCount() async {
    unreadCount = await _repo.unreadCount();
    notifyListeners();
  }

  Future<void> markAsRead(String id) async {
    await _repo.markAsRead(id);
    alerts = alerts.map((a) => a.id == id ? a.copyWith(read: true) : a).toList();
    unreadCount = unreadCount > 0 ? unreadCount - 1 : 0;
    notifyListeners();
  }

  Future<void> markAllAsRead() async {
    await _repo.markAllAsRead();
    alerts = alerts.map((a) => a.copyWith(read: true)).toList();
    unreadCount = 0;
    notifyListeners();
  }

  Future<void> deleteAlert(String id) async {
    AppAlert? removed;
    for (final a in alerts) {
      if (a.id == id) removed = a;
    }
    alerts = alerts.where((a) => a.id != id).toList();
    if (removed != null && !removed.read) unreadCount = unreadCount > 0 ? unreadCount - 1 : 0;
    notifyListeners();
    try {
      await _repo.delete(id);
    } catch (_) {
      // Best-effort: a failed delete just means it reappears on the next fetchAlerts().
    }
  }

  Future<void> deleteAll() async {
    final ids = alerts.map((a) => a.id).toList();
    alerts = [];
    unreadCount = 0;
    notifyListeners();
    for (final id in ids) {
      try {
        await _repo.delete(id);
      } catch (_) {
        // Best-effort: a failed delete just means it reappears on the next fetchAlerts().
      }
    }
  }
}
