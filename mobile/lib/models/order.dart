/// Mirrors `backend/src/models/Order.ts` — the public order→account
/// pipeline: `pending → accepted → processing → delivered` (or `rejected`/
/// `delivery-failed`), each transition appended to `timeline[]`.
class OrderTimelineEntry {
  final String status;
  final DateTime at;
  final String? note;

  OrderTimelineEntry({required this.status, required this.at, this.note});

  factory OrderTimelineEntry.fromJson(Map<String, dynamic> json) => OrderTimelineEntry(
        status: json['status'] as String? ?? '',
        at: DateTime.tryParse(json['at']?.toString() ?? '') ?? DateTime.now(),
        note: json['note'] as String?,
      );
}

class Order {
  final String id;
  final String firstName;
  final String lastName;
  final DateTime? dateOfBirth;
  final String email;
  final String? phone;
  final String status; // pending | accepted | processing | delivered | rejected | delivery-failed
  final String? userId;
  final List<OrderTimelineEntry> timeline;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.dateOfBirth,
    required this.email,
    this.phone,
    required this.status,
    this.userId,
    required this.timeline,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName';

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        dateOfBirth: json['dateOfBirth'] != null ? DateTime.tryParse(json['dateOfBirth'].toString()) : null,
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
        status: json['status'] as String? ?? 'pending',
        userId: json['userId'] as String?,
        timeline: ((json['timeline'] as List?) ?? [])
            .map((e) => OrderTimelineEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );
}
