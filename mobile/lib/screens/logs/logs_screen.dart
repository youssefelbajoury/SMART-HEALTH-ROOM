import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/log_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shimmer_placeholder.dart';
import 'widgets/log_row.dart';

/// System Logs — reuses `GET /logs` (`LogProvider`) with pagination,
/// level filters, realtime `new-log` updates, and a client-side search
/// (the backend log stream isn't documented to support a text-search query
/// param, so search is applied locally over the fetched/paginated results
/// rather than guessing at unsupported backend behavior).
class LogsScreen extends StatefulWidget {
  const LogsScreen({super.key});

  @override
  State<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends State<LogsScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    final logs = context.read<LogProvider>();
    if (logs.logs.isEmpty) {
      Future.microtask(() => logs.init());
    }
    _scrollController.addListener(() {
      if (_scrollController.position.pixels > _scrollController.position.maxScrollExtent - 200) {
        context.read<LogProvider>().loadMore();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logProvider = context.watch<LogProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDay = themeProvider.resolveIsDay(sensorIsDay: true);
    final textColor = isDay ? const Color(0xFF0F172A) : Colors.white;

    final filtered = _query.isEmpty
        ? logProvider.logs
        : logProvider.logs
            .where((l) =>
                l.message.toLowerCase().contains(_query.toLowerCase()) ||
                l.source.toLowerCase().contains(_query.toLowerCase()))
            .toList();

    return Scaffold(
      backgroundColor: isDay ? const Color(0xFFF0F9FF) : const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('System Logs', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
        iconTheme: IconThemeData(color: textColor),
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
                hintText: 'Search logs…',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: isDay ? Colors.white : Colors.white.withValues(alpha: 0.06),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _LevelChip(label: 'All', color: textColor, selected: logProvider.levelFilter == null, onTap: () => context.read<LogProvider>().setLevelFilter(null)),
                const SizedBox(width: 8),
                _LevelChip(label: 'Info', color: AppColors.info, selected: logProvider.levelFilter == 'info', onTap: () => context.read<LogProvider>().setLevelFilter('info')),
                const SizedBox(width: 8),
                _LevelChip(label: 'Warning', color: AppColors.warning, selected: logProvider.levelFilter == 'warning', onTap: () => context.read<LogProvider>().setLevelFilter('warning')),
                const SizedBox(width: 8),
                _LevelChip(label: 'Error', color: AppColors.danger, selected: logProvider.levelFilter == 'error', onTap: () => context.read<LogProvider>().setLevelFilter('error')),
                const SizedBox(width: 8),
                _LevelChip(label: 'Success', color: AppColors.fine, selected: logProvider.levelFilter == 'success', onTap: () => context.read<LogProvider>().setLevelFilter('success')),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: logProvider.isLoading && logProvider.logs.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: List.generate(8, (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: ShimmerPlaceholder(isDay: isDay, height: 60),
                        )),
                  )
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.article_outlined, size: 48, color: textColor.withValues(alpha: 0.3)),
                            const SizedBox(height: 12),
                            Text('No logs match this view.', style: TextStyle(color: textColor.withValues(alpha: 0.6))),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () {
                          HapticFeedback.lightImpact();
                          return context.read<LogProvider>().fetchLogs(reset: true);
                        },
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                          itemCount: filtered.length + (logProvider.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == filtered.length) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(vertical: 16),
                                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                              );
                            }
                            return LogRow(log: filtered[index], isDay: isDay, index: index);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _LevelChip extends StatelessWidget {
  final String label;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  const _LevelChip({required this.label, required this.color, required this.selected, required this.onTap});

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
