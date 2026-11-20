import '../../models/sensor_data.dart';
import '../../models/weather.dart';
import 'health_score.dart';
import 'predictive_warning.dart';
import 'recommendations.dart';
import 'room_quality.dart';
import 'thresholds.dart';

/// Ported from `web/src/lib/smartAssistant.ts` — the deterministic
/// recommendation engine behind the dashboard's AI Assistant summary card.
enum AssistantCategory { environment, outdoor, sunExposure, hydration, sleep, weekend }

enum AssistantSeverity { info, warning, critical }

class AssistantRecommendation {
  final String id;
  final AssistantCategory category;
  final AssistantSeverity severity;
  final String message;
  final List<String> reasons;
  final int confidence;

  AssistantRecommendation({
    required this.id,
    required this.category,
    required this.severity,
    required this.message,
    required this.reasons,
    required this.confidence,
  });
}

class AssistantContext {
  final SensorData data;
  final List<SensorData> history;
  final HealthScoreResult healthScore;
  final RoomQualityResult roomQuality;
  final PredictiveWarning? predictiveWarning;
  final WeatherReading? weather;
  final double? outdoorAqi;
  final bool presence;
  final DateTime now;

  AssistantContext({
    required this.data,
    required this.history,
    required this.healthScore,
    required this.roomQuality,
    required this.predictiveWarning,
    required this.weather,
    required this.outdoorAqi,
    required this.presence,
    required this.now,
  });
}

int _confidenceFor(AssistantSeverity severity, int reasonCount) {
  final base = switch (severity) {
    AssistantSeverity.critical => 90,
    AssistantSeverity.warning => 78,
    AssistantSeverity.info => 65,
  };
  final bonus = (reasonCount - 1).clamp(0, 3) * 4;
  final result = base + bonus;
  return result > 98 ? 98 : result;
}

