import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/shimmer_placeholder.dart';

/// System-wide alerts tab — mirrors `web/src/app/admin/alerts/page.tsx`:
/// every account's `Emergency` records (not just the caller's own), via
/// `/api/v1/admin/emergencies`. Read-only, matching web (no accept/resolve
/// action exists there either — an admin's fix is done from the owning
/// user's own Emergency Resolve flow, not from this system-wide view).
class AdminAlertsScreen extends StatelessWidget {
  const AdminAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    const textColor = Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        title: const Text('System Alerts', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: textColor),
      ),
      body: Column(
        children: [
          const SizedBox(height: 8),
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(label: 'All', selected: admin.emergenciesStatusFilter == 'all', onTap: () => context.read<AdminProvider>().setEmergenciesStatusFilter('all')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Active', selected: admin.emergenciesStatusFilter == 'active', onTap: () => context.read<AdminProvider>().setEmergenciesStatusFilter('active')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Resolved', selected: admin.emergenciesStatusFilter == 'resolved', onTap: () => context.read<AdminProvider>().setEmergenciesStatusFilter('resolved')),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: admin.isLoadingEmergencies && admin.emergencies.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(6, (i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: ShimmerPlaceholder(isDay: true, height: 90))),
                  )
                : admin.emergencies.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.shield_rounded, size: 48, color: textColor.withValues(alpha: 0.25)),
                            const SizedBox(height: 12),
                            Text('No alerts', style: TextStyle(color: textColor.withValues(alpha: 0.5))),
                            const SizedBox(height: 4),
                            Text(
                              'Emergency alerts across every account will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.4)),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => context.read<AdminProvider>().fetchEmergencies(),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: admin.emergencies.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final entry = admin.emergencies[index];
                            final e = entry.emergency;
                            final active = e.isActive;
                            return GlassCard(
                              isDay: true,
                              tint: active ? AppColors.destructive.withValues(alpha: 0.06) : null,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.warning_amber_rounded, color: active ? AppColors.destructive : textColor.withValues(alpha: 0.4)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(e.message, style: const TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                                        const SizedBox(height: 6),
                                        Wrap(
                                          spacing: 10,
                                          runSpacing: 4,
                                          children: [
                                            if (entry.userName != null || entry.userEmail != null)
                                              Text(entry.userName ?? entry.userEmail!, style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.55))),
                                            Text(DateFormat('MMM d, HH:mm').format(e.createdAt.toLocal()), style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.5))),
                                            Text('Buzzer ${e.buzzerActive ? 'active' : 'inactive'}', style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.5))),
                                            Text('Email ${e.emailSent ? 'sent' : 'not sent'}', style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.5))),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: (active ? AppColors.destructive : AppColors.fine).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      active ? 'Active' : 'Resolved',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: active ? AppColors.destructive : AppColors.fine),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary500.withValues(alpha: 0.18) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? AppColors.primary500 : AppColors.primary500.withValues(alpha: 0.3)),
        ),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(color: AppColors.primary500, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, fontSize: 13)),
      ),
    );
  }
}
