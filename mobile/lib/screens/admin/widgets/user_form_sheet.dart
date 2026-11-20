import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/admin_user.dart';

/// Create/edit user bottom sheet — the mobile equivalent of web's
/// `UserTable`'s "Add User" modal and per-row "Edit" modal
/// (`AdminService.createUser`/`updateUser` fields exactly: name, email,
/// password (create only), role, firstName, phone, address).
class UserFormResult {
  final String name;
  final String email;
  final String? password;
  final String role;
  final String? firstName;
  final String? phone;
  final String? address;

  UserFormResult({
    required this.name,
    required this.email,
    this.password,
    required this.role,
    this.firstName,
    this.phone,
    this.address,
  });
}

Future<UserFormResult?> showUserFormSheet(BuildContext context, {AdminUser? existing}) {
  return showModalBottomSheet<UserFormResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _UserFormSheet(existing: existing),
  );
}

class _UserFormSheet extends StatefulWidget {
  final AdminUser? existing;
  const _UserFormSheet({this.existing});

  @override
  State<_UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<_UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.existing?.name ?? '');
  late final _firstNameController = TextEditingController(text: widget.existing?.firstName ?? '');
  late final _emailController = TextEditingController(text: widget.existing?.email ?? '');
  late final _passwordController = TextEditingController();
  late final _phoneController = TextEditingController(text: widget.existing?.phone ?? '');
  late final _addressController = TextEditingController(text: widget.existing?.address ?? '');
  late String _role = widget.existing?.role ?? 'user';

  bool get _isEdit => widget.existing != null;

  @override
  void dispose() {
    _nameController.dispose();
    _firstNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      UserFormResult(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text.isNotEmpty ? _passwordController.text : null,
        role: _role,
        firstName: _firstNameController.text.trim().isNotEmpty ? _firstNameController.text.trim() : null,
        phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        address: _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(2))),
                ),
                const SizedBox(height: 16),
                Text(
                  _isEdit ? 'Edit User' : 'Add User',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F2937)),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _nameController,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: const InputDecoration(labelText: 'Last Name'),
                  validator: (v) => (v == null || v.trim().length < 2) ? 'Required (min 2 chars)' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _firstNameController,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: const InputDecoration(labelText: 'First Name (optional)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: InputDecoration(labelText: _isEdit ? 'Password (leave blank to keep)' : 'Password'),
                  validator: (v) {
                    if (_isEdit) return null;
                    if (v == null || v.length < 6) return 'At least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneController,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: const InputDecoration(labelText: 'Phone (optional)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _addressController,
                  style: const TextStyle(color: Color(0xFF1F2937)),
                  decoration: const InputDecoration(labelText: 'Address (optional)'),
                ),
                const SizedBox(height: 16),
                RadioGroup<String>(
                  groupValue: _role,
                  onChanged: (v) => setState(() => _role = v!),
                  child: Row(
                    children: [
                      Expanded(
                        child: RadioListTile<String>(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('User', style: TextStyle(color: Color(0xFF1F2937))),
                          value: 'user',
                        ),
                      ),
                      Expanded(
                        child: RadioListTile<String>(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Admin', style: TextStyle(color: Color(0xFF1F2937))),
                          value: 'admin',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary500, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: Text(_isEdit ? 'Save Changes' : 'Create User'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
