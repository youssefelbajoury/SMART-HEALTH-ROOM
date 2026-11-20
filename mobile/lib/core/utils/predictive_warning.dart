import '../../models/sensor_data.dart';
import 'thresholds.dart';

/// Ported verbatim from `web/src/lib/predictiveWarning.ts` (55 lines).
class PredictiveWarning {
  final String metric;
  final String label;
  final String message;

  PredictiveWarning({required this.metric, required this.label, required this.message});
}

class _Metric {
  final String key;
  final String label;
  final String verb;
  final double Function(SensorData) getValue;
  final ThresholdDef threshold;

  _Metric(this.key, this.label, this.verb, this.getValue, this.threshold);
}

final List<_Metric> _metrics = [
  _Metric('temperature', 'Temperature', 'increasing', (d) => d.temperature, Thresholds.temperature),
  _Metric('humidity', 'Humidity', 'increasing', (d) => d.humidity, Thresholds.humidity),
  _Metric('gas', 'Air quality', 'deteriorating', (d) => d.gas, Thresholds.gas),
  _Metric('soundLevel', 'Sound level', 'increasing', (d) => d.soundLevel, Thresholds.soundLevel),
];

const int _window = 5;
const double _proximityRatio = 0.85;

bool _isTrendingUp(List<double> values) {
  if (values.length < 3) return false;
  var increases = 0;
  for (var i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) {
      increases++;
    } else if (values[i] < values[i - 1]) {
      return false;
    }
  }
  return increases >= values.length - 2;
}

PredictiveWarning? detectTrendWarning(List<SensorData> history) {
  if (history.length < 3) return null;
  final recent = history.length > _window ? history.sublist(history.length - _window) : history;

  for (final metric in _metrics) {
    final values = recent.map(metric.getValue).toList();
    final latest = values.last;
    if (latest >= metric.threshold.danger) continue;
    if (latest < metric.threshold.warning * _proximityRatio) continue;
    if (!_isTrendingUp(values)) continue;
    return PredictiveWarning(
      metric: metric.key,
      label: metric.label,
      message: '${metric.label} is ${metric.verb} rapidly. Potential emergency detected.',
    );
  }
  return null;
}
