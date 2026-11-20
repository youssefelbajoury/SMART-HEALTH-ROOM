import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/order.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/glass_card.dart';
import '../orders/widgets/order_progress_indicator.dart';
import '../orders/widgets/order_timeline.dart';

/// Admin's order detail view — same layout as the user-facing
/// `OrderDetailScreen`, plus the Accept/Reject actions from web's
/// `OrderTable` (`PATCH /admin/orders/:id/accept|reject`), only shown while
/// the order is still `pending`.
class AdminOrderDetailScreen extends StatefulWidget {
  final Order order;
  const AdminOrderDetailScreen({super.key, required this.order});

  @override
  State<AdminOrderDetailScreen> createState() => _AdminOrderDetailScreenState();
}

class _AdminOrderDetailScreenState extends State<AdminOrderDetailScreen> {
  late Order _order = widget.order;
  bool _busy = false;

  Future<void> _accept() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Accept order?',
      message: 'This creates ${_order.fullName}\'s account and starts automatic processing.',
      confirmLabel: 'Accept',
    );
    if (!confirmed || !mounted) return;
    final admin = context.read<AdminProvider>();
    setState(() => _busy = true);
    try {
      await admin.acceptOrder(_order.id);
      if (!mounted) return;
      setState(() => _order = Order(
            id: _order.id,
            firstName: _order.firstName,
            lastName: _order.lastName,
            dateOfBirth: _order.dateOfBirth,
            email: _order.email,
            phone: _order.phone,
            status: 'accepted',
            userId: _order.userId,
            timeline: _order.timeline,
            createdAt: _order.createdAt,
          ));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reject() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Reject order?',
      message: 'This moves the order to History as Rejected.',
      confirmLabel: 'Reject',
      isDestructive: true,
    );
    if (!confirmed || !mounted) return;
    final admin = context.read<AdminProvider>();
    setState(() => _busy = true);
    try {
      await admin.rejectOrder(_order.id);
      if (!mounted) return;
      Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const isDay = true;
    const textColor = Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        title: const Text('Order Details', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: textColor),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_order.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textColor)),
                const SizedBox(height: 4),
                Text(_order.email, style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                if (_order.phone != null) Text(_order.phone!, style: TextStyle(fontSize: 13, color: textColor.withValues(alpha: 0.6))),
                const SizedBox(height: 4),
                Text(
                  'Submitted ${DateFormat('MMM d, y').format(_order.createdAt)}',
                  style: TextStyle(fontSize: 11.5, color: textColor.withValues(alpha: 0.5)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Progress', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 16),
                OrderProgressIndicator(status: _order.status, isDay: isDay),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            isDay: isDay,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Timeline', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
                const SizedBox(height: 14),
                OrderTimelineView(timeline: _order.timeline, isDay: isDay),
              ],
            ),
          ),
          if (_order.status == 'pending') ...[
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _busy ? null : _reject,
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.destructive, side: const BorderSide(color: AppColors.destructive), padding: const EdgeInsets.symmetric(vertical: 14)),
                    icon: const Icon(Icons.close_rounded),
                    label: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _busy ? null : _accept,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.fine, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                    icon: const Icon(Icons.check_rounded),
                    label: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
