import '../../models/sensor_data.dart';
import 'health_score.dart';
import 'room_quality.dart';
import 'predictive_warning.dart';
import 'smart_assistant.dart';
import 'thresholds.dart';

/// Deterministic, rule-based chat engine — the mobile port of the web app's
/// `assistantIntents.ts` (`matchIntent` + `answerQuestion`). Every fact this
/// engine quotes comes from the same already-computed `HealthScoreResult`,
/// `RoomQualityResult`, `PredictiveWarning`, and `AssistantRecommendation`
/// objects the rest of the app renders — there is no external AI call, so
/// the assistant can never disagree with what the user sees on Home/Dashboard.
class AssistantAnswerContext {
  final SensorData data;
  final HealthScoreResult healthScore;
  final RoomQualityResult roomQuality;
  final PredictiveWarning? predictiveWarning;
  final List<AssistantRecommendation> recommendations;

  AssistantAnswerContext({
    required this.data,
    required this.healthScore,
    required this.roomQuality,
    required this.predictiveWarning,
    required this.recommendations,
  });
}

const List<String> suggestedQuestions = [
  "What's my health score?",
  'How is my room quality?',
  'Is there any warning right now?',
  'What should I do?',
  'How can I improve my score?',
  'Explain the gas reading',
  'Explain every sensor',
  'Hello',
];

String matchIntent(String question) {
  final q = question.toLowerCase().trim();

  bool has(List<String> phrases) => phrases.any((p) => q.contains(p));

  if (has(['hello', 'hi', 'hey', 'good morning', 'good evening'])) return 'greeting';
  if (has(['why']) && has(['health score'])) return 'health-score-why';
  if (has(['why']) && has(['room quality'])) return 'room-quality-why';
  if (has(['why']) && has(['warning'])) return 'warning-why';
  if (has(['what should i do', 'what to do', 'what can i do'])) return 'what-to-do';
  if (has(['how can i improve', 'how to improve', 'improve my score', 'improve my room'])) return 'how-improve';
  if (has(['explain health score', 'what is health score', 'what is the health score'])) return 'explain-health-score';
  if (has(['explain room quality', 'what is room quality'])) return 'explain-room-quality';
  if (has(['explain recommendation', 'why these recommendations', 'why this recommendation'])) {
    return 'explain-recommendations';
  }
  if (has(['every sensor', 'all sensors', 'each sensor'])) return 'explain-every-sensor';
  if (has(['air quality'])) return 'explain-air-quality';
  if (has(['gas'])) return 'explain-gas';
  if (has(['humidity'])) return 'explain-humidity';
  if (has(['temperature', 'temp'])) return 'explain-temperature';
  if (has(['room status', 'how is my room', 'status'])) return 'room-status';
  if (has(['warning'])) return 'warning-why';
  if (has(['score'])) return 'explain-health-score';
  if (has(['quality'])) return 'explain-room-quality';
  if (has(['recommend', 'suggestion'])) return 'explain-recommendations';
  if (has(['sound', 'noise'])) return 'explain-every-sensor';
  if (has(['light'])) return 'explain-every-sensor';

  return 'unknown';
}

String _levelWord(ThresholdLevel level) => switch (level) {
      ThresholdLevel.fine => 'fine',
      ThresholdLevel.warning => 'elevated',
      ThresholdLevel.danger => 'dangerously high',
    };

