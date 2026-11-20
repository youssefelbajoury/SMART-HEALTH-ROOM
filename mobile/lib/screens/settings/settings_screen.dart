import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/biometric_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/glass_card.dart';
import '../auth/login_screen.dart';

/// Complete Settings page — appearance, notifications, units, animation,
/// cache/offline data, biometric login, connection (LAN host override, an
/// already-existing `ApiConfig`/`StorageService` capability newly surfaced
/// here), about, and sign out. Everything here is a local device
/// preference (persisted via `SettingsProvider`/`ThemeProvider`) — the
/// backend has no settings endpoint to sync against, matching the web
/// app's own client-only `useSettingsStore`.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricAvailable = false;
  String _version = '';
  final _hostController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBiometricAvailability();
    _loadVersion();
    _loadHostOverride();
  }

  Future<void> _loadBiometricAvailability() async {
    final available = await BiometricService.instance.isAvailable;
    if (mounted) setState(() => _biometricAvailable = available);
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _version = '${info.version} (${info.buildNumber})');
  }

  Future<void> _loadHostOverride() async {
    final host = await StorageService.instance.hostOverride;
    if (mounted && host != null) _hostController.text = host;
  }

  @override
  void dispose() {
    _hostController.dispose();
    super.dispose();
  }

  Future<void> _toggleBiometric(bool value) async {
    if (value) {
      final ok = await BiometricService.instance.authenticate(reason: 'Enable biometric login');
      if (!ok) return;
    }
    if (!mounted) return;
    HapticFeedback.lightImpact();
    context.read<SettingsProvider>().setBiometricEnabled(value);
  }

  Future<void> _clearCache(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Clear cache?',
      message: 'Removes cached chat history and the last offline sensor snapshot. Your account stays signed in.',
      confirmLabel: 'Clear',
      isDestructive: true,
    );
    if (!confirmed) return;
    HapticFeedback.mediumImpact();
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();
    await StorageService.instance.clearCache();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cache cleared.')));
  }

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
    Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Settings', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionTitle('Appearance', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('App Theme', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 10),
                SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(value: ThemeMode.light, label: Text('Light'), icon: Icon(Icons.light_mode_rounded)),
                    ButtonSegment(value: ThemeMode.dark, label: Text('Dark'), icon: Icon(Icons.dark_mode_rounded)),
                    ButtonSegment(value: ThemeMode.system, label: Text('System'), icon: Icon(Icons.settings_suggest_rounded)),
                  ],
                  selected: {settings.appThemeMode},
                  onSelectionChanged: (s) {
                    HapticFeedback.selectionClick();
                    context.read<SettingsProvider>().setAppThemeMode(s.first);
                  },
                ),
                const SizedBox(height: 16),
                Text('Dashboard Ambient Theme', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 4),
                Text(
                  "Auto follows the room's real light sensor.",
                  style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.55)),
                ),
                const SizedBox(height: 10),
                SegmentedButton<DashboardThemeOverride>(
                  segments: const [
                    ButtonSegment(value: DashboardThemeOverride.auto, label: Text('Auto'), icon: Icon(Icons.auto_awesome_rounded)),
                    ButtonSegment(value: DashboardThemeOverride.day, label: Text('Day'), icon: Icon(Icons.wb_sunny_rounded)),
                    ButtonSegment(value: DashboardThemeOverride.night, label: Text('Night'), icon: Icon(Icons.nightlight_round)),
                  ],
                  selected: {themeProvider.override},
                  onSelectionChanged: (s) {
                    HapticFeedback.selectionClick();
                    context.read<ThemeProvider>().setOverride(s.first);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Notifications', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              children: [
                _SwitchTile(
                  icon: Icons.notifications_rounded,
                  label: 'Push Notifications',
                  value: settings.notificationsEnabled,
                  textColor: textColor,
                  onChanged: (v) => context.read<SettingsProvider>().setNotificationsEnabled(v),
                ),
                Divider(color: textColor.withValues(alpha: 0.08)),
                _SwitchTile(
                  icon: Icons.volume_up_rounded,
                  label: 'Sound',
                  value: settings.soundEnabled,
                  textColor: textColor,
                  onChanged: (v) => context.read<SettingsProvider>().setSoundEnabled(v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Units & Language', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Temperature Unit', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 10),
                SegmentedButton<TemperatureUnit>(
                  segments: const [
                    ButtonSegment(value: TemperatureUnit.celsius, label: Text('°C')),
                    ButtonSegment(value: TemperatureUnit.fahrenheit, label: Text('°F')),
                  ],
                  selected: {settings.temperatureUnit},
                  onSelectionChanged: (s) {
                    HapticFeedback.selectionClick();
                    context.read<SettingsProvider>().setTemperatureUnit(s.first);
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.language_rounded, size: 18, color: textColor.withValues(alpha: 0.6)),
                    const SizedBox(width: 10),
                    Expanded(child: Text('Language', style: TextStyle(color: textColor))),
                    Text('English', style: TextStyle(color: textColor.withValues(alpha: 0.5), fontSize: 12.5)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Animation', textColor),
          GlassCard(
            isDay: isDay,
            child: _SwitchTile(
              icon: Icons.motion_photos_off_rounded,
              label: 'Reduce Motion',
              value: settings.reduceMotion,
              textColor: textColor,
              onChanged: (v) => context.read<SettingsProvider>().setReduceMotion(v),
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Data & Cache', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              children: [
                _SwitchTile(
                  icon: Icons.cloud_off_rounded,
                  label: 'Offline Data Fallback',
                  value: settings.offlineCacheEnabled,
                  textColor: textColor,
                  onChanged: (v) => context.read<SettingsProvider>().setOfflineCacheEnabled(v),
                ),
                Divider(color: textColor.withValues(alpha: 0.08)),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.delete_sweep_rounded, color: textColor.withValues(alpha: 0.7)),
                  title: Text('Clear Cache', style: TextStyle(color: textColor)),
                  trailing: Icon(Icons.chevron_right_rounded, color: textColor.withValues(alpha: 0.4)),
                  onTap: () => _clearCache(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Security', textColor),
          GlassCard(
            isDay: isDay,
            child: _SwitchTile(
              icon: Icons.fingerprint_rounded,
              label: _biometricAvailable ? 'Biometric Login' : 'Biometric Login (unavailable on this device)',
              value: settings.biometricEnabled && _biometricAvailable,
              textColor: textColor,
              onChanged: _biometricAvailable ? _toggleBiometric : null,
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Connection', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Backend Host Override', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 4),
                Text(
                  'Leave empty to use the default (${ApiConfig.host}). Set a LAN IP to test against real hardware.',
                  style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55)),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _hostController,
                        style: TextStyle(color: textColor),
                        decoration: const InputDecoration(hintText: 'e.g. 192.168.1.8'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.save_rounded),
                      onPressed: () async {
                        await StorageService.instance.setHostOverride(_hostController.text);
                        ApiConfig.setHostOverride(_hostController.text);
                        HapticFeedback.lightImpact();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connection settings saved.')));
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('About', textColor),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Smart Health Room', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 4),
                Text('Version $_version', style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.55))),
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

class _SectionTitle extends StatelessWidget {
  final String title;
  final Color color;

  const _SectionTitle(this.title, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(title, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: color.withValues(alpha: 0.6))),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final Color textColor;
  final ValueChanged<bool>? onChanged;

  const _SwitchTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.textColor,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: textColor.withValues(alpha: 0.7)),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: TextStyle(color: textColor))),
        Switch(value: value, onChanged: onChanged),
      ],
    );
  }
}
