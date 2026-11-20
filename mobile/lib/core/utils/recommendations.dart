import '../../models/sensor_data.dart';
import 'thresholds.dart';

/// Ported from `web/src/lib/recommendations.ts` — `generateInsights()`.
enum InsightType { recommendation, suggestion }

enum InsightSeverity { info, warning, critical }

class Insight {
  final String id;
  final InsightType type;
  final InsightSeverity severity;
  final String message;

  Insight({required this.id, required this.type, required this.severity, required this.message});
}

const int _prolongedBedTimeMs = 2 * 60 * 60 * 1000;

InsightSeverity _severityFor(ThresholdLevel level) {
  switch (level) {
    case ThresholdLevel.danger:
      return InsightSeverity.critical;
    case ThresholdLevel.warning:
      return InsightSeverity.warning;
    case ThresholdLevel.fine:
      return InsightSeverity.info;
  }
}

List<Insight> generateInsights(SensorData data, List<SensorData> history) {
  final insights = <Insight>[];
  final now = DateTime.now();
  final isDaytime = now.hour >= 6 && now.hour < 18;

  final gasLevel = Thresholds.levelFor('gas', data.gas);
  if (gasLevel != ThresholdLevel.fine) {
    final severity = _severityFor(gasLevel);
    insights.add(Insight(
      id: 'gas-recommendation',
      type: InsightType.recommendation,
      severity: severity,
      message: 'Ventilate the room — gas level is elevated (${data.gas.toStringAsFixed(0)} ppm).',
    ));
    insights.add(Insight(
      id: 'gas-suggestion-window',
      type: InsightType.suggestion,
      severity: severity,
      message: 'Open a window to improve air circulation.',
    ));
    insights.add(Insight(
      id: 'gas-suggestion-source',
      type: InsightType.suggestion,
      severity: severity,
      message: 'Check for a nearby gas or combustion source.',
    ));
  }

  final tempLevel = Thresholds.levelFor('temperature', data.temperature);
  if (tempLevel != ThresholdLevel.fine) {
    final severity = _severityFor(tempLevel);
    insights.add(Insight(
      id: 'temp-recommendation',
      type: InsightType.recommendation,
      severity: severity,
      message: 'Adjust the room temperature — currently ${data.temperature.toStringAsFixed(1)}°C.',
    ));
    insights.add(Insight(
      id: 'temp-suggestion',
      type: InsightType.suggestion,
      severity: severity,
      message: 'Use ventilation or heating to bring the temperature back to a comfortable range.',
    ));
  }

  final humidityLevel = Thresholds.levelFor('humidity', data.humidity);
  if (humidityLevel != ThresholdLevel.fine) {
    final severity = _severityFor(humidityLevel);
    insights.add(Insight(
      id: 'humidity-recommendation',
      type: InsightType.recommendation,
      severity: severity,
      message: 'Humidity is out of the ideal range (${data.humidity.toStringAsFixed(0)}%).',
    ));
    insights.add(Insight(
      id: 'humidity-suggestion',
      type: InsightType.suggestion,
      severity: severity,
      message: 'Use a dehumidifier or increase ventilation.',
    ));
  }

  if (isDaytime && data.light < 500) {
    insights.add(Insight(
      id: 'light-recommendation',
      type: InsightType.recommendation,
      severity: InsightSeverity.info,
      message: 'The room is dim during daytime — consider turning on the lamp.',
    ));
    insights.add(Insight(
      id: 'light-suggestion',
      type: InsightType.suggestion,
      severity: InsightSeverity.info,
      message: 'Open curtains or blinds to let in natural light.',
    ));
  }

  if (data.soundLevel > 40) {
    insights.add(Insight(
      id: 'sound-suggestion',
      type: InsightType.suggestion,
      severity: InsightSeverity.warning,
      message: 'Noise level is elevated — reduce ambient sound for better comfort.',
    ));
  }

  if (_prolongedOccupancyMs(history) >= _prolongedBedTimeMs) {
    insights.add(Insight(
      id: 'prolonged-bed-time',
      type: InsightType.recommendation,
      severity: InsightSeverity.info,
      message: 'The bed has been continuously occupied for over 2 hours.',
    ));
  }

  return insights;
}

int _prolongedOccupancyMs(List<SensorData> history) {
  if (history.isEmpty) return 0;
  DateTime? start;
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i].isOccupied) {
      start = history[i].timestamp;
    } else {
      break;
    }
  }
  if (start == null) return 0;
  return history.last.timestamp.difference(start).inMilliseconds;
}
