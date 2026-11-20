import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

/// Connection settings for the existing Smart Health Room backend.
///
/// The web app hardcodes `http://localhost:5000/api/v1` because the browser
/// runs on the same machine as the backend. A mobile device/emulator cannot
/// reach `localhost` the same way, so the default host is resolved per
/// platform. A LAN IP override can be set at runtime (persisted) for testing
/// against real hardware, from Settings — never a different backend.
class ApiConfig {
  ApiConfig._();

  static const int port = 5000;
  static const String apiPrefix = '/api/v1';

  /// Runtime override (e.g. the backend's LAN IP, matching the ESP32's
  /// configured SERVER_HOST) set from Settings and persisted by
  /// [StorageService]. Null until loaded/set.
  static String? _hostOverride;

  static void setHostOverride(String? host) {
    _hostOverride = (host == null || host.trim().isEmpty) ? null : host.trim();
  }

  static String get _defaultHost {
    // Web always talks to the same host serving the app (mirrors the web
    // app's own hardcoded `localhost`) — `Platform`/`defaultTargetPlatform`'s
    // notion of "Android" would otherwise misfire for e.g. Chrome on an
    // Android phone, which is not the emulator's virtual host loopback.
    if (kIsWeb) return 'localhost';
    if (defaultTargetPlatform == TargetPlatform.android) return '10.0.2.2';
    return 'localhost';
  }

  static String get host => _hostOverride ?? _defaultHost;

  static String get baseHttpUrl => 'http://$host:$port';

  static String get baseApiUrl => '$baseHttpUrl$apiPrefix';

  static String get socketUrl => baseHttpUrl;
}
