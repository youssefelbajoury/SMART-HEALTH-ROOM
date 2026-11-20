import '../../models/sensor_data.dart';
import '../../models/weather.dart';
import 'health_score.dart';
import 'predictive_warning.dart';
import 'room_quality.dart';
import 'smart_assistant.dart';

/// Bundles the derived-state computation shared by every screen that needs
/// Health Score / Room Quality / Predictive Warning / Smart Recommendations
/// (Home and Dashboard) so the derivation happens in exactly one place.
class DashboardInsights {
  final HealthScoreResult healthScore;
  final RoomQualityResult roomQuality;
  final PredictiveWarning? predictiveWarning;
  final List<AssistantRecommendation> recommendations;
  final List<String> summarySentences;

  DashboardInsights({
    required this.healthScore,
    required this.roomQuality,
    required this.predictiveWarning,
    required this.recommendations,
    required this.summarySentences,
  });
}

DashboardInsights computeDashboardInsights({
  required SensorData data,
  required List<SensorData> history,
  required WeatherReading? weather,
  required double? outdoorAqi,
  required bool emergencyActive,
  required String userName,
}) {
  final healthScore = calculateHealthScore(data);
  final predictiveWarning = emergencyActive ? null : detectTrendWarning(history);
  final roomQuality = calculateRoomQuality(
    data,
    outdoorAqi: outdoorAqi,
    outdoorTemp: weather?.temperature,
    emergencyActive: emergencyActive,
    predictiveWarning: predictiveWarning != null,
  );
  final ctx = AssistantContext(
    data: data,
    history: history,
    healthScore: healthScore,
    roomQuality: roomQuality,
    predictiveWarning: predictiveWarning,
    weather: weather,
    outdoorAqi: outdoorAqi,
    presence: data.isOccupied,
    now: DateTime.now(),
  );
  final recommendations = generateSmartRecommendations(ctx);
  final summarySentences = buildAssistantSummarySentences(ctx, recommendations, userName);

  return DashboardInsights(
    healthScore: healthScore,
    roomQuality: roomQuality,
    predictiveWarning: predictiveWarning,
    recommendations: recommendations,
    summarySentences: summarySentences,
  );
}
