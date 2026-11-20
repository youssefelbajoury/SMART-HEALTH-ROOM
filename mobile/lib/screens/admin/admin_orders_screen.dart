import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import '../orders/widgets/order_card.dart';
import 'admin_order_detail_screen.dart';

/// Orders Management tab — mirrors web's `OrderTable` + `OrderStatsCards`
/// (`web/src/components/admin/order-table.tsx`): status filter and tap into
/// a detail view with Accept/Reject, against the exact same
/// `/api/v1/admin/orders*` endpoints.
class AdminOrdersScreen extends StatelessWidget {
  const AdminOrdersScreen({super.key});

  static const _statuses = ['all', 'pending', 'accepted', 'processing', 'delivered', 'rejected'];

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        title: const Text('Orders', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
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
                for (final status in _statuses) ...[
                  _StatusChip(
                    label: status == 'all' ? 'All' : status[0].toUpperCase() + status.substring(1),
                    selected: admin.ordersStatusFilter == status,
                    onTap: () => context.read<AdminProvider>().setOrdersStatusFilter(status),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: admin.isLoadingOrders && admin.orders.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(6, (i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: ShimmerPlaceholder(isDay: true, height: 72))),
                  )
                : admin.orders.isEmpty
                    ? Center(child: Text('No orders found.', style: TextStyle(color: Colors.black.withValues(alpha: 0.5))))
                    : RefreshIndicator(
                        onRefresh: () => Future.wait([context.read<AdminProvider>().fetchOrders(), context.read<AdminProvider>().fetchOrderStats()]),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: admin.orders.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final order = admin.orders[index];
                            return OrderCard(
                              order: order,
                              isDay: true,
                              index: index,
                              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AdminOrderDetailScreen(order: order))),
                            );
                          },
                        ),
                      ),
          ),
          if (admin.ordersPagination.pages > 1)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: admin.ordersPagination.page > 1 ? () => context.read<AdminProvider>().setOrdersPage(admin.ordersPagination.page - 1) : null,
                  ),
                  Text('Page ${admin.ordersPagination.page} of ${admin.ordersPagination.pages}'),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: admin.ordersPagination.page < admin.ordersPagination.pages ? () => context.read<AdminProvider>().setOrdersPage(admin.ordersPagination.page + 1) : null,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _StatusChip({required this.label, required this.selected, required this.onTap});

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
