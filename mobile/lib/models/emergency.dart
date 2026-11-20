/// Mirrors `backend/src/models/Emergency.ts` and the `emergency:activated`
/// / `emergency:resolved` Socket.IO payloads.
class TriggeredSensor {
  final String sensor;
  final double value;
  final double threshold;

  TriggeredSensor({required this.sensor, required this.value, required this.threshold});

  factory TriggeredSensor.fromJson(Map<String, dynamic> json) => TriggeredSensor(
        sensor: json['sensor'] as String? ?? '',
        value: (json['value'] as num?)?.toDouble() ?? 0,
        threshold: (json['threshold'] as num?)?.toDouble() ?? 0,
      );
}

class Emergency {
  final String id;
  final String deviceId;
  final String level; // 'warning' | 'danger'
  final String status; // 'active' | 'resolved'
  final List<TriggeredSensor> triggeredSensors;
  final String message;
  final bool buzzerActive;
  final bool emailSent;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  Emergency({
    required this.id,
    required this.deviceId,
    required this.level,
    required this.status,
    required this.triggeredSensors,
    required this.message,
    required this.buzzerActive,
    required this.emailSent,
    required this.createdAt,
    this.resolvedAt,
  });

  bool get isActive => status == 'active';

  factory Emergency.fromJson(Map<String, dynamic> json) => Emergency(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        deviceId: json['deviceId'] as String? ?? '',
        level: json['level'] as String? ?? 'danger',
        status: json['status'] as String? ?? 'active',
        triggeredSensors: ((json['triggeredSensors'] as List?) ?? [])
            .map((e) => TriggeredSensor.fromJson(e as Map<String, dynamic>))
            .toList(),
        message: json['message'] as String? ?? '',
        buzzerActive: json['buzzerActive'] as bool? ?? false,
        emailSent: json['emailSent'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
        resolvedAt: json['resolvedAt'] != null ? DateTime.tryParse(json['resolvedAt'].toString()) : null,
      );
}
