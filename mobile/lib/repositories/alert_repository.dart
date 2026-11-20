import '../models/alert.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/alerts/*` — identical to `web/src/store/alertStore.ts`.
class AlertRepository {
  final ApiClient _api = ApiClient.instance;

  Future<List<AppAlert>> list({int limit = 50, int page = 1}) async {
    final res = await _api.get('/alerts', query: {'limit': limit, 'page': page});
    // Backend (alert.controller.ts getAlerts) responds with { message, alerts, pagination } —
    // the payload list is under "alerts", not "data".
    final list = (res is Map ? res['alerts'] : res) as List? ?? [];
    return list.map((e) => AppAlert.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<int> unreadCount() async {
    final res = await _api.get('/alerts/unread-count');
    return (res['unreadCount'] ?? res['count'] ?? 0) as int;
  }

  Future<void> markAsRead(String id) => _api.patch('/alerts/$id/read');
  Future<void> markAllAsRead() => _api.patch('/alerts/read-all');
  Future<void> delete(String id) => _api.delete('/alerts/$id');
}
