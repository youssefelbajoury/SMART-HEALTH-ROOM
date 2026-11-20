import '../models/admin_emergency.dart';
import '../models/admin_user.dart';
import '../models/order.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/admin/*` — every route here is `requireRole('admin')` on
/// the backend (`backend/src/middleware/rbac.middleware.ts`), identical
/// endpoints/payloads to `web/src/store/admin-store.ts` and
/// `web/src/store/order-admin-store.ts`. No new admin surface is introduced.
class AdminRepository {
  final ApiClient _api = ApiClient.instance;

  // --- Users ---------------------------------------------------------

  Future<(List<AdminUser>, Pagination)> listUsers({
    String? search,
    String? role,
    String? status,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
    int page = 1,
  }) async {
    final res = await _api.get('/admin/users', query: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (role != null && role != 'all') 'role': role,
      if (status != null && status != 'all') 'status': status,
      'sortBy': sortBy,
      'sortOrder': sortOrder,
      'page': page,
    });
    final users = ((res['users'] as List?) ?? [])
        .map((e) => AdminUser.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return (users, Pagination.fromJson(res['pagination'] as Map<String, dynamic>?));
  }

  Future<AdminUserStats> getUserStats() async {
    final res = await _api.get('/admin/stats');
    return AdminUserStats.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<AdminUser> createUser({
    required String name,
    required String email,
    required String password,
    String role = 'user',
    String? firstName,
    DateTime? dateOfBirth,
    String? phone,
    String? address,
    String? deviceId,
  }) async {
    final res = await _api.post('/admin/users', body: {
      'name': name,
      'email': email,
      'password': password,
      'role': role,
      if (firstName != null) 'firstName': firstName,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (deviceId != null) 'deviceId': deviceId,
    });
    return AdminUser.fromJson(Map<String, dynamic>.from(res['user'] as Map));
  }

  Future<AdminUser> updateUser(
    String id, {
    String? name,
    String? email,
    String? role,
    String? firstName,
    DateTime? dateOfBirth,
    String? phone,
    String? address,
    String? deviceId,
  }) async {
    final res = await _api.patch('/admin/users/$id', body: {
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (role != null) 'role': role,
      if (firstName != null) 'firstName': firstName,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (deviceId != null) 'deviceId': deviceId,
    });
    return AdminUser.fromJson(Map<String, dynamic>.from(res['user'] as Map));
  }

  Future<void> deleteUser(String id) => _api.delete('/admin/users/$id');

  Future<AdminUser> setSuspended(String id, bool suspended) async {
    final res = await _api.patch('/admin/users/$id/suspend', body: {'suspended': suspended});
    return AdminUser.fromJson(Map<String, dynamic>.from(res['user'] as Map));
  }

  Future<void> resetPassword(String id, String newPassword) =>
      _api.patch('/admin/users/$id/reset-password', body: {'newPassword': newPassword});

  // --- Orders ----------------------------------------------------------

  Future<(List<Order>, Pagination)> listOrders({
    String? search,
    String? status,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
    int page = 1,
  }) async {
    final res = await _api.get('/admin/orders', query: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status != 'all') 'status': status,
      'sortBy': sortBy,
      'sortOrder': sortOrder,
      'page': page,
    });
    final orders =
        ((res['orders'] as List?) ?? []).map((e) => Order.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    return (orders, Pagination.fromJson(res['pagination'] as Map<String, dynamic>?));
  }

  Future<AdminOrderStats> getOrderStats() async {
    final res = await _api.get('/admin/orders/stats');
    return AdminOrderStats.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<Order> getOrderById(String id) async {
    final res = await _api.get('/admin/orders/$id');
    return Order.fromJson(Map<String, dynamic>.from(res['order'] as Map));
  }

  Future<Order> acceptOrder(String id) async {
    final res = await _api.patch('/admin/orders/$id/accept');
    return Order.fromJson(Map<String, dynamic>.from(res['order'] as Map));
  }

  Future<void> rejectOrder(String id) => _api.patch('/admin/orders/$id/reject');

  // --- System-wide emergencies ------------------------------------------

  Future<(List<AdminEmergency>, Pagination)> listEmergencies({String? status, int page = 1}) async {
    final res = await _api.get('/admin/emergencies', query: {
      if (status != null && status != 'all') 'status': status,
      'page': page,
    });
    final emergencies = ((res['emergencies'] as List?) ?? [])
        .map((e) => AdminEmergency.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return (emergencies, Pagination.fromJson(res['pagination'] as Map<String, dynamic>?));
  }
}
