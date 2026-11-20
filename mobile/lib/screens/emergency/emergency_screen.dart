import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/confirm_dialog.dart';
import '../home/widgets/emergency_banner.dart';
import 'widgets/emergency_stats_row.dart';
import 'widgets/emergency_timeline.dart';

/// Full Emergency page — status, history, timeline, statistics, and
/// resolve actions, all realtime via `EmergencyProvider`'s existing
/// `emergency:activated`/`emergency:resolved` Socket.IO subscription.
/// Replaces the earlier quick-access bottom sheet with a complete screen.
class EmergencyScreen extends StatelessWidget {
  const EmergencyScreen({super.key});

  Future<void> _resolve(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Resolve emergency?',
      message: 'This marks the active emergency as resolved.',
      confirmLabel: 'Resolve',
    );
    if (confirmed && context.mounted) {
      HapticFeedback.mediumImpact();
      context.read<EmergencyProvider>().resolve();
    }
  }

  @override
  Widget build(BuildContext context) {
    final emergency = context.watch<EmergencyProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Emergency', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: RefreshIndicator(
        onRefresh: () => Future.wait([
          context.read<EmergencyProvider>().fetchActive(),
          context.read<EmergencyProvider>().fetchHistory(),
        ]),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (emergency.active != null)
              EmergencyBannerCard(
                emergency: emergency.active!,
                isResolving: emergency.isLoading,
                onResolve: () => _resolve(context),
              )
            else
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.fine.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.fine.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.verified_user_rounded, color: AppColors.fine, size: 32)
                        .animate()
                        .scale(begin: const Offset(0.8, 0.8), duration: 400.ms),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('All Clear', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: textColor)),
                          Text(
                            'No active emergency right now.',
                            style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.6)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            Text('Statistics', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 10),
            EmergencyStatsRow(history: emergency.history, isActive: emergency.active != null, isDay: isDay),
            const SizedBox(height: 24),
            Text('Timeline', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            const SizedBox(height: 12),
            EmergencyTimeline(history: emergency.history, isDay: isDay),
          ],
        ),
      ),
    );
  }
}
