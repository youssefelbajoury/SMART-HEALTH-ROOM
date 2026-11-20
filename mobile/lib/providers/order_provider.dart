import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../repositories/order_repository.dart';

/// Mirrors the web app's order pipeline consumption: `POST /orders` (public
/// intake) and `GET /orders/me` (the logged-in caller's own order history).
/// No admin order-management endpoints are used here — those are
/// `admin`-role-only and out of scope for the `user`-role mobile app.
class OrderProvider extends ChangeNotifier {
  final OrderRepository _repo = OrderRepository();

  List<Order> orders = [];
  bool isLoading = false;
  bool isSubmitting = false;
  String? error;

  Future<void> fetchMyOrders() async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      orders = await _repo.myOrders();
    } catch (e) {
      error = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Order?> createOrder({
    required String firstName,
    required String lastName,
    required DateTime dateOfBirth,
    required String email,
    required String password,
    String? phone,
  }) async {
    isSubmitting = true;
    error = null;
    notifyListeners();
    try {
      final order = await _repo.createOrder(
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        email: email,
        password: password,
        phone: phone,
      );
      return order;
    } catch (e) {
      error = e.toString();
      return null;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }
}
