/// Mirrors `backend/src/models/Log.ts` — the single write path
/// (`LogService.record()`) for auth, sensor, actuator, emergency, admin,
/// order, rfid, esp32, websocket, threshold, and email events.
class LogEntry {
  final String id;
  final String level; // 'info' | 'warning' | 'error' | 'success'
  final String source; // free-form tag: auth, sensor, actuator, emergency, order, rfid, esp32, websocket, threshold, email...
  final String message;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  LogEntry({
    required this.id,
    required this.level,
    required this.source,
    required this.message,
    this.metadata,
    required this.createdAt,
  });

  factory LogEntry.fromJson(Map<String, dynamic> json) => LogEntry(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        level: json['level'] as String? ?? 'info',
        source: json['source'] as String? ?? '',
        message: json['message'] as String? ?? '',
        metadata: json['metadata'] as Map<String, dynamic>?,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );
}
