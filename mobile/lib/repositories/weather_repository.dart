import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../models/weather.dart';

/// Ported from `web/src/lib/weather.ts` + `web/src/store/weatherStore.ts` —
/// same Open-Meteo endpoints (no API key), same default coordinates
/// fallback, same 20-minute auto-refresh cadence.
class WeatherRepository {
  static const _defaultLat = 36.8065;
  static const _defaultLon = 10.1815;
  static const refreshInterval = Duration(minutes: 20);
  static const minRefetchInterval = Duration(seconds: 60);

  Future<(double lat, double lon)> _resolveCoordinates() async {
    try {
      final permission = await Geolocator.checkPermission();
      var granted = permission == LocationPermission.always || permission == LocationPermission.whileInUse;
      if (!granted && permission != LocationPermission.deniedForever) {
        final requested = await Geolocator.requestPermission();
        granted = requested == LocationPermission.always || requested == LocationPermission.whileInUse;
      }
      if (!granted) return (_defaultLat, _defaultLon);

      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return (_defaultLat, _defaultLon);

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.low),
      ).timeout(const Duration(seconds: 5));
      return (position.latitude, position.longitude);
    } catch (_) {
      return (_defaultLat, _defaultLon);
    }
  }

  Future<(WeatherReading weather, double? aqi)> fetch() async {
    final (lat, lon) = await _resolveCoordinates();

    final weatherUri = Uri.parse(
      'https://api.open-meteo.com/v1/forecast'
      '?latitude=$lat&longitude=$lon'
      '&current=temperature_2m,relative_humidity_2m,weather_code,uv_index'
      '&daily=sunrise,sunset&timezone=auto',
    );
    final aqiUri = Uri.parse(
      'https://air-quality-api.open-meteo.com/v1/air-quality'
      '?latitude=$lat&longitude=$lon&current=us_aqi',
    );

    final responses = await Future.wait([
      http.get(weatherUri).timeout(const Duration(seconds: 10)),
      http.get(aqiUri).timeout(const Duration(seconds: 10)),
    ]);

    final weatherJson = jsonDecode(responses[0].body) as Map<String, dynamic>;
    final weather = WeatherReading.fromOpenMeteo(weatherJson);

    double? aqi;
    try {
      final aqiJson = jsonDecode(responses[1].body) as Map<String, dynamic>;
      aqi = (aqiJson['current']?['us_aqi'] as num?)?.toDouble();
    } catch (_) {
      aqi = null;
    }

    return (weather, aqi);
  }
}
