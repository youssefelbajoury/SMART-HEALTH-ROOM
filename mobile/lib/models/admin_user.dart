/// Mirrors `web/src/store/admin-store.ts`'s `User`/`RawUser` mapping of the
/// backend's `AdminService.toSafeUser()` shape — the full account record an
/// admin can see/manage, distinct from `AppUser` (the caller's own profile).
class AdminUser {
  final String id;
  final String name;
  final String? firstName;
  final String email;
  final String role; // 'user' | 'admin'
  final String? profileImage;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? lastLogin;
  final DateTime? dateOfBirth;
  final String? phone;
  final String? address;
  final String? deviceId;

  AdminUser({
    required this.id,
    required this.name,
    this.firstName,
    required this.email,
    required this.role,
    this.profileImage,
    required this.isActive,
    required this.createdAt,
    this.lastLogin,
    this.dateOfBirth,
    this.phone,
    this.address,
    this.deviceId,
  });

  factory AdminUser.fromJson(Map<String, dynamic> json) => AdminUser(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        name: json['nom'] as String? ?? json['name'] as String? ?? '',
        firstName: json['prenom'] as String? ?? json['firstName'] as String?,
        email: json['email'] as String? ?? '',
        role: json['role'] as String? ?? 'user',
        profileImage: json['profileImage'] as String?,
        isActive: json['isActive'] as bool? ?? true,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
        lastLogin: json['lastLogin'] != null ? DateTime.tryParse(json['lastLogin'].toString()) : null,
        dateOfBirth: json['dateNaissance'] != null ? DateTime.tryParse(json['dateNaissance'].toString()) : null,
        phone: json['phone'] as String?,
        address: json['address'] as String?,
        deviceId: json['deviceId'] as String?,
      );
}

class AdminUserStats {
  final int total;
  final int admins;
  final int active;
  final int suspended;

  const AdminUserStats({this.total = 0, this.admins = 0, this.active = 0, this.suspended = 0});

  factory AdminUserStats.fromJson(Map<String, dynamic> json) => AdminUserStats(
        total: (json['total'] as num?)?.toInt() ?? 0,
        admins: (json['admins'] as num?)?.toInt() ?? 0,
        active: (json['active'] as num?)?.toInt() ?? 0,
        suspended: (json['suspended'] as num?)?.toInt() ?? 0,
      );
}

class Pagination {
  final int total;
  final int page;
  final int limit;
  final int pages;

  const Pagination({this.total = 0, this.page = 1, this.limit = 20, this.pages = 1});

  factory Pagination.fromJson(Map<String, dynamic>? json) => Pagination(
        total: (json?['total'] as num?)?.toInt() ?? 0,
        page: (json?['page'] as num?)?.toInt() ?? 1,
        limit: (json?['limit'] as num?)?.toInt() ?? 20,
        pages: (json?['pages'] as num?)?.toInt() ?? 1,
      );
}
