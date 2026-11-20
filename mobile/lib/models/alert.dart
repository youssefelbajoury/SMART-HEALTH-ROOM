/// Mirrors `backend/src/models/Alert.ts` / `web/src/store/alertStore.ts`.
class AppAlert {
  final String id;
  final String type; // 'danger' | 'warning' | 'info'
  final String message;
  final String sensor;
  final double value;
  final double? threshold;
  final DateTime timestamp;
  final bool read;

  AppAlert({
    required this.id,
    required this.type,
    required this.message,
    required this.sensor,
    required this.value,
    this.threshold,
    required this.timestamp,
    required this.read,
  });

  AppAlert copyWith({bool? read}) => AppAlert(
        id: id,
        type: type,
        message: message,
        sensor: sensor,
        value: value,
        threshold: threshold,
        timestamp: timestamp,
        read: read ?? this.read,
      );

  factory AppAlert.fromJson(Map<String, dynamic> json) => AppAlert(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        type: json['type'] as String? ?? 'info',
        message: json['message'] as String? ?? '',
        sensor: json['sensor'] as String? ?? '',
        value: (json['value'] as num?)?.toDouble() ?? 0,
        threshold: (json['threshold'] as num?)?.toDouble(),
        timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
        read: json['read'] as bool? ?? false,
      );
}
