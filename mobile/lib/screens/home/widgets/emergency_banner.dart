import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/emergency.dart';

/// Ported from `EmergencyBanner.tsx` — shown only while an emergency is
/// active (`EmergencyProvider.active`, driven by the backend's
/// `EmergencyService` state machine and `emergency:activated`/`:resolved`).
class EmergencyBannerCard extends StatelessWidget {
  final Emergency emergency;
  final VoidCallback onResolve;
  final bool isResolving;

  const EmergencyBannerCard({
    super.key,
    required this.emergency,
    required this.onResolve,
    this.isResolving = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.destructive.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.destructive.withValues(alpha: 0.4), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_rounded, color: AppColors.destructive, size: 26)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(begin: const Offset(1, 1), end: const Offset(1.15, 1.15), duration: 700.ms),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.destructive, borderRadius: BorderRadius.circular(999)),
                child: const Text(
                  'EMERGENCY ACTIVE',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              ),
              if (emergency.buzzerActive) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.destructive.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text('Buzzer Active', style: TextStyle(color: AppColors.destructive, fontSize: 11)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Text(emergency.message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            DateFormat('MMM d, HH:mm').format(emergency.createdAt),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.destructive),
              onPressed: isResolving ? null : onResolve,
              child: isResolving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Resolve Emergency'),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).shake(hz: 2, duration: 400.ms);
  }
}
