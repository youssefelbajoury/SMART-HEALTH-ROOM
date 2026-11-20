import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../repositories/auth_repository.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Mirrors `web/src/store/authStore.ts`: persists the session, and (like the
/// web app's `SessionGuard`) force-logs-out on any 401 from an authenticated
/// request.
class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo = AuthRepository();

  AppUser? user;
  AuthStatus status = AuthStatus.unknown;
  bool isLoading = false;
  String? error;

  AuthProvider() {
    ApiClient.instance.onUnauthorized = _forceLogout;
  }

  Future<void> tryAutoLogin() async {
    final token = await StorageService.instance.accessToken;
    final userJson = await StorageService.instance.userJson;
    if (token == null || userJson == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    user = AppUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
    status = AuthStatus.authenticated;
    notifyListeners();
    SocketService.instance.connect(user!.id);
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final (loggedInUser, tokens) = await _repo.login(email: email, password: password);
      await _persistSession(loggedInUser, tokens);
      return true;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String name,
    required String firstName,
  }) async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final (registeredUser, tokens) = await _repo.register(
        email: email,
        password: password,
        name: name,
        firstName: firstName,
      );
      await _persistSession(registeredUser, tokens);
      return true;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _persistSession(AppUser sessionUser, AuthTokens tokens) async {
    await StorageService.instance.saveSession(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userJson: jsonEncode(sessionUser.toJson()),
    );
    user = sessionUser;
    status = AuthStatus.authenticated;
    notifyListeners();
    SocketService.instance.connect(sessionUser.id);
  }

  Future<void> logout() async {
    await StorageService.instance.clearSession();
    SocketService.instance.disconnect();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void _forceLogout() {
    StorageService.instance.clearSession();
    SocketService.instance.disconnect();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
