import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/page_transitions.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/glass_card.dart';
import '../auth/login_screen.dart';
import '../health_report/health_report_screen.dart';
import '../logs/logs_screen.dart';
import '../orders/order_history_screen.dart';
import '../settings/settings_screen.dart';
import '../timeline/timeline_screen.dart';

/// Profile tab — the caller's own account info (from `/auth/me` at login,
/// persisted by `AuthProvider`) plus navigation into every feature that
/// doesn't have its own bottom-nav tab (Settings, Orders, Timeline, Logs,
/// Health Report). Password/photo editing is out of scope (would need new
/// `/auth/password`, `/auth/profile-image` screens) and is left for a
/// future session rather than faked here.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Sign out?',
      message: 'You will need to sign in again to view your room.',
      confirmLabel: 'Sign Out',
      isDestructive: true,
    );
    if (!confirmed || !context.mounted) return;
    HapticFeedback.mediumImpact();
    await context.read<AuthProvider>().logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final user = auth.user;
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Profile', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            isDay: isDay,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.primary500,
                  backgroundImage: (user?.profileImage != null && user!.profileImage!.startsWith('data:'))
                      ? MemoryImage(base64Decode(user.profileImage!.split(',').last))
                      : null,
                  child: (user?.profileImage == null)
                      ? Text(
                          (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : '?',
                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Unknown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: textColor)),
                      const SizedBox(height: 2),
                      Text(user?.email ?? '', style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary500.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          (user?.role ?? 'user').toUpperCase(),
                          style: const TextStyle(color: AppColors.primary500, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Account Details', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 12),
                _InfoRow(icon: Icons.phone_rounded, label: 'Phone', value: user?.phone ?? 'Not set', textColor: textColor),
                _InfoRow(icon: Icons.location_on_rounded, label: 'Address', value: user?.address ?? 'Not set', textColor: textColor),
                _InfoRow(
                  icon: Icons.cake_rounded,
                  label: 'Date of Birth',
                  value: user?.dateOfBirth != null ? '${user!.dateOfBirth!.year}-${user.dateOfBirth!.month.toString().padLeft(2, '0')}-${user.dateOfBirth!.day.toString().padLeft(2, '0')}' : 'Not set',
                  textColor: textColor,
                ),
                _InfoRow(icon: Icons.memory_rounded, label: 'Paired Device', value: user?.deviceId ?? 'None', textColor: textColor),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              children: [
                _NavTile(
                  icon: Icons.settings_rounded,
                  label: 'Settings',
                  subtitle: 'Appearance, notifications, security',
                  textColor: textColor,
                  onTap: () => Navigator.of(context).push(fadeSlideRoute(const SettingsScreen())),
                ),
                _NavDivider(textColor: textColor),
                _NavTile(
                  icon: Icons.inventory_2_rounded,
                  label: 'My Orders',
                  subtitle: 'Track device orders and delivery',
                  textColor: textColor,
                  onTap: () => Navigator.of(context).push(fadeSlideRoute(const OrderHistoryScreen())),
                ),
                _NavDivider(textColor: textColor),
                _NavTile(
                  icon: Icons.timeline_rounded,
                  label: 'Timeline',
                  subtitle: 'All activity, grouped by day',
                  textColor: textColor,
                  onTap: () => Navigator.of(context).push(fadeSlideRoute(const TimelineScreen())),
                ),
                _NavDivider(textColor: textColor),
                _NavTile(
                  icon: Icons.article_rounded,
                  label: 'System Logs',
                  subtitle: 'Technical event stream',
                  textColor: textColor,
                  onTap: () => Navigator.of(context).push(fadeSlideRoute(const LogsScreen())),
                ),
                _NavDivider(textColor: textColor),
                _NavTile(
                  icon: Icons.picture_as_pdf_rounded,
                  label: 'Health Report',
                  subtitle: 'Generate, preview and share a PDF',
                  textColor: textColor,
                  onTap: () => Navigator.of(context).push(fadeSlideRoute(const HealthReportScreen())),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _confirmLogout(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.destructive,
                side: const BorderSide(color: AppColors.destructive),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color textColor;

  const _InfoRow({required this.icon, required this.label, required this.value, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: textColor.withValues(alpha: 0.6)),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6)))),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textColor)),
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color textColor;
  final VoidCallback onTap;

  const _NavTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppColors.primary500.withValues(alpha: 0.15), shape: BoxShape.circle),
        child: Icon(icon, size: 18, color: AppColors.primary500),
      ),
      title: Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55))),
      trailing: Icon(Icons.chevron_right_rounded, color: textColor.withValues(alpha: 0.4)),
    );
  }
}

class _NavDivider extends StatelessWidget {
  final Color textColor;
  const _NavDivider({required this.textColor});

  @override
  Widget build(BuildContext context) => Divider(color: textColor.withValues(alpha: 0.08), height: 1, indent: 16, endIndent: 16);
}
