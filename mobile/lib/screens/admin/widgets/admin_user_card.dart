import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/admin_user.dart';
import '../../../widgets/glass_card.dart';

/// One row in the admin Users list — the mobile equivalent of a row in
/// web's `UserTable` (name/email/role badge/status/last login), tap to open
/// the actions sheet instead of per-row icon buttons (too cramped on mobile).
class AdminUserCard extends StatelessWidget {
  final AdminUser user;
  final bool isDay;
  final VoidCallback onTap;

  const AdminUserCard({super.key, required this.user, required this.isDay, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final isAdmin = user.role == 'admin';

    return GlassCard(
      isDay: isDay,
      onTap: onTap,
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: isAdmin ? AppColors.sleepViolet : AppColors.primary500,
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.name,
                        style: TextStyle(fontWeight: FontWeight.w700, color: textColor),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: (isAdmin ? AppColors.sleepViolet : AppColors.secondary400).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        user.role.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: isAdmin ? AppColors.sleepViolet : AppColors.secondary400,
                        ),
                      ),
                    ),
                    if (!user.isActive) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                        child: const Text('SUSPENDED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.warning)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(user.email, style: TextStyle(fontSize: 12.5, color: textColor.withValues(alpha: 0.6)), overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(
                  user.lastLogin != null ? 'Last login ${DateFormat('MMM d, HH:mm').format(user.lastLogin!.toLocal())}' : 'Never logged in',
                  style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.45)),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: textColor.withValues(alpha: 0.35)),
        ],
      ),
    );
  }
}
