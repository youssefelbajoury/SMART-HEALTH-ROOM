import '../../models/sensor_data.dart';
import 'thresholds.dart';

/// Ported verbatim from `web/src/lib/healthScore.ts` (71 lines) so the
/// mobile Health Score card always agrees with the web dashboard's.
class HealthScoreBreakdownItem {
  final String key;
  final String label;
  final int score;
  final ThresholdLevel level;

  HealthScoreBreakdownItem({
    required this.key,
    required this.label,
    required this.score,
    required this.level,
  });
}

class HealthScoreResult {
  final int score;
  final String status; // 'excellent' | 'warning' | 'critical'
  final List<HealthScoreBreakdownItem> breakdown;
  final DateTime lastUpdated;

  HealthScoreResult({
    required this.score,
    required this.status,
    required this.breakdown,
    required this.lastUpdated,
  });
}

const Map<ThresholdLevel, int> _levelScore = {
  ThresholdLevel.fine: 100,
  ThresholdLevel.warning: 55,
  ThresholdLevel.danger: 15,
};

/// Public so other screens (e.g. the Sensors detail screen) can classify a
/// light reading identically to `calculateHealthScore()` without
/// re-implementing the 200/500 thresholds.
ThresholdLevel lightLevelFor(double value) {
  if (value < 200) return ThresholdLevel.danger;
  if (value < 500) return ThresholdLevel.warning;
  return ThresholdLevel.fine;
}

HealthScoreResult calculateHealthScore(SensorData data) {
  final gasValue = data.gas;
  final lightValue = data.light;
  final presenceDetected = data.isOccupied;

  final temperatureLevel = Thresholds.levelFor('temperature', data.temperature);
  final humidityLevel = Thresholds.levelFor('humidity', data.humidity);
  final gasLevel = Thresholds.levelFor('gas', gasValue);
  final soundLevel = Thresholds.levelFor('soundLevel', data.soundLevel);
  final lightLvl = lightLevelFor(lightValue);

  final breakdown = [
    HealthScoreBreakdownItem(
      key: 'temperature',
      label: 'Temperature',
      score: _levelScore[temperatureLevel]!,
      level: temperatureLevel,
    ),
    HealthScoreBreakdownItem(
      key: 'humidity',
      label: 'Humidity',
      score: _levelScore[humidityLevel]!,
      level: humidityLevel,
    ),
    HealthScoreBreakdownItem(key: 'gas', label: 'Air Quality', score: _levelScore[gasLevel]!, level: gasLevel),
    HealthScoreBreakdownItem(
      key: 'soundLevel',
      label: 'Sound Level',
      score: _levelScore[soundLevel]!,
      level: soundLevel,
    ),
    HealthScoreBreakdownItem(key: 'light', label: 'Light', score: _levelScore[lightLvl]!, level: lightLvl),
    HealthScoreBreakdownItem(
      key: 'presence',
      label: presenceDetected ? 'Patient Monitored' : 'Room Unoccupied',
      score: 100,
      level: ThresholdLevel.fine,
    ),
  ];

  final score = (0.20 * _levelScore[temperatureLevel]! +
          0.15 * _levelScore[humidityLevel]! +
          0.20 * _levelScore[gasLevel]! +
          0.15 * _levelScore[soundLevel]! +
          0.15 * _levelScore[lightLvl]! +
          0.15 * 100)
      .round();

  final status = score >= 80 ? 'excellent' : (score >= 50 ? 'warning' : 'critical');

  return HealthScoreResult(score: score, status: status, breakdown: breakdown, lastUpdated: data.timestamp);
}