String getGreeting(DateTime now) {
  if (now.hour < 12) return 'Good Morning';
  if (now.hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

AssistantSeverity _fromInsightSeverity(InsightSeverity s) {
  switch (s) {
    case InsightSeverity.critical:
      return AssistantSeverity.critical;
    case InsightSeverity.warning:
      return AssistantSeverity.warning;
    case InsightSeverity.info:
      return AssistantSeverity.info;
  }
}

List<AssistantRecommendation> _environmentRecommendations(AssistantContext ctx) {
  final insights = generateInsights(ctx.data, ctx.history).where((i) => i.type == InsightType.recommendation);
  return insights.map((insight) {
    final severity = _fromInsightSeverity(insight.severity);
    final reasons = ['Based on current sensor readings: ${insight.message}'];
    return AssistantRecommendation(
      id: 'env-${insight.id}',
      category: AssistantCategory.environment,
      severity: severity,
      message: insight.message,
      reasons: reasons,
      confidence: _confidenceFor(severity, reasons.length),
    );
  }).toList();
}

List<AssistantRecommendation> _outdoorRecommendations(AssistantContext ctx) {
  final weather = ctx.weather;
  if (weather == null) return [];
  final result = <AssistantRecommendation>[];
  final gasLevel = Thresholds.levelFor('gas', ctx.data.gas);
  final isDaytime = weather.sunrise != null &&
      weather.sunset != null &&
      ctx.now.isAfter(weather.sunrise!) &&
      ctx.now.isBefore(weather.sunset!);

  if (weather.category == 'storm' || weather.category == 'rain') {
    result.add(AssistantRecommendation(
      id: 'outdoor-storm',
      category: AssistantCategory.outdoor,
      severity: AssistantSeverity.warning,
      message: 'Bad weather outside (${weather.label}) — keep windows closed.',
      reasons: ['Current outdoor conditions: ${weather.label}'],
      confidence: _confidenceFor(AssistantSeverity.warning, 1),
    ));
  } else if (isDaytime &&
      Thresholds.distanceFromComfort(weather.temperature, Thresholds.comfortTempRange) == 0) {
    result.add(AssistantRecommendation(
      id: 'outdoor-great-weather',
      category: AssistantCategory.outdoor,
      severity: AssistantSeverity.info,
      message: 'Great weather for a walk outside (${weather.temperature.toStringAsFixed(0)}°C).',
      reasons: ['Outdoor temperature is within the comfort range'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ));
  }

  if (ctx.outdoorAqi != null && ctx.outdoorAqi! < 50) {
    if (gasLevel == ThresholdLevel.fine) {
      result.add(AssistantRecommendation(
        id: 'outdoor-ventilate',
        category: AssistantCategory.outdoor,
        severity: AssistantSeverity.info,
        message: 'Outdoor air quality is excellent — consider ventilating.',
        reasons: ['Outdoor AQI is ${ctx.outdoorAqi!.toStringAsFixed(0)} (good)'],
        confidence: _confidenceFor(AssistantSeverity.info, 1),
      ));
    } else {
      result.add(AssistantRecommendation(
        id: 'outdoor-air-better',
        category: AssistantCategory.outdoor,
        severity: AssistantSeverity.warning,
        message: 'Outdoor air is cleaner than indoors right now.',
        reasons: ['Indoor gas level is above the fine threshold while outdoor AQI is good'],
        confidence: _confidenceFor(AssistantSeverity.warning, 1),
      ));
    }
  } else if (ctx.outdoorAqi != null && gasLevel == ThresholdLevel.fine) {
    result.add(AssistantRecommendation(
      id: 'outdoor-indoor-healthier',
      category: AssistantCategory.outdoor,
      severity: AssistantSeverity.info,
      message: 'Indoor air is healthier than outside at the moment.',
      reasons: ['Outdoor AQI is ${ctx.outdoorAqi!.toStringAsFixed(0)}, indoors is fine'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ));
  }

  return result;
}

List<AssistantRecommendation> _sunExposureRecommendations(AssistantContext ctx) {
  final weather = ctx.weather;
  if (weather == null || weather.sunrise == null || weather.sunset == null) return [];
  if (ctx.now.isBefore(weather.sunrise!) || ctx.now.isAfter(weather.sunset!)) return [];

  if (weather.uvIndex >= 6) {
    return [
      AssistantRecommendation(
        id: 'sun-high-uv',
        category: AssistantCategory.sunExposure,
        severity: AssistantSeverity.warning,
        message: 'UV index is high (${weather.uvIndex.toStringAsFixed(0)}) — limit direct sun exposure.',
        reasons: ['Current UV index is ${weather.uvIndex.toStringAsFixed(0)}'],
        confidence: _confidenceFor(AssistantSeverity.warning, 1),
      ),
    ];
  }

  if (ctx.now.difference(weather.sunrise!).inHours < 3) {
    return [
      AssistantRecommendation(
        id: 'sun-morning-light',
        category: AssistantCategory.sunExposure,
        severity: AssistantSeverity.info,
        message: 'Morning sunlight is a great source of vitamin D right now.',
        reasons: ['Within 3 hours of sunrise'],
        confidence: _confidenceFor(AssistantSeverity.info, 1),
      ),
    ];
  }

  return [];
}

List<AssistantRecommendation> _hydrationRecommendations(AssistantContext ctx) {
  if (!ctx.presence) return [];
  final result = <AssistantRecommendation>[
    AssistantRecommendation(
      id: 'hydration-base',
      category: AssistantCategory.hydration,
      severity: AssistantSeverity.info,
      message: 'Stay hydrated throughout the day.',
      reasons: ['Presence detected in the room'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ),
  ];
  final outdoorTemp = ctx.weather?.temperature;
  if (ctx.data.temperature > 26 || (outdoorTemp != null && outdoorTemp > 30)) {
    result.add(AssistantRecommendation(
      id: 'hydration-hot',
      category: AssistantCategory.hydration,
      severity: AssistantSeverity.warning,
      message: 'It\'s hot — increase your water intake.',
      reasons: ['Indoor or outdoor temperature is elevated'],
      confidence: _confidenceFor(AssistantSeverity.warning, 1),
    ));
  }
  return result;
}

List<AssistantRecommendation> _sleepRecommendations(AssistantContext ctx) {
  if (!(ctx.now.hour >= 22 || ctx.now.hour < 6)) return [];
  final result = <AssistantRecommendation>[
    AssistantRecommendation(
      id: 'sleep-screen',
      category: AssistantCategory.sleep,
      severity: AssistantSeverity.info,
      message: 'Reduce screen exposure before sleeping.',
      reasons: ['It is nighttime'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ),
  ];
  if (ctx.data.light < 200) {
    result.add(AssistantRecommendation(
      id: 'sleep-lighting',
      category: AssistantCategory.sleep,
      severity: AssistantSeverity.info,
      message: 'Lighting is suitable for rest.',
      reasons: ['Ambient light is low'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ));
  }
  if (ctx.data.soundLevel > 40) {
    result.add(AssistantRecommendation(
      id: 'sleep-noise',
      category: AssistantCategory.sleep,
      severity: AssistantSeverity.warning,
      message: 'Noise level may disturb sleep.',
      reasons: ['Sound level is above 40'],
      confidence: _confidenceFor(AssistantSeverity.warning, 1),
    ));
  }
  final sleepScore = ctx.data.sleepScore;
  if (sleepScore != null && sleepScore < 50) {
    result.add(AssistantRecommendation(
      id: 'sleep-low-score',
      category: AssistantCategory.sleep,
      severity: AssistantSeverity.warning,
      message: 'Recent sleep score is low — consider adjusting the room environment.',
      reasons: ['Sleep score is ${sleepScore.toStringAsFixed(0)}'],
      confidence: _confidenceFor(AssistantSeverity.warning, 1),
    ));
  }
  return result;
}

List<AssistantRecommendation> _weekendRecommendations(AssistantContext ctx) {
  final weekday = ctx.now.weekday; // 6=Sat, 7=Sun
  if (weekday != DateTime.saturday && weekday != DateTime.sunday) return [];
  final result = <AssistantRecommendation>[
    AssistantRecommendation(
      id: 'weekend-activity',
      category: AssistantCategory.weekend,
      severity: AssistantSeverity.info,
      message: 'A good day for some activity.',
      reasons: ['It\'s the weekend'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ),
  ];
  final weather = ctx.weather;
  if (weather != null &&
      (weather.category == 'clear' || weather.category == 'cloudy') &&
      Thresholds.distanceFromComfort(weather.temperature, Thresholds.comfortTempRange) == 0) {
    result.add(AssistantRecommendation(
      id: 'weekend-outdoors',
      category: AssistantCategory.weekend,
      severity: AssistantSeverity.info,
      message: 'Consider spending some time outdoors today.',
      reasons: ['Weather is favorable this weekend'],
      confidence: _confidenceFor(AssistantSeverity.info, 1),
    ));
  }
  return result;
}

int _severityRank(AssistantSeverity s) => switch (s) {
      AssistantSeverity.critical => 0,
      AssistantSeverity.warning => 1,
      AssistantSeverity.info => 2,
    };

List<AssistantRecommendation> generateSmartRecommendations(AssistantContext ctx) {
  final all = [
    ..._environmentRecommendations(ctx),
    ..._outdoorRecommendations(ctx),
    ..._sunExposureRecommendations(ctx),
    ..._hydrationRecommendations(ctx),
    ..._sleepRecommendations(ctx),
    ..._weekendRecommendations(ctx),
  ];
  all.sort((a, b) => _severityRank(a.severity).compareTo(_severityRank(b.severity)));
  return all;
}

List<String> buildAssistantSummarySentences(
  AssistantContext ctx,
  List<AssistantRecommendation> recommendations,
  String userName,
) {
  final sentences = <String>[];
  sentences.add(
    '${getGreeting(ctx.now)}, $userName. Your Health Score is ${ctx.healthScore.score} '
    '(${ctx.healthScore.status}) and Room Quality is ${ctx.roomQuality.overall}%.',
  );
  for (final rec in recommendations.take(3)) {
    sentences.add(rec.message);
  }
  return sentences.take(4).toList();
}
