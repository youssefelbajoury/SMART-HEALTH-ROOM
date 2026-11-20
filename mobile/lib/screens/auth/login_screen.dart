import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/page_transitions.dart';
import '../../providers/auth_provider.dart';
import '../admin/admin_shell.dart';
import '../orders/order_form_screen.dart';
import '../shell/main_shell.dart';

/// Fixed, accessible colors for this screen's login card.
///
/// The card is intentionally always a light glass surface regardless of the
/// app's active day/night [Theme] (which may be dark by default) — inheriting
/// text/label/hint colors from the ambient [ThemeData.textTheme] is what
/// previously produced near-white text on this white card. Pinning them here
/// keeps the card readable no matter which app theme is active.
class _LoginColors {
  const _LoginColors._();
  static const text = Color(0xFF1F2937);
  static const hint = Color(0xFF6B7280);
  static const label = Color(0xFF374151);
  static const icon = Color(0xFF6B7280);
  static const border = Color(0xFFE5E7EB);
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  int _shakeTrigger = 0;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final auth = context.read<AuthProvider>();
    // Unchanged: same AuthProvider.login() -> AuthRepository -> POST
    // /auth/login against the existing backend, JWT/roles untouched.
    final success = await auth.login(_emailController.text.trim(), _passwordController.text);
    if (!mounted) return;
    if (success) {
      // Mirrors web's login page: `role === "admin" ? router.push("/admin")
      // : router.push("/dashboard")` — same split, same role source.
      final isAdmin = auth.user?.role == 'admin';
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => isAdmin ? const AdminShell() : const MainShell()),
      );
    } else {
      setState(() => _shakeTrigger++);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isWide = MediaQuery.sizeOf(context).width > 640;

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary700, AppColors.primary500, AppColors.secondary900],
                ),
              ),
            ),
          ),
          Positioned(
            top: -90,
            left: -70,
            child: _glowOrb(240, Colors.white.withValues(alpha: 0.14)),
          ),
          Positioned(
            bottom: -110,
            right: -80,
            child: _glowOrb(280, AppColors.secondary900.withValues(alpha: 0.35)),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: isWide ? 24 : 20, vertical: 32),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: isWide ? 420 : double.infinity),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildLogo(),
                      const SizedBox(height: 20),
                      Text(
                        'Smart Health Room',
                        textAlign: TextAlign.center,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                      ).animate().fadeIn(delay: 100.ms, duration: 500.ms).slideY(begin: 0.15, end: 0),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in to monitor your room',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.82), fontSize: 14),
                      ).animate().fadeIn(delay: 180.ms, duration: 500.ms),
                      const SizedBox(height: 32),
                      _buildCard(auth)
                          .animate()
                          .fadeIn(delay: 260.ms, duration: 550.ms)
                          .slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic)
                          .animate(
                            key: ValueKey(_shakeTrigger),
                            effects: _shakeTrigger == 0
                                ? const []
                                : [ShakeEffect(hz: 6, rotation: 0, offset: const Offset(8, 0), duration: 420.ms)],
                          ),
                      const SizedBox(height: 24),
                      _HoverScale(
                        child: TextButton(
                          onPressed: () => Navigator.of(context).push(fadeSlideRoute(const OrderFormScreen())),
                          child: Text(
                            'Need a device? Place an order',
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.85)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _glowOrb(double size, Color color) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      width: 84,
      height: 84,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 28, offset: const Offset(0, 12)),
        ],
      ),
      child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.7, 0.7), curve: Curves.elasticOut);
  }

  Widget _buildCard(AuthProvider auth) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.94),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.6)),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 40, offset: const Offset(0, 20)),
              BoxShadow(color: AppColors.primary900.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: TextSelectionTheme(
            data: const TextSelectionThemeData(
              cursorColor: AppColors.primary500,
              selectionColor: Color(0x330EA5E9),
              selectionHandleColor: AppColors.primary500,
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome back',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _LoginColors.text),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Sign in to continue',
                    style: TextStyle(fontSize: 14, color: _LoginColors.hint),
                  ),
                  const SizedBox(height: 28),
                  _buildEmailField(),
                  const SizedBox(height: 18),
                  _buildPasswordField(),
                  if (auth.error != null) ...[
                    const SizedBox(height: 14),
                    _buildErrorBanner(auth.error!),
                  ],
                  const SizedBox(height: 26),
                  _buildSubmitButton(auth),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _fieldDecoration({required String label, required String hint, required IconData icon, Widget? suffixIcon}) {
    const radius = 16.0;
    OutlineInputBorder side(Color color, [double width = 1.4]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(radius), borderSide: BorderSide(color: color, width: width));

    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: _LoginColors.label, fontWeight: FontWeight.w600, fontSize: 14),
      floatingLabelStyle: const TextStyle(color: AppColors.primary600, fontWeight: FontWeight.w700, fontSize: 13),
      hintText: hint,
      hintStyle: const TextStyle(color: _LoginColors.hint, fontSize: 14),
      prefixIcon: Icon(icon, color: _LoginColors.icon, size: 20),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: side(_LoginColors.border),
      enabledBorder: side(_LoginColors.border),
      focusedBorder: side(AppColors.primary500, 2),
      errorBorder: side(AppColors.destructive),
      focusedErrorBorder: side(AppColors.destructive, 2),
      errorStyle: const TextStyle(color: AppColors.destructive, fontSize: 12, fontWeight: FontWeight.w600),
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.email],
      style: const TextStyle(color: _LoginColors.text, fontSize: 15, fontWeight: FontWeight.w500),
      cursorColor: AppColors.primary500,
      decoration: _fieldDecoration(label: 'Email', hint: 'you@example.com', icon: Icons.email_outlined),
      validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email address' : null,
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: _obscurePassword,
      textInputAction: TextInputAction.done,
      autofillHints: const [AutofillHints.password],
      style: const TextStyle(color: _LoginColors.text, fontSize: 15, fontWeight: FontWeight.w500),
      cursorColor: AppColors.primary500,
      decoration: _fieldDecoration(
        label: 'Password',
        hint: 'Enter your password',
        icon: Icons.lock_outline_rounded,
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
            color: _LoginColors.icon,
            size: 20,
          ),
          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
        ),
      ),
      validator: (v) => (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
      onFieldSubmitted: (_) => _submit(),
    );
  }

  Widget _buildErrorBanner(String rawError) {
    final message = rawError.replaceFirst('ApiException: ', '');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.destructive.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.destructive.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: AppColors.destructive, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message, style: const TextStyle(color: AppColors.destructive, fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 200.ms);
  }

  Widget _buildSubmitButton(AuthProvider auth) {
    return _HoverScale(
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: auth.isLoading ? null : _submit,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            transitionBuilder: (child, animation) =>
                FadeTransition(opacity: animation, child: ScaleTransition(scale: animation, child: child)),
            child: auth.isLoading
                ? const SizedBox(
                    key: ValueKey('loading'),
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                  )
                : const Row(
                    key: ValueKey('label'),
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Sign In'),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// Scales up slightly under the mouse pointer on Web/desktop; a no-op on
/// touch platforms since [MouseRegion] never receives enter/exit events
/// there — one widget, no platform branching.
class _HoverScale extends StatefulWidget {
  final Widget child;
  const _HoverScale({required this.child});

  @override
  State<_HoverScale> createState() => _HoverScaleState();
}

class _HoverScaleState extends State<_HoverScale> {
  bool _hovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() => _hovering = false),
      child: AnimatedScale(
        scale: _hovering ? 1.03 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
