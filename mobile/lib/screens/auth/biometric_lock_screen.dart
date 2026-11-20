import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../services/biometric_service.dart';

/// App-lock gate shown once per cold start when Settings' "Biometric Login"
/// is enabled — unlocks the already-persisted session (does not
/// re-authenticate against the backend; that already happened at login).
class BiometricLockScreen extends StatefulWidget {
  final VoidCallback onUnlocked;

  const BiometricLockScreen({super.key, required this.onUnlocked});

  @override
  State<BiometricLockScreen> createState() => _BiometricLockScreenState();
}

class _BiometricLockScreenState extends State<BiometricLockScreen> {
  bool _authenticating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _attemptUnlock());
  }

  Future<void> _attemptUnlock() async {
    if (_authenticating) return;
    setState(() {
      _authenticating = true;
      _error = null;
    });
    final success = await BiometricService.instance.authenticate();
    if (!mounted) return;
    setState(() => _authenticating = false);
    if (success) {
      HapticFeedback.mediumImpact();
      widget.onUnlocked();
    } else {
      setState(() => _error = 'Authentication failed. Try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary700, AppColors.primary500, AppColors.secondary900],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.fingerprint_rounded, color: Colors.white, size: 72)
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scale(begin: const Offset(1, 1), end: const Offset(1.08, 1.08), duration: 1200.ms),
                const SizedBox(height: 20),
                const Text(
                  'Smart Health Room is locked',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Authenticate to continue',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.white)),
                ],
                const SizedBox(height: 28),
                ElevatedButton.icon(
                  onPressed: _authenticating ? null : _attemptUnlock,
                  icon: const Icon(Icons.lock_open_rounded),
                  label: Text(_authenticating ? 'Authenticating…' : 'Unlock'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
