import 'package:flutter/foundation.dart';
import '../models/alert.dart';
import '../models/sensor_data.dart';
import '../repositories/alert_repository.dart';
import '../repositories/sensor_repository.dart';

enum AnalyticsRange { day, week, fifteenDays, month, year }

extension AnalyticsRangeX on AnalyticsRange {
  String get label => switch (this) {
        AnalyticsRange.day => 'Daily',
        AnalyticsRange.week => 'Weekly',
        AnalyticsRange.fifteenDays => '15 Days',
        AnalyticsRange.month => '30 Days',
        AnalyticsRange.year => 'Yearly',
      };

  int get hours => switch (this) {
        AnalyticsRange.day => 24,
        AnalyticsRange.week => 24 * 7,
        AnalyticsRange.fifteenDays => 24 * 15,
        AnalyticsRange.month => 24 * 30,
        AnalyticsRange.year => 24 * 365,
      };
}

/// Analytics has its own historical fetch scope (a bigger, range-driven
/// `/sensors/history` window and a wider `/alerts` page than the live
/// Alerts tab needs) — reuses `SensorRepository`/`AlertRepository` directly
/// rather than piggy-backing on `SensorProvider`/`AlertProvider`'s
/// live-latest-N state, so neither tab's caching behavior changes.
class AnalyticsProvider extends ChangeNotifier {
  final SensorRepository _sensorRepo = SensorRepository();
  final AlertRepository _alertRepo = AlertRepository();

  AnalyticsRange range = AnalyticsRange.day;
  List<SensorData> history = [];
  List<AppAlert> alertsInRange = [];
  bool isLoading = false;
  String? error;

  Future<void> setRange(AnalyticsRange newRange) async {
    if (range == newRange && history.isNotEmpty) return;
    range = newRange;
    await load();
  }

  Future<void> load() async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _sensorRepo.history(hours: range.hours),
        _alertRepo.list(limit: 500),
      ]);
      history = results[0] as List<SensorData>;
      final cutoff = DateTime.now().subtract(Duration(hours: range.hours));
      alertsInRange = (results[1] as List<AppAlert>).where((a) => a.timestamp.isAfter(cutoff)).toList();
    } catch (e) {
      error = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