String answerQuestion(String intent, AssistantAnswerContext ctx) {
  final data = ctx.data;
  final health = ctx.healthScore;
  final quality = ctx.roomQuality;

  switch (intent) {
    case 'greeting':
      return "## Hello!\nI'm your Smart Health Room assistant. Ask me about your **Health Score**, "
          "**Room Quality**, a specific sensor, or what to do right now.";

    case 'room-status':
      return '## Room Status\n'
          '- **Presence**: ${data.isOccupied ? 'Occupied' : 'Vacant'}\n'
          '- **Temperature**: ${data.temperature.toStringAsFixed(1)}°C\n'
          '- **Humidity**: ${data.humidity.toStringAsFixed(0)}%\n'
          '- **Gas**: ${data.gas.toStringAsFixed(0)} ppm\n'
          '- **Sound**: ${data.soundLevel.toStringAsFixed(0)} dB\n'
          '- **Health Score**: ${health.score} (${health.status})\n'
          '- **Room Quality**: ${quality.overall}%';

    case 'health-score-why':
      final sorted = [...health.breakdown]..sort((a, b) => a.score.compareTo(b.score));
      final lowest = sorted.take(3);
      return '## Why is my Health Score ${health.score}?\n'
          'Your score is driven by these factors, weakest first:\n'
          '${lowest.map((b) => '- **${b.label}**: ${b.score}/100 (${_levelWord(b.level)})').join('\n')}';

    case 'room-quality-why':
      final entries = {
        'Comfort': quality.comfort,
        'Air Quality': quality.airQuality,
        'Safety': quality.safety,
        'Energy Efficiency': quality.energyEfficiency,
      };
      final worstKey = entries.entries.reduce((a, b) => a.value < b.value ? a : b).key;
      final explanationKey = switch (worstKey) {
        'Comfort' => 'comfort',
        'Air Quality' => 'airQuality',
        'Safety' => 'safety',
        _ => 'energyEfficiency',
      };
      return '## Why is my Room Quality ${quality.overall}%?\n'
          'The weakest factor right now is **$worstKey** (${entries[worstKey]}%).\n\n'
          '${quality.explanations[explanationKey] ?? ''}';

    case 'warning-why':
      if (ctx.predictiveWarning != null) {
        return '## Predictive Warning\n${ctx.predictiveWarning!.message}\n\n'
            'This is a trend-based early warning, not yet a confirmed emergency.';
      }
      final worst = ctx.recommendations.where((r) => r.severity != AssistantSeverity.info).toList();
      if (worst.isNotEmpty) {
        return '## Current Warning\n${worst.first.message}\n\n${worst.first.reasons.map((r) => '- $r').join('\n')}';
      }
      return "## No Active Warnings\nEverything currently looks fine — no sensor is above its warning threshold.";

    case 'what-to-do':
      if (ctx.recommendations.isEmpty) {
        return "## What To Do\nNothing urgent — conditions are within a healthy range. Keep monitoring as usual.";
      }
      final top = ctx.recommendations.first;
      return '## What To Do\n${top.message}\n\n${top.reasons.map((r) => '- $r').join('\n')}';

    case 'how-improve':
      if (ctx.recommendations.isEmpty) {
        return '## How To Improve\nYour room is already in good shape — no specific improvements needed right now.';
      }
      return '## How To Improve\n${ctx.recommendations.take(4).map((r) => '- ${r.message} (${r.confidence}% confidence)').join('\n')}';

    case 'explain-health-score':
      return '## Health Score Explained\n'
          'Health Score is a weighted average of six factors:\n'
          '- Temperature (20%)\n- Humidity (15%)\n- Gas / Air Quality (20%)\n'
          '- Sound Level (15%)\n- Light (15%)\n- Presence monitoring (15%)\n\n'
          'Your current score is **${health.score}** (${health.status}).';

    case 'explain-room-quality':
      return '## Room Quality Explained\n'
          'Room Quality combines four sub-scores:\n'
          '- Comfort (30%): **${quality.comfort}%**\n'
          '- Air Quality (30%): **${quality.airQuality}%**\n'
          '- Safety (30%): **${quality.safety}%**\n'
          '- Energy Efficiency (10%): **${quality.energyEfficiency}%**\n\n'
          'Overall: **${quality.overall}%**';

    case 'explain-recommendations':
      if (ctx.recommendations.isEmpty) {
        return '## Recommendations\nThere are no active recommendations right now.';
      }
      return '## Current Recommendations\n'
          '${ctx.recommendations.map((r) => '- ${r.message} _(${r.confidence}% confidence)_').join('\n')}';

    case 'explain-every-sensor':
      return '## Every Sensor\n'
          '- **Temperature**: ${data.temperature.toStringAsFixed(1)}°C — ${_levelWord(Thresholds.levelFor('temperature', data.temperature))}\n'
          '- **Humidity**: ${data.humidity.toStringAsFixed(0)}% — ${_levelWord(Thresholds.levelFor('humidity', data.humidity))}\n'
          '- **Gas**: ${data.gas.toStringAsFixed(0)} ppm — ${_levelWord(Thresholds.levelFor('gas', data.gas))}\n'
          '- **Sound**: ${data.soundLevel.toStringAsFixed(0)} dB — ${_levelWord(Thresholds.levelFor('soundLevel', data.soundLevel))}\n'
          '- **Light**: ${data.light.toStringAsFixed(0)} lx\n'
          '- **Bed**: ${data.isOccupied ? 'Occupied' : 'Vacant'}';

    case 'explain-gas':
    case 'explain-air-quality':
      final level = Thresholds.levelFor('gas', data.gas);
      return '## Gas / Air Quality\n'
          'Current reading: **${data.gas.toStringAsFixed(0)} ppm** (${_levelWord(level)}).\n\n'
          'Thresholds: warning ≥ ${Thresholds.gas.warning.toStringAsFixed(0)} ppm, danger ≥ ${Thresholds.gas.danger.toStringAsFixed(0)} ppm.';

    case 'explain-humidity':
      final level = Thresholds.levelFor('humidity', data.humidity);
      return '## Humidity\n'
          'Current reading: **${data.humidity.toStringAsFixed(0)}%** (${_levelWord(level)}).\n\n'
          'Thresholds: warning ≥ ${Thresholds.humidity.warning.toStringAsFixed(0)}%, danger ≥ ${Thresholds.humidity.danger.toStringAsFixed(0)}%.';

    case 'explain-temperature':
      final level = Thresholds.levelFor('temperature', data.temperature);
      return '## Temperature\n'
          'Current reading: **${data.temperature.toStringAsFixed(1)}°C** (${_levelWord(level)}).\n\n'
          'Thresholds: warning ≥ ${Thresholds.temperature.warning.toStringAsFixed(0)}°C, danger ≥ ${Thresholds.temperature.danger.toStringAsFixed(0)}°C.';

    default:
      return "I'm not sure how to answer that yet. Try asking about your **Health Score**, **Room Quality**, "
          "or a specific sensor like temperature, humidity, or gas.";
  }
}
