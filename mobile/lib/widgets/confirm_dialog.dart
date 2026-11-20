import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Shared confirmation dialog — used everywhere a destructive/real-world
/// action (resolve an emergency, toggle the door/buzzer, sign out) needs an
/// explicit confirm step, instead of each screen rolling its own `AlertDialog`.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  bool isDestructive = false,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
        FilledButton(
          style: isDestructive ? FilledButton.styleFrom(backgroundColor: AppColors.destructive) : null,
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return confirmed ?? false;
}
