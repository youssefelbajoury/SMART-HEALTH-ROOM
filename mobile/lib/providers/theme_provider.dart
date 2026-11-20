import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum DashboardThemeOverride { auto, day, night }

/// Mirrors the web dashboard's day/night ambient theme: ground truth is the
/// room's real light sensor (`SensorData.lightStatus`), overridable from
/// Settings (`useSettingsStore.themeOverride`, persisted under
/// `"settings-storage"` on the web — here as a local preference).
class ThemeProvider extends ChangeNotifier {
  static const _prefKey = 'dashboard_theme_override';

  DashboardThemeOverride override = DashboardThemeOverride.auto;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_prefKey);
    override = DashboardThemeOverride.values.firstWhere(
      (v) => v.name == stored,
      orElse: () => DashboardThemeOverride.auto,
    );
    notifyListeners();
  }

  Future<void> setOverride(DashboardThemeOverride value) async {
    override = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, value.name);
  }

  /// Resolves whether the dashboard should render in "day" mode, combining
  /// the override with the real sensor-derived day/night state.
  bool resolveIsDay({required bool sensorIsDay}) {
    switch (override) {
      case DashboardThemeOverride.day:
        return true;
      case DashboardThemeOverride.night:
        return false;
      case DashboardThemeOverride.auto:
        return sensorIsDay;
    }
  }
}
