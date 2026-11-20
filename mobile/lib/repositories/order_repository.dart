import '../models/order.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/orders/*` — `POST /orders` (public order intake, no auth)
/// and `GET /orders/me` (the caller's own orders).
class OrderRepository {
  final ApiClient _api = ApiClient.instance;

  Future<Order> createOrder({
    required String firstName,
    required String lastName,
    required DateTime dateOfBirth,
    required String email,
    required String password,
    String? phone,
  }) async {
    final res = await _api.post(
      '/orders',
      authorized: false,
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'dateOfBirth': dateOfBirth.toIso8601String(),
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
    );
    final data = res is Map ? (res['order'] ?? res['data'] ?? res) : res;
    return Order.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<Order>> myOrders() async {
    final res = await _api.get('/orders/me');
    final list = (res is Map ? res['data'] : res) as List? ?? [];
    return list.map((e) => Order.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }
}
