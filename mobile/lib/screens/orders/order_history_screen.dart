import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/order_status.dart';
import '../../core/utils/page_transitions.dart';
import '../../providers/order_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import 'order_detail_screen.dart';
import 'order_form_screen.dart';
import 'widgets/order_card.dart';

/// The caller's own order history (`GET /orders/me`) — search + status
/// filter are applied client-side over the fetched list (the endpoint isn't
/// documented to support server-side text search).
class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<OrderProvider>().fetchMyOrders());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final filtered = orderProvider.orders.where((o) {
      final matchesQuery = _query.isEmpty || o.fullName.toLowerCase().contains(_query.toLowerCase());
      final matchesStatus = _statusFilter == null || o.status == _statusFilter;
      return matchesQuery && matchesStatus;
    }).toList();

    const statuses = ['pending', 'accepted', 'processing', 'delivered', 'rejected', 'delivery-failed'];

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('My Orders', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(fadeSlideRoute(const OrderFormScreen())),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Order'),
        backgroundColor: AppColors.primary500,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              style: TextStyle(color: textColor),
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Search orders…',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
          ),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(label: 'All', selected: _statusFilter == null, color: textColor, onTap: () => setState(() => _statusFilter = null)),
                const SizedBox(width: 8),
                ...statuses.map((s) {
                  final style = orderStatusStyle(s);
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _FilterChip(
                      label: style.label,
                      selected: _statusFilter == s,
                      color: style.color,
                      onTap: () => setState(() => _statusFilter = s),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: orderProvider.isLoading && orderProvider.orders.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(4, (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: ShimmerPlaceholder(isDay: isDay, height: 80),
                        )),
                  )
                : RefreshIndicator(
                    onRefresh: () {
                      HapticFeedback.lightImpact();
                      return context.read<OrderProvider>().fetchMyOrders();
                    },
                    child: filtered.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.55,
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.inventory_2_outlined, size: 48, color: textColor.withValues(alpha: 0.3)),
                                      const SizedBox(height: 12),
                                      Text(
                                        orderProvider.orders.isEmpty ? 'No orders yet.' : 'No orders match this search.',
                                        style: TextStyle(color: textColor.withValues(alpha: 0.6)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 90),
                            itemCount: filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final order = filtered[index];
                              return OrderCard(
                                order: order,
                                isDay: isDay,
                                index: index,
                                onTap: () => Navigator.of(context).push(fadeSlideRoute(OrderDetailScreen(order: order))),
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
  final Color color;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.color, required this.onTap});

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
