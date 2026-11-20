import '../models/user.dart';
import '../services/api_client.dart';

/// Wraps `/api/v1/auth/*` — identical endpoints/payloads to
/// `web/src/store/authStore.ts`; no new auth surface is introduced.
class AuthRepository {
  final ApiClient _api = ApiClient.instance;

  Future<(AppUser, AuthTokens)> login({required String email, required String password}) async {
    final res = await _api.post('/auth/login', body: {'email': email, 'password': password}, authorized: false);
    final user = AppUser.fromJson(res['user'] as Map<String, dynamic>);
    final tokens = AuthTokens.fromJson(res['tokens'] as Map<String, dynamic>);
    return (user, tokens);
  }

  Future<(AppUser, AuthTokens)> register({
    required String email,
    required String password,
    required String name,
    required String firstName,
    String? dateOfBirth,
    String? phone,
    String? address,
  }) async {
    final res = await _api.post(
      '/auth/register',
      authorized: false,
      body: {
        'email': email,
        'password': password,
        'name': name,
        'firstName': firstName,
        'dateOfBirth': ?dateOfBirth,
        'phone': ?phone,
        'address': ?address,
      },
    );
    final user = AppUser.fromJson(res['user'] as Map<String, dynamic>);
    final tokens = AuthTokens.fromJson(res['tokens'] as Map<String, dynamic>);
    return (user, tokens);
  }

  Future<AppUser> me() async {
    final res = await _api.get('/auth/me');
    return AppUser.fromJson(res['user'] as Map<String, dynamic>? ?? res as Map<String, dynamic>);
  }
}
