import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/alert.dart';
import '../../providers/alert_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';

enum _AlertFilter { all, danger, warning, info }

/// Full Alerts tab — same `/api/v1/alerts/*` endpoints and `new-alert`
/// Socket.IO event as the Home screen's compact "Latest Alerts" card,
/// laid out as a swipeable list instead of a 5-item preview.
class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  _AlertFilter _filter = _AlertFilter.all;

  Color _colorFor(String type) => switch (type) {
        'danger' => AppColors.danger,
        'warning' => AppColors.warning,
        _ => AppColors.info,
      };

  IconData _iconFor(String type) => switch (type) {
        'danger' => Icons.error_rounded,
        'warning' => Icons.warning_rounded,
        _ => Icons.info_rounded,
      };

  bool _matchesFilter(AppAlert alert) => switch (_filter) {
        _AlertFilter.all => true,
        _AlertFilter.danger => alert.type == 'danger',
        _AlertFilter.warning => alert.type == 'warning',
        _AlertFilter.info => alert.type == 'info',
      };

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;
    final filtered = alertProvider.alerts.where(_matchesFilter).toList();

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Alerts', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
        actions: [
          if (alertProvider.unreadCount > 0)
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                context.read<AlertProvider>().markAllAsRead();
              },
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _FilterChip(label: 'All', selected: _filter == _AlertFilter.all, onTap: () => setState(() => _filter = _AlertFilter.all), color: textColor),
                  const SizedBox(width: 8),
                  _FilterChip(label: 'Danger', selected: _filter == _AlertFilter.danger, onTap: () => setState(() => _filter = _AlertFilter.danger), color: AppColors.danger),
                  const SizedBox(width: 8),
                  _FilterChip(label: 'Warning', selected: _filter == _AlertFilter.warning, onTap: () => setState(() => _filter = _AlertFilter.warning), color: AppColors.warning),
                  const SizedBox(width: 8),
                  _FilterChip(label: 'Info', selected: _filter == _AlertFilter.info, onTap: () => setState(() => _filter = _AlertFilter.info), color: AppColors.info),
                ],
              ),
            ),
          ),
          Expanded(
            child: alertProvider.isLoading && alertProvider.alerts.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(6, (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: ShimmerPlaceholder(isDay: isDay, height: 72),
                        )),
                  )
                : RefreshIndicator(
                    onRefresh: () => Future.wait([
                      context.read<AlertProvider>().fetchAlerts(),
                      context.read<AlertProvider>().fetchUnreadCount(),
                    ]),
                    child: filtered.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.5,
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.notifications_off_rounded, size: 48, color: textColor.withValues(alpha: 0.3)),
                                      const SizedBox(height: 12),
                                      Text('No alerts here.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            itemCount: filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final alert = filtered[index];
                              return Dismissible(
                                key: ValueKey(alert.id),
                                background: Container(
                                  alignment: Alignment.centerLeft,
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  decoration: BoxDecoration(color: AppColors.fine.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                                  child: const Icon(Icons.done_rounded, color: AppColors.fine),
                                ),
                                secondaryBackground: Container(
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  decoration: BoxDecoration(color: AppColors.destructive.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                                  child: const Icon(Icons.delete_rounded, color: AppColors.destructive),
                                ),
                                confirmDismiss: (direction) async {
                                  HapticFeedback.mediumImpact();
                                  if (direction == DismissDirection.startToEnd) {
                                    if (!alert.read) context.read<AlertProvider>().markAsRead(alert.id);
                                    return false;
                                  }
                                  return true;
                                },
                                onDismissed: (_) => context.read<AlertProvider>().deleteAlert(alert.id),
                                child: Material(
                                  color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
                                  borderRadius: BorderRadius.circular(16),
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(16),
                                    onTap: () {
                                      if (!alert.read) context.read<AlertProvider>().markAsRead(alert.id);
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Icon(_iconFor(alert.type), color: _colorFor(alert.type)),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  alert.message,
                                                  style: TextStyle(
                                                    color: textColor,
                                                    fontWeight: alert.read ? FontWeight.w400 : FontWeight.w700,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  '${alert.sensor.isNotEmpty ? '${alert.sensor} · ' : ''}${DateFormat('MMM d, HH:mm').format(alert.timestamp.toLocal())}',
                                                  style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.55)),
                                                ),
                                              ],
                                            ),
                                          ),
                                          if (!alert.read)
                                            Container(
                                              width: 9,
                                              height: 9,
                                              margin: const EdgeInsets.only(top: 4),
                                              decoration: BoxDecoration(color: _colorFor(alert.type), shape: BoxShape.circle),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
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
  final Color color;

  const _FilterChip({required this.label, required this.selected, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.18) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? color : color.withValues(alpha: 0.3)),
        ),
        child: Text(label, style: TextStyle(color: color, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, fontSize: 13)),
      ),
    );
  }
}
