import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/emergency.dart';
import '../../../widgets/glass_card.dart';

/// Compact, always-visible emergency status — distinct from the full-width
/// `EmergencyBannerCard` (which only renders while active): this tile shows
/// "All Clear" too, so Dashboard always has a safety-status readout.
class EmergencyStatusTile extends StatelessWidget {
  final Emergency? active;
  final bool isDay;
  final VoidCallback? onTap;

  const EmergencyStatusTile({super.key, required this.active, required this.isDay, this.onTap});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final isActive = active != null;
    final color = isActive ? AppColors.danger : AppColors.fine;

    return GlassCard(
      isDay: isDay,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: Icon(isActive ? Icons.warning_rounded : Icons.verified_user_rounded, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Emergency Status', style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.6))),
                Text(
                  isActive ? 'Active — ${active!.message}' : 'All Clear',
                  style: TextStyle(fontWeight: FontWeight.w700, color: color),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
