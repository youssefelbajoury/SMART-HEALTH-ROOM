import 'package:flutter/material.dart';

/// One entry in Global Search — spans pages, live data (orders, alerts,
/// logs, emergencies, recommendations, sensors), and settings/profile.
class SearchResult {
  final String category;
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  SearchResult({
    required this.category,
    required this.icon,
    required this.color,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  bool matches(String query) {
    final q = query.toLowerCase();
    return title.toLowerCase().contains(q) ||
        (subtitle?.toLowerCase().contains(q) ?? false) ||
        category.toLowerCase().contains(q);
  }
}
