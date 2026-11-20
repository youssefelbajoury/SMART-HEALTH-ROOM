import 'emergency.dart';

/// Mirrors `web/src/app/admin/alerts/page.tsx`'s system-wide emergency feed —
/// same `Emergency` shape as the per-user `emergency:*` events, but the
/// backend's `AdminService.listAllEmergencies()` additionally populates
/// `userId` into `{nom, email}` so admins can see whose room triggered it.
class AdminEmergency {
  final Emergency emergency;
  final String? userName;
  final String? userEmail;

  AdminEmergency({required this.emergency, this.userName, this.userEmail});

  factory AdminEmergency.fromJson(Map<String, dynamic> json) {
    final userField = json['userId'];
    String? userName;
    String? userEmail;
    if (userField is Map) {
      userName = userField['nom'] as String?;
      userEmail = userField['email'] as String?;
    }
    return AdminEmergency(
      emergency: Emergency.fromJson(json),
      userName: userName,
      userEmail: userEmail,
    );
  }
}

class AdminOrderStats {
  final int total;
  final int pending;
  final int accepted;
  final int processing;
  final int delivered;
  final int rejected;
  final int deliveryFailed;

  const AdminOrderStats({
    this.total = 0,
    this.pending = 0,
    this.accepted = 0,
    this.processing = 0,
    this.delivered = 0,
    this.rejected = 0,
    this.deliveryFailed = 0,
  });

  factory AdminOrderStats.fromJson(Map<String, dynamic> json) => AdminOrderStats(
        total: (json['total'] as num?)?.toInt() ?? 0,
        pending: (json['pending'] as num?)?.toInt() ?? 0,
        accepted: (json['accepted'] as num?)?.toInt() ?? 0,
        processing: (json['processing'] as num?)?.toInt() ?? 0,
        delivered: (json['delivered'] as num?)?.toInt() ?? 0,
        rejected: (json['rejected'] as num?)?.toInt() ?? 0,
        deliveryFailed: (json['deliveryFailed'] as num?)?.toInt() ?? 0,
      );
}
