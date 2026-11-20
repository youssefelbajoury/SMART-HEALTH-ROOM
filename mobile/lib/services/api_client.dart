import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/api_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

/// Thin REST client mirroring the web app's `authHeaders()` + raw `fetch()`
/// pattern (`web/src/lib/api.ts`) — every request attaches the Bearer token
/// from storage; no new endpoints are introduced, only the existing
/// `/api/v1/*` surface documented in the backend.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  /// Mirrors the web app's global `SessionGuard`: called on any 401 from an
  /// authenticated request so the app can force-logout.
  void Function()? onUnauthorized;

  Future<Map<String, String>> _headers({bool authorized = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (authorized) {
      final token = await StorageService.instance.accessToken;
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final base = Uri.parse('${ApiConfig.baseApiUrl}$path');
    if (query == null || query.isEmpty) return base;
    return base.replace(queryParameters: {
      ...base.queryParameters,
      ...query.map((k, v) => MapEntry(k, v.toString())),
    });
  }

  dynamic _decode(http.Response res, {required bool authorized}) {
    if (res.statusCode == 401 && authorized) {
      onUnauthorized?.call();
    }
    final body = res.body.isEmpty ? {} : jsonDecode(res.body);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final message = (body is Map && body['message'] != null) ? body['message'].toString() : 'Request failed';
      throw ApiException(res.statusCode, message);
    }
    return body;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query, bool authorized = true}) async {
    final res = await http
        .get(_uri(path, query), headers: await _headers(authorized: authorized))
        .timeout(const Duration(seconds: 15));
    return _decode(res, authorized: authorized);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body, bool authorized = true}) async {
    final res = await http
        .post(_uri(path), headers: await _headers(authorized: authorized), body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 15));
    return _decode(res, authorized: authorized);
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? body, bool authorized = true}) async {
    final res = await http
        .patch(_uri(path), headers: await _headers(authorized: authorized), body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 15));
    return _decode(res, authorized: authorized);
  }

  Future<dynamic> delete(String path, {bool authorized = true}) async {
    final res =
        await http.delete(_uri(path), headers: await _headers(authorized: authorized)).timeout(const Duration(seconds: 15));
    return _decode(res, authorized: authorized);
  }
}
