/// Mirrors the backend's `SensorData` model / the `sensor-update` Socket.IO
/// payload and REST responses from `/sensors/latest` and `/sensors/history`.
class InlineAlert {
  final String level; // 'fine' | 'warning' | 'danger'
  final String message;
  final String color;

  InlineAlert({required this.level, required this.message, required this.color});

  factory InlineAlert.fromJson(Map<String, dynamic> json) => InlineAlert(
        level: json['level'] as String? ?? 'fine',
        message: json['message'] as String? ?? '',
        color: json['color'] as String? ?? '',
      );
}

class RgbColor {
  final int r;
  final int g;
  final int b;

  const RgbColor({required this.r, required this.g, required this.b});

  factory RgbColor.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const RgbColor(r: 0, g: 255, b: 0);
    return RgbColor(
      r: (json['r'] as num?)?.toInt() ?? 0,
      g: (json['g'] as num?)?.toInt() ?? 255,
      b: (json['b'] as num?)?.toInt() ?? 0,
    );
  }
}

class SensorData {
  final String? deviceId;
  final String? userId;
  final DateTime timestamp;
  final double temperature;
  final double humidity;
  final double airQuality;
  final double pressure;
  final bool motion;
  final double soundLevel;
  final double? co2;
  final double light;
  final bool lamp;
  final double? sleepScore;
  final String rfid;
  final double gas;
  final bool buzzer;
  final String lightStatus; // 'jour' | 'nuit'
  final String servo; // 'ouvert' | 'fermé'
  final RgbColor rgb;
  final InlineAlert? alert;

  SensorData({
    this.deviceId,
    this.userId,
    required this.timestamp,
    required this.temperature,
    required this.humidity,
    required this.airQuality,
    required this.pressure,
    required this.motion,
    required this.soundLevel,
    this.co2,
    required this.light,
    required this.lamp,
    this.sleepScore,
    required this.rfid,
    required this.gas,
    required this.buzzer,
    required this.lightStatus,
    required this.servo,
    required this.rgb,
    this.alert,
  });

  bool get isOccupied => pressure > 500;
  bool get isDay => lightStatus == 'jour';

  factory SensorData.fromJson(Map<String, dynamic> json) {
    num n(dynamic v, [num fallback = 0]) => (v as num?) ?? fallback;
    return SensorData(
      deviceId: json['deviceId'] as String?,
      userId: json['userId'] as String?,
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
      temperature: n(json['temperature']).toDouble(),
      humidity: n(json['humidity']).toDouble(),
      airQuality: n(json['airQuality']).toDouble(),
      pressure: n(json['pressure']).toDouble(),
      motion: json['motion'] as bool? ?? false,
      soundLevel: n(json['soundLevel']).toDouble(),
      co2: (json['co2'] as num?)?.toDouble(),
      light: n(json['light'], 500).toDouble(),
      lamp: json['lamp'] as bool? ?? false,
      sleepScore: (json['sleepScore'] as num?)?.toDouble(),
      rfid: json['rfid'] as String? ?? '',
      gas: n(json['gas']).toDouble(),
      buzzer: json['buzzer'] as bool? ?? false,
      lightStatus: json['lightStatus'] as String? ?? 'jour',
      servo: json['servo'] as String? ?? 'fermé',
      rgb: RgbColor.fromJson(json['rgb'] as Map<String, dynamic>?),
      alert: json['alert'] != null ? InlineAlert.fromJson(json['alert'] as Map<String, dynamic>) : null,
    );
  }
}
