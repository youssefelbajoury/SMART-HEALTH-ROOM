/// Mirrors the shape the web app's `authStore` derives from the backend's
/// `{user: {...}}` login/register/me response (`nom`→name, `prenom`→firstName,
/// `dateNaissance`→dateOfBirth).
class AppUser {
  final String id;
  final String email;
  final String name;
  final String? firstName;
  final DateTime? dateOfBirth;
  final String? phone;
  final String? address;
  final String role; // 'user' | 'admin'
  final String? profileImage;
  final String? deviceId;

  AppUser({
    required this.id,
    required this.email,
    required this.name,
    this.firstName,
    this.dateOfBirth,
    this.phone,
    this.address,
    required this.role,
    this.profileImage,
    this.deviceId,
  });

  String get displayFirstName => (firstName?.isNotEmpty ?? false) ? firstName! : name.split(' ').first;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String? ?? json['_id'] as String? ?? '',
        email: json['email'] as String? ?? '',
        name: json['nom'] as String? ?? json['name'] as String? ?? 'User',
        firstName: json['prenom'] as String? ?? json['firstName'] as String?,
        dateOfBirth: DateTime.tryParse(
          (json['dateNaissance'] ?? json['dateOfBirth'] ?? '').toString(),
        ),
        phone: json['phone'] as String?,
        address: json['address'] as String?,
        role: json['role'] as String? ?? 'user',
        profileImage: json['profileImage'] as String?,
        deviceId: json['deviceId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'nom': name,
        'prenom': firstName,
        'dateNaissance': dateOfBirth?.toIso8601String(),
        'phone': phone,
        'address': address,
        'role': role,
        'profileImage': profileImage,
        'deviceId': deviceId,
      };
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;

  AuthTokens({required this.accessToken, required this.refreshToken});

  factory AuthTokens.fromJson(Map<String, dynamic> json) => AuthTokens(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
      );
}
