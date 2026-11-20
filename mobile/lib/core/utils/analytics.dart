import '../../models/alert.dart';
import '../../models/emergency.dart';
import '../../models/sensor_data.dart';
import '../../models/weather.dart';
import 'health_score.dart';
import 'room_quality.dart';

/// Analytics aggregation — reuses the exact same `calculateHealthScore()` /
/// `calculateRoomQuality()` formulas as everywhere else in the app, just
/// averaged/counted over a historical range instead of the latest reading.
/// A defensible simplification (documented, not hidden): Room Quality
/// evolution uses the *current* outdoor weather/AQI snapshot for every past
/// sample, since this app — like the backend — only stores a time-series of
/// indoor sensor readings, not a matching historical weather series.
class AnalyticsStats {
  final int warnings;
  final int emergencies;
  final double bedOccupancyPercent;
  final double avgHealthScore;
  final double avgRoomQuality;
  final int dataPoints;

  AnalyticsStats({
    required this.warnings,
    required this.emergencies,
    required this.bedOccupancyPercent,
    required this.avgHealthScore,
    required this.avgRoomQuality,
    required this.dataPoints,
  });
}

AnalyticsStats computeAnalyticsStats({
  required List<SensorData> history,
  required List<AppAlert> alertsInRange,
  required List<Emergency> emergenciesInRange,
  required WeatherReading? weather,
  required double? outdoorAqi,
}) {
  if (history.isEmpty) {
    return AnalyticsStats(
      warnings: alertsInRange.length,
      emergencies: emergenciesInRange.length,
      bedOccupancyPercent: 0,
      avgHealthScore: 0,
      avgRoomQuality: 0,
      dataPoints: 0,
    );
  }

  final occupied = history.where((d) => d.isOccupied).length;
  final healthScores = history.map((d) => calculateHealthScore(d).score);
  final roomQualities = history.map(
    (d) => calculateRoomQuality(d, outdoorAqi: outdoorAqi, outdoorTemp: weather?.temperature).overall,
  );

  return AnalyticsStats(
    warnings: alertsInRange.length,
    emergencies: emergenciesInRange.length,
    bedOccupancyPercent: occupied / history.length * 100,
    avgHealthScore: healthScores.reduce((a, b) => a + b) / healthScores.length,
    avgRoomQuality: roomQualities.reduce((a, b) => a + b) / roomQualities.length,
    dataPoints: history.length,
  );
}

/// Evenly samples down to at most [maxPoints] entries so long ranges (30d/1y)
/// stay smooth to chart, while always keeping the first and last sample.
List<SensorData> downsample(List<SensorData> data, int maxPoints) {
  if (data.length <= maxPoints) return data;
  final step = data.length / maxPoints;
  return [
    for (var i = 0; i < maxPoints; i++) data[(i * step).floor().clamp(0, data.length - 1)],
    data.last,
  ];
}
