import '../../models/sensor_data.dart';
import 'thresholds.dart';

/// Ported verbatim from `web/src/lib/roomQuality.ts` (129 lines).
class RoomQualitySubScore {
  final int score;
  final String explanation;
  RoomQualitySubScore(this.score, this.explanation);
}

class RoomQualityResult {
  final int overall;
  final int comfort;
  final int airQuality;
  final int safety;
  final int energyEfficiency;
  final Map<String, String> explanations;

  RoomQualityResult({
    required this.overall,
    required this.comfort,
    required this.airQuality,
    required this.safety,
    required this.energyEfficiency,
    required this.explanations,
  });
}

const Map<ThresholdLevel, int> _levelScore = {
  ThresholdLevel.fine: 100,
  ThresholdLevel.warning: 55,
  ThresholdLevel.danger: 15,
};

RoomQualitySubScore _comfortScore(SensorData data) {
  final distance = Thresholds.distanceFromComfort(data.temperature, Thresholds.comfortTempRange);
  final tempScore = distance <= 0 ? 100 : (distance <= 3 ? 65 : 25);
  final humidityLevel = Thresholds.levelFor('humidity', data.humidity);
  final score = (tempScore * 0.6 + _levelScore[humidityLevel]! * 0.4).round();
  final explanation = distance <= 0
      ? 'Temperature is within the ideal 20–26°C comfort range.'
      : 'Temperature is ${distance.toStringAsFixed(1)}° outside the comfort range.';
  return RoomQualitySubScore(score, explanation);
}

RoomQualitySubScore _airQualityScore(SensorData data, double? outdoorAqi) {
  final gasLevel = Thresholds.levelFor('gas', data.gas);
  var score = _levelScore[gasLevel]!;
  var explanation = gasLevel == ThresholdLevel.fine
      ? 'Indoor air quality is good.'
      : 'Indoor air quality is degraded (${data.gas.toStringAsFixed(0)} ppm).';
  if (outdoorAqi != null && outdoorAqi < 50 && gasLevel != ThresholdLevel.fine) {
    score = score - 15 < 15 ? 15 : score - 15;
    explanation = 'Outdoor air is cleaner than indoors — consider ventilating.';
  }
  return RoomQualitySubScore(score, explanation);
}

RoomQualitySubScore _safetyScore(SensorData data, {required bool emergencyActive, required bool predictiveWarning}) {
  final gasLevel = Thresholds.levelFor('gas', data.gas);
  final soundLevel = Thresholds.levelFor('soundLevel', data.soundLevel);
  if (emergencyActive) return RoomQualitySubScore(10, 'An active emergency is in progress.');
  if (gasLevel == ThresholdLevel.danger) return RoomQualitySubScore(15, 'Gas level has reached a dangerous threshold.');
  if (predictiveWarning) return RoomQualitySubScore(45, 'A sensor trend suggests a potential emergency is forming.');
  if (gasLevel == ThresholdLevel.warning || soundLevel == ThresholdLevel.warning) {
    return RoomQualitySubScore(65, 'One or more sensors are at a warning level.');
  }
  return RoomQualitySubScore(100, 'No safety concerns detected.');
}

RoomQualitySubScore _energyEfficiencyScore(SensorData data, double? outdoorTemp) {
  var score = 100;
  final reasons = <String>[];
  if (data.lamp && data.light >= 500) {
    score -= 30;
    reasons.add('the lamp is on during daylight');
  }
  if (outdoorTemp != null && (data.temperature - outdoorTemp).abs() > 10) {
    score -= 20;
    reasons.add('indoor/outdoor temperature gap is large');
  }
  if (score < 15) score = 15;
  final explanation = reasons.isEmpty ? 'No energy waste detected.' : 'Energy waste: ${reasons.join(' and ')}.';
  return RoomQualitySubScore(score, explanation);
}

RoomQualityResult calculateRoomQuality(
  SensorData data, {
  double? outdoorAqi,
  double? outdoorTemp,
  bool emergencyActive = false,
  bool predictiveWarning = false,
}) {
  final comfort = _comfortScore(data);
  final airQuality = _airQualityScore(data, outdoorAqi);
  final safety = _safetyScore(data, emergencyActive: emergencyActive, predictiveWarning: predictiveWarning);
  final energyEfficiency = _energyEfficiencyScore(data, outdoorTemp);

  final overall = (comfort.score * 0.3 + airQuality.score * 0.3 + safety.score * 0.3 + energyEfficiency.score * 0.1)
      .round();

  return RoomQualityResult(
    overall: overall,
    comfort: comfort.score,
    airQuality: airQuality.score,
    safety: safety.score,
    energyEfficiency: energyEfficiency.score,
    explanations: {
      'comfort': comfort.explanation,
      'airQuality': airQuality.explanation,
      'safety': safety.explanation,
      'energyEfficiency': energyEfficiency.explanation,
    },
  );
}
