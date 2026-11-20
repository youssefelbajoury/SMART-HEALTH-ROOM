import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Order status → color/icon/label, using the same semantic palette
/// (fine/warning/danger/info) as every other status indicator in the app
/// (thresholds, alerts, emergencies) for visual consistency.
class OrderStatusStyle {
  final Color color;
  final IconData icon;
  final String label;

  const OrderStatusStyle({required this.color, required this.icon, required this.label});
}

OrderStatusStyle orderStatusStyle(String status) {
  switch (status) {
    case 'pending':
      return const OrderStatusStyle(color: AppColors.secondary400, icon: Icons.hourglass_empty_rounded, label: 'Pending');
    case 'accepted':
      return const OrderStatusStyle(color: AppColors.info, icon: Icons.thumb_up_rounded, label: 'Accepted');
    case 'processing':
      return const OrderStatusStyle(color: AppColors.warning, icon: Icons.autorenew_rounded, label: 'Processing');
    case 'delivered':
      return const OrderStatusStyle(color: AppColors.fine, icon: Icons.check_circle_rounded, label: 'Delivered');
    case 'rejected':
      return const OrderStatusStyle(color: AppColors.danger, icon: Icons.cancel_rounded, label: 'Rejected');
    case 'delivery-failed':
      return const OrderStatusStyle(color: AppColors.danger, icon: Icons.error_rounded, label: 'Delivery Failed');
    default:
      return const OrderStatusStyle(color: AppColors.secondary400, icon: Icons.help_outline_rounded, label: 'Unknown');
  }
}

/// Step index for the linear pending→accepted→processing→delivered
/// progress indicator; -1 for terminal failure states (rejected/failed).
int orderProgressStep(String status) {
  switch (status) {
    case 'pending':
      return 0;
    case 'accepted':
      return 1;
    case 'processing':
      return 2;
    case 'delivered':
      return 3;
    default:
      return -1;
  }
}
