import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'sensor_provider.dart';

enum TemperatureUnit { celsius, fahrenheit }

/// App-wide preferences (distinct from `ThemeProvider`, which governs only
/// the dashboard's real-light-sensor-driven Day/Night ambient theme). These
/// mirror the web app's `useSettingsStore` — client-persisted only, since
/// the backend has no settings endpoint to sync against.
class SettingsProvider extends ChangeNotifier {
  static const _themeModeKey = 'settings_theme_mode';
  static const _notificationsKey = 'settings_notifications_enabled';
  static const _soundKey = 'settings_sound_enabled';
  static const _tempUnitKey = 'settings_temperature_unit';
  static const _reduceMotionKey = 'settings_reduce_motion';
  static const _biometricKey = 'settings_biometric_enabled';
  static const _offlineCacheKey = 'settings_offline_cache_enabled';

  ThemeMode appThemeMode = ThemeMode.dark;
  bool notificationsEnabled = true;
  bool soundEnabled = true;
  TemperatureUnit temperatureUnit = TemperatureUnit.celsius;
  bool reduceMotion = false;
  bool biometricEnabled = false;
  bool offlineCacheEnabled = true;
  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    final prefs = await SharedPreferences.getInstance();
    appThemeMode = ThemeMode.values.firstWhere(
      (m) => m.name == prefs.getString(_themeModeKey),
      orElse: () => ThemeMode.dark,
    );
    notificationsEnabled = prefs.getBool(_notificationsKey) ?? true;
    soundEnabled = prefs.getBool(_soundKey) ?? true;
    temperatureUnit = (prefs.getString(_tempUnitKey) == 'fahrenheit') ? TemperatureUnit.fahrenheit : TemperatureUnit.celsius;
    reduceMotion = prefs.getBool(_reduceMotionKey) ?? false;
    biometricEnabled = prefs.getBool(_biometricKey) ?? false;
    offlineCacheEnabled = prefs.getBool(_offlineCacheKey) ?? true;
    SensorProvider.offlineCacheEnabled = offlineCacheEnabled;
    notifyListeners();
  }

  Future<void> setAppThemeMode(ThemeMode mode) async {
    appThemeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModeKey, mode.name);
  }

  Future<void> setNotificationsEnabled(bool value) async {
    notificationsEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationsKey, value);
  }

  Future<void> setSoundEnabled(bool value) async {
    soundEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_soundKey, value);
  }

  Future<void> setTemperatureUnit(TemperatureUnit unit) async {
    temperatureUnit = unit;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tempUnitKey, unit == TemperatureUnit.fahrenheit ? 'fahrenheit' : 'celsius');
  }

  Future<void> setReduceMotion(bool value) async {
    reduceMotion = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_reduceMotionKey, value);
  }

  Future<void> setBiometricEnabled(bool value) async {
    biometricEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_biometricKey, value);
  }

  Future<void> setOfflineCacheEnabled(bool value) async {
    offlineCacheEnabled = value;
    SensorProvider.offlineCacheEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_offlineCacheKey, value);
  }
}
