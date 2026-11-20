import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/predictive_warning.dart';

/// Ported from `PredictiveWarningBanner.tsx` — trend-extrapolation early
/// warning, distinct from a real threshold alert. Suppressed while a real
/// emergency is active (handled by the caller).
class PredictiveWarningBannerCard extends StatelessWidget {
  final PredictiveWarning warning;

  const PredictiveWarningBannerCard({super.key, required this.warning});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.trending_up_rounded, color: AppColors.warning),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              warning.message,
              style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w600, fontSize: 13.5),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.05, end: 0);
  }
}
