import 'package:local_auth/local_auth.dart';

/// Wraps native biometric authentication (Fingerprint/Face ID) via
/// `local_auth`. Used as a local unlock gate in front of the already
/// persisted session (`StorageService`/`AuthProvider`) — never a
/// replacement for the backend's own JWT authentication.
class BiometricService {
  BiometricService._();
  static final BiometricService instance = BiometricService._();

  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> get isAvailable async {
    try {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      return supported && canCheck;
    } catch (_) {
      return false;
    }
  }

  Future<bool> authenticate({String reason = 'Unlock Smart Health Room'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
    } catch (_) {
      return false;
    }
  }
}
