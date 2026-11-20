import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/sensor_data.dart';
import '../repositories/sensor_repository.dart';
import '../services/socket_service.dart';
import '../services/storage_service.dart';

/// Mirrors `web/src/store/sensor-store.ts`: the dashboard never polls for
/// live values — it fetches once, then relies entirely on the `sensor-update`
/// Socket.IO broadcast for real-time updates.
class SensorProvider extends ChangeNotifier {
  final SensorRepository _repo = SensorRepository();

  /// Settings' "Offline Data" toggle — set by `SettingsProvider` on load and
  /// on change. When true, a failed fetch falls back to the last
  /// successfully-cached reading instead of leaving the UI empty.
  static bool offlineCacheEnabled = true;

  SensorData? data;
  List<SensorData> history = [];
  bool isLoading = false;
  bool isTogglingLamp = false;
  bool isSendingCommand = false;
  bool isShowingCachedData = false;
  String? error;
  bool _subscribed = false;

  bool get isSocketConnected => SocketService.instance.isConnected;

  Future<void> init() async {
    await Future.wait([fetchLatest(), fetchHistory()]);
    _subscribeToSocket();
  }

  void _subscribeToSocket() {
    if (_subscribed) return;
    _subscribed = true;
    SocketService.instance.on('sensor-update', (payload) {
      if (payload is! Map) return;
      final updated = SensorData.fromJson(Map<String, dynamic>.from(payload));
      data = updated;
      history = [...history, updated];
      if (history.length > 500) {
        history = history.sublist(history.length - 500);
      }
      notifyListeners();
    });
  }

  Future<void> fetchLatest() async {
    isLoading = true;
    notifyListeners();
    try {
      data = await _repo.latest();
      error = null;
      isShowingCachedData = false;
      if (data != null) {
        StorageService.instance.saveLastSensorSnapshotJson(jsonEncode(_snapshotToJson(data!)));
      }
    } catch (e) {
      error = e.toString();
      if (data == null && offlineCacheEnabled) {
        await _loadCachedSnapshot();
      }
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadCachedSnapshot() async {
    final json = await StorageService.instance.lastSensorSnapshotJson;
    if (json == null) return;
    try {
      data = SensorData.fromJson(Map<String, dynamic>.from(jsonDecode(json)));
      isShowingCachedData = true;
    } catch (_) {
      // Corrupted cache — ignore, screen just shows its normal empty/error state.
    }
  }

  Map<String, dynamic> _snapshotToJson(SensorData d) => {
        'deviceId': d.deviceId,
        'userId': d.userId,
        'timestamp': d.timestamp.toIso8601String(),
        'temperature': d.temperature,
        'humidity': d.humidity,
        'airQuality': d.airQuality,
        'pressure': d.pressure,
        'motion': d.motion,
        'soundLevel': d.soundLevel,
        'co2': d.co2,
        'light': d.light,
        'lamp': d.lamp,
        'sleepScore': d.sleepScore,
        'rfid': d.rfid,
        'gas': d.gas,
        'buzzer': d.buzzer,
        'lightStatus': d.lightStatus,
        'servo': d.servo,
        'rgb': {'r': d.rgb.r, 'g': d.rgb.g, 'b': d.rgb.b},
      };

  Future<void> fetchHistory({int hours = 24}) async {
    try {
      history = await _repo.history(hours: hours);
      notifyListeners();
    } catch (_) {
      // Non-fatal: charts/predictive-warning simply have less data to work with.
    }
  }

  Future<void> refresh() => Future.wait([fetchLatest(), fetchHistory()]);

  Future<void> toggleLamp() async {
    if (data == null) return;
    isTogglingLamp = true;
    notifyListeners();
    try {
      await _repo.toggleLamp();
    } finally {
      isTogglingLamp = false;
      notifyListeners();
    }
  }

  Future<void> toggleDoor() => _sendCommand(_repo.toggleDoor);
  Future<void> toggleBuzzer() => _sendCommand(_repo.toggleBuzzer);
  Future<void> setRgb({required int r, required int g, required int b}) =>
      _sendCommand(() => _repo.setRgb(r: r, g: g, b: b));

  Future<void> _sendCommand(Future<void> Function() action) async {
    if (data == null) return;
    isSendingCommand = true;
    notifyListeners();
    try {
      await action();
    } finally {
      isSendingCommand = false;
      notifyListeners();
    }
  }
}
