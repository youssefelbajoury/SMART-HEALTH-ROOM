import '../models/sensor_data.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/sensors/*` — identical to `web/src/store/sensor-store.ts`.
class SensorRepository {
  final ApiClient _api = ApiClient.instance;

  Future<SensorData?> latest() async {
    final res = await _api.get('/sensors/latest');
    final data = res is Map && res['data'] != null ? res['data'] : res;
    if (data == null || (data as Map).isEmpty) return null;
    return SensorData.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<SensorData>> history({int hours = 24}) async {
    final res = await _api.get('/sensors/history', query: {'hours': hours});
    final list = (res is Map ? res['data'] : res) as List? ?? [];
    return list.map((e) => SensorData.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<void> toggleLamp() => _api.post('/sensors/lamp/toggle');
  Future<void> toggleDoor() => _api.post('/sensors/door/toggle');
  Future<void> toggleBuzzer() => _api.post('/sensors/buzzer/toggle');
  Future<void> setRgb({required int r, required int g, required int b}) =>
      _api.post('/sensors/rgb', body: {'r': r, 'g': g, 'b': b});
}
