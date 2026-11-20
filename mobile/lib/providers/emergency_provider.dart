import 'package:flutter/foundation.dart';
import '../models/emergency.dart';
import '../repositories/emergency_repository.dart';
import '../services/socket_service.dart';

/// Mirrors `web/src/store/emergencyStore.ts`: reflects `emergency:activated`
/// / `emergency:resolved` broadcasts, driven by the backend's
/// `EmergencyService` state machine.
class EmergencyProvider extends ChangeNotifier {
  final EmergencyRepository _repo = EmergencyRepository();

  Emergency? active;
  List<Emergency> history = [];
  bool isLoading = false;
  bool isLoadingHistory = false;
  bool _subscribed = false;

  Future<void> init() async {
    await Future.wait([fetchActive(), fetchHistory()]);
    _subscribeToSocket();
  }

  void _subscribeToSocket() {
    if (_subscribed) return;
    _subscribed = true;
    SocketService.instance.on('emergency:activated', (payload) {
      if (payload is! Map) return;
      active = Emergency.fromJson(Map<String, dynamic>.from(payload));
      notifyListeners();
    });
    SocketService.instance.on('emergency:resolved', (_) {
      active = null;
      fetchHistory();
      notifyListeners();
    });
  }

  Future<void> fetchActive() async {
    isLoading = true;
    notifyListeners();
    try {
      active = await _repo.active();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchHistory() async {
    isLoadingHistory = true;
    notifyListeners();
    try {
      history = await _repo.history();
    } catch (_) {
      // Non-fatal: the Latest Activity feed simply has less to show.
    } finally {
      isLoadingHistory = false;
      notifyListeners();
    }
  }

  Future<void> resolve() async {
    final id = active?.id;
    if (id == null) return;
    await _repo.resolve(id);
    active = null;
    notifyListeners();
    fetchHistory();
  }
}
