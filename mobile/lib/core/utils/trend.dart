import '../../models/sensor_data.dart';

enum SensorTrend { up, down, stable, unknown }

/// Shared trend classifier — compares the latest value against the average
/// of the preceding window. Used by the Sensors screen's per-metric trend
/// arrows and Analytics' trend cards so the same "up/down/stable" definition
/// is never reimplemented twice.
SensorTrend trendFor(List<SensorData> history, double Function(SensorData) getValue, double latest) {
  if (history.length < 4) return SensorTrend.unknown;
  final window = history.length > 10 ? history.sublist(history.length - 10) : history;
  final previous = window.sublist(0, window.length - 1).map(getValue);
  final avg = previous.reduce((a, b) => a + b) / previous.length;
  final delta = latest - avg;
  final relativeThreshold = (avg.abs() * 0.02).clamp(0.3, double.infinity);
  if (delta > relativeThreshold) return SensorTrend.up;
  if (delta < -relativeThreshold) return SensorTrend.down;
  return SensorTrend.stable;
}
