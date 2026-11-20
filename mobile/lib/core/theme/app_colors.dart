import 'package:flutter/material.dart';

/// Brand palette ported verbatim from `web/tailwind.config.ts` and
/// `web/src/app/globals.css` so the mobile app shares identical branding.
class AppColors {
  AppColors._();

  // Primary (sky) scale
  static const primary50 = Color(0xFFF0F9FF);
  static const primary100 = Color(0xFFE0F2FE);
  static const primary200 = Color(0xFFBAE6FD);
  static const primary300 = Color(0xFF7DD3FC);
  static const primary400 = Color(0xFF38BDF8);
  static const primary500 = Color(0xFF0EA5E9);
  static const primary600 = Color(0xFF0284C7);
  static const primary700 = Color(0xFF0369A1);
  static const primary800 = Color(0xFF075985);
  static const primary900 = Color(0xFF0C4A6E);

  // Secondary (slate) scale
  static const secondary50 = Color(0xFFF8FAFC);
  static const secondary100 = Color(0xFFF1F5F9);
  static const secondary200 = Color(0xFFE2E8F0);
  static const secondary300 = Color(0xFFCBD5E1);
  static const secondary400 = Color(0xFF94A3B8);
  static const secondary500 = Color(0xFF64748B);
  static const secondary600 = Color(0xFF475569);
  static const secondary700 = Color(0xFF334155);
  static const secondary800 = Color(0xFF1E293B);
  static const secondary900 = Color(0xFF0F172A);

  static const accent = Color(0xFF60A5FA);
  static const destructive = Color(0xFFEF4444);

  // Semantic status colors (used across dashboard widgets on the web app)
  static const fine = Color(0xFF34D399); // emerald-400
  static const warning = Color(0xFFFB923C); // orange-400
  static const danger = Color(0xFFF87171); // red-400
  static const info = Color(0xFF38BDF8); // sky-400
  static const sleepViolet = Color(0xFF8B5CF6);

  // Glass card surfaces
  static const glassNightBg = Color(0xB80F172A); // rgba(15,23,42,0.72)
  static const glassNightBorder = Color(0x12FFFFFF); // rgba(255,255,255,0.07)
  static const glassDayBg = Color(0xB8FFFFFF); // rgba(255,255,255,0.72)
  static const glassDayBorder = Color(0xCCE2E8F0); // rgba(226,232,240,0.8)
}
