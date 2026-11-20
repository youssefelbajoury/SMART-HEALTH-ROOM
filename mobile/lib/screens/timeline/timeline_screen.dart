import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/time_format.dart';
import '../../core/utils/timeline_events.dart';
import '../../providers/alert_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/log_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';

/// Full Timeline — merges Alerts, Emergency events, Orders, and System Logs
/// (which already cover user activity/login/device/sensor events, since
/// `LogService.record()` is the backend's single write path for all of
/// those categories) into one grouped-by-day, realtime feed. Every source
/// provider already maintains its own Socket.IO subscription, so watching
/// all four here is sufficient for "realtime updates" — no new listeners
/// are introduced.
class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  TimelineCategory? _filter;

  @override
  void initState() {
    super.initState();
    final logs = context.read<LogProvider>();
    final orders = context.read<OrderProvider>();
    if (logs.logs.isEmpty) Future.microtask(() => logs.init());
    if (orders.orders.isEmpty) Future.microtask(() => orders.fetchMyOrders());
  }

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final emergencyProvider = context.watch<EmergencyProvider>();
    final orderProvider = context.watch<OrderProvider>();
    final logProvider = context.watch<LogProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    var events = buildTimelineEvents(
      alerts: alertProvider.alerts,
      emergencies: emergencyProvider.history,
      orders: orderProvider.orders,
      logs: logProvider.logs,
    );
    if (_filter != null) {
      events = events.where((e) => e.category == _filter).toList();
    }
    final grouped = groupByDay(events);
    final isLoading = logProvider.isLoading && logProvider.logs.isEmpty;

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Timeline', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              children: [
                _CategoryChip(label: 'All', selected: _filter == null, color: textColor, onTap: () => setState(() => _filter = null)),
                const SizedBox(width: 8),
                _CategoryChip(
                  label: 'Alerts',
                  selected: _filter == TimelineCategory.alert,
                  color: AppColors.warning,
                  onTap: () => setState(() => _filter = TimelineCategory.alert),
                ),
                const SizedBox(width: 8),
                _CategoryChip(
                  label: 'Emergency',
                  selected: _filter == TimelineCategory.emergency,
                  color: AppColors.danger,
                  onTap: () => setState(() => _filter = TimelineCategory.emergency),
                ),
                const SizedBox(width: 8),
                _CategoryChip(
                  label: 'Orders',
                  selected: _filter == TimelineCategory.order,
                  color: AppColors.primary500,
                  onTap: () => setState(() => _filter = TimelineCategory.order),
                ),
                const SizedBox(width: 8),
                _CategoryChip(
                  label: 'System',
                  selected: _filter == TimelineCategory.log,
                  color: AppColors.info,
                  onTap: () => setState(() => _filter = TimelineCategory.log),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: isLoading
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(6, (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: ShimmerPlaceholder(isDay: isDay, height: 56),
                        )),
                  )
                : grouped.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.timeline_rounded, size: 48, color: textColor.withValues(alpha: 0.3)),
                            const SizedBox(height: 12),
                            Text('Nothing to show yet.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () {
                          HapticFeedback.lightImpact();
                          return Future.wait([
                            context.read<LogProvider>().fetchLogs(reset: true),
                            context.read<OrderProvider>().fetchMyOrders(),
                            context.read<AlertProvider>().fetchAlerts(),
                            context.read<EmergencyProvider>().fetchHistory(),
                          ]);
                        },
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                          children: grouped.entries.map((entry) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  child: Text(
                                    entry.key,
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: textColor.withValues(alpha: 0.7)),
                                  ),
                                ),
                                ...entry.value.asMap().entries.map((e) => _TimelineRow(event: e.value, isDay: isDay, index: e.key)),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  final TimelineEvent event;
  final bool isDay;
  final int index;

  const _TimelineRow({required this.event, required this.isDay, required this.index});

  @override
  Widget build(BuildContext context) {
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: event.color.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: Icon(event.icon, size: 15, color: event.color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.message, style: TextStyle(fontSize: 13, color: textColor)),
                const SizedBox(height: 3),
                Text(
                  '${DateFormat('HH:mm').format(event.time)} · ${timeAgo(event.time)}',
                  style: TextStyle(fontSize: 10.5, color: textColor.withValues(alpha: 0.5)),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: (index.clamp(0, 15) * 30).ms, duration: 250.ms).slideX(begin: 0.02, end: 0);
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
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
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
