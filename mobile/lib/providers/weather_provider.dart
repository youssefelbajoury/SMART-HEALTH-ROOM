import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/weather.dart';
import '../repositories/weather_repository.dart';

/// Mirrors `web/src/store/weatherStore.ts`: 20-minute auto-refresh, and a
/// manual `fetchWeather()` that no-ops if the last fetch was under 60s ago.
class WeatherProvider extends ChangeNotifier {
  final WeatherRepository _repo = WeatherRepository();

  WeatherReading? weather;
  double? outdoorAqi;
  bool isLoading = false;
  DateTime? _lastFetchedAt;
  Timer? _refreshTimer;

  Future<void> fetchWeather({bool force = false}) async {
    if (!force &&
        _lastFetchedAt != null &&
        DateTime.now().difference(_lastFetchedAt!) < WeatherRepository.minRefetchInterval) {
      return;
    }
    if (isLoading) return;
    isLoading = true;
    notifyListeners();
    try {
      final (fetchedWeather, aqi) = await _repo.fetch();
      weather = fetchedWeather;
      outdoorAqi = aqi;
      _lastFetchedAt = DateTime.now();
    } catch (_) {
      // Weather is a supplementary widget — failures shouldn't block the Home screen.
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void startAutoRefresh() {
    _refreshTimer ??= Timer.periodic(WeatherRepository.refreshInterval, (_) => fetchWeather(force: true));
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
}
