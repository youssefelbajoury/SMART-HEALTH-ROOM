import 'package:flutter/foundation.dart';
import '../models/log_entry.dart';
import '../repositories/log_repository.dart';
import '../services/socket_service.dart';

/// Mirrors the web app's Logs page: paginated fetch, realtime `new-log`
/// broadcast (fired by every `LogService.record()` call system-wide, so
/// this feed also backs the Timeline's device/auth/sensor event sections).
class LogProvider extends ChangeNotifier {
  final LogRepository _repo = LogRepository();
  static const _pageSize = 30;

  List<LogEntry> logs = [];
  String? levelFilter;
  bool isLoading = false;
  bool isLoadingMore = false;
  bool hasMore = true;
  int _page = 1;
  bool _subscribed = false;

  Future<void> init() async {
    await fetchLogs(reset: true);
    _subscribeToSocket();
  }

  void _subscribeToSocket() {
    if (_subscribed) return;
    _subscribed = true;
    SocketService.instance.on('new-log', (payload) {
      if (payload is! Map) return;
      final log = LogEntry.fromJson(Map<String, dynamic>.from(payload));
      logs = [log, ...logs];
      notifyListeners();
    });
  }

  Future<void> setLevelFilter(String? level) async {
    levelFilter = level;
    await fetchLogs(reset: true);
  }

  Future<void> fetchLogs({bool reset = false}) async {
    if (reset) {
      _page = 1;
      hasMore = true;
      isLoading = true;
      notifyListeners();
    }
    try {
      final result = await _repo.list(page: _page, limit: _pageSize, level: levelFilter);
      logs = reset ? result : [...logs, ...result];
      hasMore = result.length == _pageSize;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    notifyListeners();
    _page++;
    try {
      final result = await _repo.list(page: _page, limit: _pageSize, level: levelFilter);
      logs = [...logs, ...result];
      hasMore = result.length == _pageSize;
    } finally {
      isLoadingMore = false;
      notifyListeners();
    }
  }
}
