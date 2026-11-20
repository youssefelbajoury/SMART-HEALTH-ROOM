import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Wraps token/settings persistence. Tokens go to secure storage (the web
/// app persists its whole auth state to `localStorage`; on mobile the JWT
/// access/refresh tokens deserve OS-level encryption instead).
class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final _secure = const FlutterSecureStorage();

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userJsonKey = 'auth_user_json';
  static const _hostOverrideKey = 'api_host_override';

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String userJson,
  }) async {
    await _secure.write(key: _accessTokenKey, value: accessToken);
    await _secure.write(key: _refreshTokenKey, value: refreshToken);
    await _secure.write(key: _userJsonKey, value: userJson);
  }

  Future<String?> get accessToken => _secure.read(key: _accessTokenKey);
  Future<String?> get refreshToken => _secure.read(key: _refreshTokenKey);
  Future<String?> get userJson => _secure.read(key: _userJsonKey);

  Future<void> clearSession() async {
    await _secure.delete(key: _accessTokenKey);
    await _secure.delete(key: _refreshTokenKey);
    await _secure.delete(key: _userJsonKey);
  }

  Future<String?> get hostOverride async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_hostOverrideKey);
  }

  Future<void> setHostOverride(String? host) async {
    final prefs = await SharedPreferences.getInstance();
    if (host == null || host.trim().isEmpty) {
      await prefs.remove(_hostOverrideKey);
    } else {
      await prefs.setString(_hostOverrideKey, host.trim());
    }
  }

  static const _chatHistoryKey = 'assistant_chat_history';

  Future<String?> get chatHistoryJson async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_chatHistoryKey);
  }

  Future<void> saveChatHistoryJson(String json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_chatHistoryKey, json);
  }

  Future<void> clearChatHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_chatHistoryKey);
  }

  static const _lastSensorSnapshotKey = 'last_sensor_snapshot';

  Future<String?> get lastSensorSnapshotJson async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_lastSensorSnapshotKey);
  }

  Future<void> saveLastSensorSnapshotJson(String json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastSensorSnapshotKey, json);
  }

  /// Clears all locally-cached, non-session data (chat history, cached
  /// sensor snapshot) — used by Settings' "Clear Cache" action. Auth
  /// tokens are untouched; that's what Sign Out is for.
  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_chatHistoryKey);
    await prefs.remove(_lastSensorSnapshotKey);
  }
}
