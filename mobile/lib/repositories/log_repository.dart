import '../models/log_entry.dart';
import '../services/api_client.dart';

/// Wraps `GET /api/v1/logs` — the paginated/filterable technical log
/// stream, scoped server-side to the caller.
class LogRepository {
  final ApiClient _api = ApiClient.instance;

  Future<List<LogEntry>> list({int page = 1, int limit = 30, String? level}) async {
    final res = await _api.get('/logs', query: {
      'page': page,
      'limit': limit,
      'level': ?level,
    });
    final list = (res is Map ? res['data'] : res) as List? ?? [];
    return list.map((e) => LogEntry.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }
}
