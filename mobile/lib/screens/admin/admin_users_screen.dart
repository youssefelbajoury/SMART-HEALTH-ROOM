import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/admin_user.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/shimmer_placeholder.dart';
import 'widgets/admin_user_card.dart';
import 'widgets/reset_password_sheet.dart';
import 'widgets/user_form_sheet.dart';

/// Users Management tab — mirrors web's `UserTable` + `StatsCards`
/// (`web/src/components/admin/user-table.tsx`): search, role/status
/// filters, and per-user actions (edit, reset password, suspend/reactivate,
/// delete), all against the exact same `/api/v1/admin/users*` endpoints.
class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openActions(BuildContext context, AdminUser user) async {
    final admin = context.read<AdminProvider>();
    final auth = context.read<AuthProvider>();
    final isSelf = user.id == auth.user?.id;

    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.edit_rounded), title: const Text('Edit'), onTap: () => Navigator.of(context).pop('edit')),
            ListTile(leading: const Icon(Icons.password_rounded), title: const Text('Reset Password'), onTap: () => Navigator.of(context).pop('reset')),
            ListTile(
              leading: Icon(user.isActive ? Icons.block_rounded : Icons.check_circle_outline_rounded),
              title: Text(user.isActive ? 'Suspend' : 'Reactivate'),
              enabled: !isSelf,
              onTap: () => Navigator.of(context).pop('suspend'),
            ),
            ListTile(
              leading: const Icon(Icons.delete_rounded, color: AppColors.destructive),
              title: const Text('Delete', style: TextStyle(color: AppColors.destructive)),
              enabled: !isSelf,
              onTap: () => Navigator.of(context).pop('delete'),
            ),
          ],
        ),
      ),
    );
    if (!context.mounted || action == null) return;

    switch (action) {
      case 'edit':
        final result = await showUserFormSheet(context, existing: user);
        if (result == null) return;
        await admin.updateUser(
          user.id,
          name: result.name,
          email: result.email,
          role: result.role,
          firstName: result.firstName,
          phone: result.phone,
          address: result.address,
        );
      case 'reset':
        final password = await showResetPasswordSheet(context, userName: user.name);
        if (password == null) return;
        await admin.resetPassword(user.id, password);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset successfully')));
        }
      case 'suspend':
        final confirmed = await showConfirmDialog(
          context,
          title: user.isActive ? 'Suspend user?' : 'Reactivate user?',
          message: user.isActive
              ? '${user.name} will lose access to their account immediately.'
              : '${user.name} will regain access to their account.',
          confirmLabel: user.isActive ? 'Suspend' : 'Reactivate',
          isDestructive: user.isActive,
        );
        if (confirmed) await admin.setSuspended(user.id, !user.isActive);
      case 'delete':
        final confirmed = await showConfirmDialog(
          context,
          title: 'Delete user?',
          message: '${user.name} will be permanently deleted. This cannot be undone.',
          confirmLabel: 'Delete',
          isDestructive: true,
        );
        if (confirmed) await admin.deleteUser(user.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        title: const Text('Users', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded, color: Color(0xFF0F172A)),
            tooltip: 'Add user',
            onPressed: () async {
              final result = await showUserFormSheet(context);
              if (result == null || !context.mounted) return;
              await context.read<AdminProvider>().createUser(
                    name: result.name,
                    email: result.email,
                    password: result.password!,
                    role: result.role,
                    firstName: result.firstName,
                    phone: result.phone,
                    address: result.address,
                  );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Color(0xFF1F2937)),
              decoration: InputDecoration(
                hintText: 'Search by name or email',
                hintStyle: const TextStyle(color: Color(0xFF6B7280)),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6B7280)),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
              onSubmitted: (v) => context.read<AdminProvider>().setUsersSearch(v),
            ),
          ),
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(label: 'All', selected: admin.usersRoleFilter == 'all', onTap: () => context.read<AdminProvider>().setUsersRoleFilter('all')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Users', selected: admin.usersRoleFilter == 'user', onTap: () => context.read<AdminProvider>().setUsersRoleFilter('user')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Admins', selected: admin.usersRoleFilter == 'admin', onTap: () => context.read<AdminProvider>().setUsersRoleFilter('admin')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Active', selected: admin.usersStatusFilter == 'active', onTap: () => context.read<AdminProvider>().setUsersStatusFilter(admin.usersStatusFilter == 'active' ? 'all' : 'active')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Suspended', selected: admin.usersStatusFilter == 'suspended', onTap: () => context.read<AdminProvider>().setUsersStatusFilter(admin.usersStatusFilter == 'suspended' ? 'all' : 'suspended')),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: admin.isLoadingUsers && admin.users.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(6, (i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: ShimmerPlaceholder(isDay: true, height: 84))),
                  )
                : admin.users.isEmpty
                    ? Center(child: Text('No users found.', style: TextStyle(color: Colors.black.withValues(alpha: 0.5))))
                    : RefreshIndicator(
                        onRefresh: () => context.read<AdminProvider>().fetchUsers(),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: admin.users.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final user = admin.users[index];
                            return AdminUserCard(user: user, isDay: true, onTap: () => _openActions(context, user));
                          },
                        ),
                      ),
          ),
          if (admin.usersPagination.pages > 1)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: admin.usersPagination.page > 1 ? () => context.read<AdminProvider>().setUsersPage(admin.usersPagination.page - 1) : null,
                  ),
                  Text('Page ${admin.usersPagination.page} of ${admin.usersPagination.pages}'),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: admin.usersPagination.page < admin.usersPagination.pages ? () => context.read<AdminProvider>().setUsersPage(admin.usersPagination.page + 1) : null,
                  ),
                ],
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
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.onTap});

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
