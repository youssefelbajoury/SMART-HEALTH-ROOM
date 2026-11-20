import 'package:flutter/foundation.dart';
import '../models/admin_emergency.dart';
import '../models/admin_user.dart';
import '../models/order.dart';
import '../repositories/admin_repository.dart';

/// Mirrors `web/src/store/admin-store.ts` + `web/src/store/order-admin-store.ts`
/// combined — the admin-only back-office state (user management, order
/// management, system-wide emergencies), kept in one provider since a single
/// `AdminShell` screen set is the only consumer (unlike the web app, which
/// splits them across two Zustand stores driving several pages).
class AdminProvider extends ChangeNotifier {
  final AdminRepository _repo = AdminRepository();

  // --- Users ---------------------------------------------------------
  List<AdminUser> users = [];
  Pagination usersPagination = const Pagination();
  AdminUserStats userStats = const AdminUserStats();
  String usersSearch = '';
  String usersRoleFilter = 'all';
  String usersStatusFilter = 'all';
  int usersPage = 1;
  bool isLoadingUsers = false;
  String? usersError;

  // --- Orders ----------------------------------------------------------
  List<Order> orders = [];
  Pagination ordersPagination = const Pagination();
  AdminOrderStats orderStats = const AdminOrderStats();
  String ordersStatusFilter = 'all';
  int ordersPage = 1;
  bool isLoadingOrders = false;
  String? ordersError;

  // --- Emergencies -------------------------------------------------------
  List<AdminEmergency> emergencies = [];
  Pagination emergenciesPagination = const Pagination();
  String emergenciesStatusFilter = 'all';
  bool isLoadingEmergencies = false;
  String? emergenciesError;

  Future<void> init() async {
    await Future.wait([fetchUsers(), fetchUserStats(), fetchOrders(), fetchOrderStats(), fetchEmergencies()]);
  }

  // --- Users ---------------------------------------------------------

  Future<void> fetchUsers() async {
    isLoadingUsers = true;
    usersError = null;
    notifyListeners();
    try {
      final (list, pagination) = await _repo.listUsers(
        search: usersSearch,
        role: usersRoleFilter,
        status: usersStatusFilter,
        page: usersPage,
      );
      users = list;
      usersPagination = pagination;
    } catch (e) {
      usersError = e.toString();
    } finally {
      isLoadingUsers = false;
      notifyListeners();
    }
  }

  Future<void> fetchUserStats() async {
    try {
      userStats = await _repo.getUserStats();
      notifyListeners();
    } catch (_) {
      // Stats are non-critical — silently keep the last known values (mirrors web).
    }
  }

  Future<void> setUsersSearch(String value) async {
    usersSearch = value;
    usersPage = 1;
    await fetchUsers();
  }

  Future<void> setUsersRoleFilter(String value) async {
    usersRoleFilter = value;
    usersPage = 1;
    await fetchUsers();
  }

  Future<void> setUsersStatusFilter(String value) async {
    usersStatusFilter = value;
    usersPage = 1;
    await fetchUsers();
  }

  Future<void> setUsersPage(int value) async {
    usersPage = value;
    await fetchUsers();
  }

  Future<AdminUser?> createUser({
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
    final user = await _repo.createUser(
      name: name,
      email: email,
      password: password,
      role: role,
      firstName: firstName,
      dateOfBirth: dateOfBirth,
      phone: phone,
      address: address,
      deviceId: deviceId,
    );
    await Future.wait([fetchUsers(), fetchUserStats()]);
    return user;
  }

  Future<void> updateUser(
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
    await _repo.updateUser(
      id,
      name: name,
      email: email,
      role: role,
      firstName: firstName,
      dateOfBirth: dateOfBirth,
      phone: phone,
      address: address,
      deviceId: deviceId,
    );
    await fetchUsers();
  }

  Future<void> deleteUser(String id) async {
    await _repo.deleteUser(id);
    await Future.wait([fetchUsers(), fetchUserStats()]);
  }

  Future<void> setSuspended(String id, bool suspended) async {
    await _repo.setSuspended(id, suspended);
    await Future.wait([fetchUsers(), fetchUserStats()]);
  }

  Future<void> resetPassword(String id, String newPassword) => _repo.resetPassword(id, newPassword);

  // --- Orders ----------------------------------------------------------

  Future<void> fetchOrders() async {
    isLoadingOrders = true;
    ordersError = null;
    notifyListeners();
    try {
      final (list, pagination) = await _repo.listOrders(status: ordersStatusFilter, page: ordersPage);
      orders = list;
      ordersPagination = pagination;
    } catch (e) {
      ordersError = e.toString();
    } finally {
      isLoadingOrders = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderStats() async {
    try {
      orderStats = await _repo.getOrderStats();
      notifyListeners();
    } catch (_) {
      // Stats are non-critical — silently keep the last known values (mirrors web).
    }
  }

  Future<void> setOrdersStatusFilter(String value) async {
    ordersStatusFilter = value;
    ordersPage = 1;
    await fetchOrders();
  }

  Future<void> setOrdersPage(int value) async {
    ordersPage = value;
    await fetchOrders();
  }

  Future<void> acceptOrder(String id) async {
    await _repo.acceptOrder(id);
    await Future.wait([fetchOrders(), fetchOrderStats()]);
  }

  Future<void> rejectOrder(String id) async {
    await _repo.rejectOrder(id);
    await Future.wait([fetchOrders(), fetchOrderStats()]);
  }

  // --- Emergencies -------------------------------------------------------

  Future<void> fetchEmergencies() async {
    isLoadingEmergencies = true;
    emergenciesError = null;
    notifyListeners();
    try {
      final (list, pagination) = await _repo.listEmergencies(status: emergenciesStatusFilter);
      emergencies = list;
      emergenciesPagination = pagination;
    } catch (e) {
      emergenciesError = e.toString();
    } finally {
      isLoadingEmergencies = false;
      notifyListeners();
    }
  }

  Future<void> setEmergenciesStatusFilter(String value) async {
    emergenciesStatusFilter = value;
    await fetchEmergencies();
  }
}
