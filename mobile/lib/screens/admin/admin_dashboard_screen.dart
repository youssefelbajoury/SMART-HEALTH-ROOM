import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/order_status.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/glass_card.dart';
import 'widgets/admin_stat_tile.dart';

/// The admin account's landing tab — mirrors `web/src/app/admin/page.tsx`'s
/// `AdminHeader` + `StatsCards` + `OrderStatsCards` + `ActivityTimeline`,
/// condensed onto one scrollable mobile screen instead of a multi-column
/// desktop layout.
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final auth = context.watch<AuthProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final userStats = admin.userStats;
    final orderStats = admin.orderStats;

    // Same client-derived activity feed as web's `ActivityTimeline` — built
    // from each order's own `timeline[]`, not a separate endpoint.
    final activity = <(String name, String status, DateTime at)>[];
    for (final order in admin.orders) {
      for (final step in order.timeline) {
        activity.add((order.fullName, step.status, step.at));
      }
    }
    activity.sort((a, b) => b.$3.compareTo(a.$3));
    final recentActivity = activity.take(10).toList();

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Admin Dashboard', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: RefreshIndicator(
        onRefresh: () => admin.init(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GlassCard(
              isDay: isDay,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_greeting(), style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                  const SizedBox(height: 2),
                  Text(
                    auth.user?.name ?? 'Admin',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textColor),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('EEEE, MMMM d, y').format(DateTime.now()),
                    style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text('Users', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: textColor)),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.6,
              children: [
                AdminStatTile(label: 'Total Users', value: userStats.total, icon: Icons.groups_rounded, color: AppColors.info, isDay: isDay),
                AdminStatTile(label: 'Admins', value: userStats.admins, icon: Icons.shield_rounded, color: AppColors.sleepViolet, isDay: isDay),
                AdminStatTile(label: 'Active', value: userStats.active, icon: Icons.check_circle_rounded, color: AppColors.fine, isDay: isDay),
                AdminStatTile(label: 'Suspended', value: userStats.suspended, icon: Icons.block_rounded, color: AppColors.warning, isDay: isDay),
              ],
            ),
            const SizedBox(height: 20),
            Text('Orders', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: textColor)),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.6,
              children: [
                AdminStatTile(label: 'Total Orders', value: orderStats.total, icon: Icons.receipt_long_rounded, color: AppColors.secondary400, isDay: isDay),
                AdminStatTile(label: 'Pending', value: orderStats.pending, icon: Icons.hourglass_empty_rounded, color: AppColors.warning, isDay: isDay),
                AdminStatTile(label: 'Processing', value: orderStats.processing, icon: Icons.autorenew_rounded, color: AppColors.sleepViolet, isDay: isDay),
                AdminStatTile(label: 'Delivered', value: orderStats.delivered, icon: Icons.check_circle_rounded, color: AppColors.fine, isDay: isDay),
              ],
            ),
            const SizedBox(height: 20),
            Text('Recent Activity', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: textColor)),
            const SizedBox(height: 10),
            if (recentActivity.isEmpty)
              GlassCard(
                isDay: isDay,
                child: Center(
                  child: Text('No recent activity.', style: TextStyle(color: textColor.withValues(alpha: 0.5))),
                ),
              )
            else
              GlassCard(
                isDay: isDay,
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Column(
                  children: [
                    for (final entry in recentActivity)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                        child: Row(
                          children: [
                            Icon(orderStatusStyle(entry.$2).icon, size: 18, color: orderStatusStyle(entry.$2).color),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                '${orderStatusStyle(entry.$2).label} · ${entry.$1}',
                                style: TextStyle(fontSize: 13, color: textColor, fontWeight: FontWeight.w500),
                              ),
                            ),
                            Text(
                              DateFormat('MMM d, HH:mm').format(entry.$3.toLocal()),
                              style: TextStyle(fontSize: 11, color: textColor.withValues(alpha: 0.45)),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
