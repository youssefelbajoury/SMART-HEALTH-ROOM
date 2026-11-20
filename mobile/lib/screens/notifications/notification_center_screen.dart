import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/notification_item.dart';
import '../../providers/alert_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/confirm_dialog.dart';
import 'widgets/notification_card.dart';

/// Notification Center — merges `AlertProvider.alerts` (danger/warning/info,
/// realtime via `new-alert`) and `EmergencyProvider` (active + resolved
/// history, realtime via `emergency:activated`/`:resolved`) into one
/// categorized, filterable, swipeable feed. Distinct from the Alerts tab:
/// this is the full cross-source center (reachable from the bell icon),
/// while Alerts stays scoped to sensor threshold breaches only.
class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> {
  NotificationCategory? _filter;
  final Set<String> _dismissedLocalIds = {};

  List<NotificationItem> _buildItems(AlertProvider alertProvider, EmergencyProvider emergencyProvider) {
    final items = <NotificationItem>[
      ...alertProvider.alerts.map((a) => NotificationItem(
            id: 'alert-${a.id}',
            category: a.type == 'danger'
                ? NotificationCategory.emergency
                : (a.type == 'warning' ? NotificationCategory.warning : NotificationCategory.information),
            message: a.message,
            timestamp: a.timestamp,
            read: a.read,
            isDeletable: true,
          )),
      ...emergencyProvider.history.map((e) => NotificationItem(
            id: 'emergency-${e.id}',
            category: e.isActive ? NotificationCategory.emergency : NotificationCategory.success,
            message: e.isActive ? e.message : 'Resolved: ${e.message}',
            timestamp: e.resolvedAt ?? e.createdAt,
            read: true,
            isDeletable: false,
          )),
    ];
    items.removeWhere((i) => _dismissedLocalIds.contains(i.id));
    items.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    if (_filter != null) {
      return items.where((i) => i.category == _filter).toList();
    }
    return items;
  }

  Future<void> _deleteAll(BuildContext context, List<NotificationItem> visible) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Delete all notifications?',
      message: 'Alerts will be permanently deleted. Emergency events will be hidden from this list.',
      confirmLabel: 'Delete All',
      isDestructive: true,
    );
    if (!confirmed || !context.mounted) return;
    HapticFeedback.mediumImpact();
    setState(() {
      for (final item in visible) {
        if (!item.isDeletable) _dismissedLocalIds.add(item.id);
      }
    });
    context.read<AlertProvider>().deleteAll();
  }

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final emergencyProvider = context.watch<EmergencyProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final items = _buildItems(alertProvider, emergencyProvider);

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Notification Center', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
        actions: [
          if (alertProvider.unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all_rounded),
              tooltip: 'Mark all read',
              onPressed: () {
                HapticFeedback.lightImpact();
                context.read<AlertProvider>().markAllAsRead();
              },
            ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_rounded),
            tooltip: 'Delete all',
            onPressed: items.isEmpty ? null : () => _deleteAll(context, items),
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
                  _CategoryChip(label: 'All', selected: _filter == null, color: textColor, onTap: () => setState(() => _filter = null)),
                  const SizedBox(width: 8),
                  _CategoryChip(
                    label: 'Emergency',
                    selected: _filter == NotificationCategory.emergency,
                    color: AppColors.danger,
                    onTap: () => setState(() => _filter = NotificationCategory.emergency),
                  ),
                  const SizedBox(width: 8),
                  _CategoryChip(
                    label: 'Warning',
                    selected: _filter == NotificationCategory.warning,
                    color: AppColors.warning,
                    onTap: () => setState(() => _filter = NotificationCategory.warning),
                  ),
                  const SizedBox(width: 8),
                  _CategoryChip(
                    label: 'Information',
                    selected: _filter == NotificationCategory.information,
                    color: AppColors.info,
                    onTap: () => setState(() => _filter = NotificationCategory.information),
                  ),
                  const SizedBox(width: 8),
                  _CategoryChip(
                    label: 'Success',
                    selected: _filter == NotificationCategory.success,
                    color: AppColors.fine,
                    onTap: () => setState(() => _filter = NotificationCategory.success),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.notifications_off_rounded, size: 48, color: textColor.withValues(alpha: 0.3)),
                        const SizedBox(height: 12),
                        Text('Nothing here.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      return Dismissible(
                        key: ValueKey(item.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          decoration: BoxDecoration(color: AppColors.destructive.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.delete_rounded, color: AppColors.destructive),
                        ),
                        onDismissed: (_) {
                          HapticFeedback.mediumImpact();
                          if (item.isDeletable) {
                            context.read<AlertProvider>().deleteAlert(item.id.replaceFirst('alert-', ''));
                          } else {
                            setState(() => _dismissedLocalIds.add(item.id));
                          }
                        },
                        child: NotificationCard(
                          item: item,
                          isDay: isDay,
                          onTap: item.isDeletable && !item.read
                              ? () => context.read<AlertProvider>().markAsRead(item.id.replaceFirst('alert-', ''))
                              : null,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, required this.selected, required this.color, required this.onTap});

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
