import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Mirrors web `UserTable`'s reset-password modal — a single new-password
/// field, `PATCH /admin/users/:id/reset-password`.
Future<String?> showResetPasswordSheet(BuildContext context, {required String userName}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _ResetPasswordSheet(userName: userName),
  );
}

class _ResetPasswordSheet extends StatefulWidget {
  final String userName;
  const _ResetPasswordSheet({required this.userName});

  @override
  State<_ResetPasswordSheet> createState() => _ResetPasswordSheetState();
}

class _ResetPasswordSheetState extends State<_ResetPasswordSheet> {
  final _formKey = GlobalKey<FormState>();
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 16),
              Text('Reset Password', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F2937))),
              const SizedBox(height: 4),
              Text('for ${widget.userName}', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
              const SizedBox(height: 16),
              TextFormField(
                controller: _controller,
                obscureText: true,
                autofocus: true,
                style: const TextStyle(color: Color(0xFF1F2937)),
                decoration: const InputDecoration(labelText: 'New Password'),
                validator: (v) => (v == null || v.length < 6) ? 'At least 6 characters' : null,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (!_formKey.currentState!.validate()) return;
                  Navigator.of(context).pop(_controller.text);
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary500, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                child: const Text('Reset Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
