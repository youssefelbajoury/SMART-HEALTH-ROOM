import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/time_format.dart';
import '../../../widgets/glass_card.dart';

/// Shows when the last `sensor-update` was received and whether the
/// Socket.IO link is currently connected — refreshes its relative "x ago"
/// label every few seconds so it never goes stale while the tab is open.
class LastSyncTile extends StatefulWidget {
  final DateTime? lastUpdate;
  final bool isConnected;
  final bool isDay;

  const LastSyncTile({super.key, required this.lastUpdate, required this.isConnected, required this.isDay});

  @override
  State<LastSyncTile> createState() => _LastSyncTileState();
}

class _LastSyncTileState extends State<LastSyncTile> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textColor = widget.isDay ? const Color(0xFF0F172A) : Colors.white;
    final statusColor = widget.isConnected ? AppColors.fine : AppColors.secondary400;

    return GlassCard(
      isDay: widget.isDay,
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Last Synchronization', style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.6))),
                Text(
                  widget.lastUpdate != null ? timeAgo(widget.lastUpdate!) : 'No data yet',
                  style: TextStyle(fontWeight: FontWeight.w700, color: textColor),
                ),
              ],
            ),
          ),
          Text(
            widget.isConnected ? 'Live' : 'Offline',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
          ),
        ],
      ),
    );
  }
}
