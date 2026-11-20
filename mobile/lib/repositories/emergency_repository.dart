import '../models/emergency.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/emergencies/*`.
class EmergencyRepository {
  final ApiClient _api = ApiClient.instance;

  Future<Emergency?> active() async {
    final res = await _api.get('/emergencies/active');
    final data = res is Map ? (res['data'] ?? res['emergency']) : res;
    if (data == null || (data as Map).isEmpty) return null;
    return Emergency.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<Emergency>> history() async {
    final res = await _api.get('/emergencies');
    final list = (res is Map ? res['data'] : res) as List? ?? [];
    return list.map((e) => Emergency.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  Future<void> resolve(String id) => _api.patch('/emergencies/$id/resolve');
}
