/// Ported verbatim from `web/src/lib/thresholds.ts` — single source of
/// truth for warning/danger levels, identical to the backend's own
/// `config/thresholds.ts` values (English labels/keys, matching the web UI).
enum ThresholdLevel { fine, warning, danger }

class ThresholdDef {
  final String label;
  final double warning;
  final double danger;
  final String unit;

  const ThresholdDef({
    required this.label,
    required this.warning,
    required this.danger,
    required this.unit,
  });
}

class Thresholds {
  Thresholds._();

  static const temperature = ThresholdDef(label: 'Temperature', warning: 30, danger: 35, unit: '°C');
  static const humidity = ThresholdDef(label: 'Humidity', warning: 70, danger: 85, unit: '%');
  static const gas = ThresholdDef(label: 'Air Quality (Gas)', warning: 400, danger: 600, unit: 'ppm');
  static const soundLevel = ThresholdDef(label: 'Sound Level', warning: 40, danger: 50, unit: 'dB');

  static const double occupancyPressureThreshold = 500;
  static const List<double> comfortTempRange = [20, 26];

  static ThresholdDef defFor(String key) {
    switch (key) {
      case 'temperature':
        return temperature;
      case 'humidity':
        return humidity;
      case 'gas':
        return gas;
      case 'soundLevel':
        return soundLevel;
      default:
        throw ArgumentError('Unknown threshold key: $key');
    }
  }

  static ThresholdLevel levelFor(String key, num? value) {
    if (value == null) return ThresholdLevel.fine;
    final def = defFor(key);
    if (value >= def.danger) return ThresholdLevel.danger;
    if (value >= def.warning) return ThresholdLevel.warning;
    return ThresholdLevel.fine;
  }

  static double distanceFromComfort(num value, List<double> range) {
    if (value < range[0]) return range[0] - value;
    if (value > range[1]) return value - range[1];
    return 0;
  }
}
