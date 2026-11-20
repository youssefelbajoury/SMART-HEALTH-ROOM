import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Material 3 theme pair sharing the exact brand palette as the web app.
/// "Day" maps to the web dashboard's `[data-theme="day"]` variant, "Night"
/// to its default dark glass theme.
class AppTheme {
  AppTheme._();

  static ThemeData get night => _build(Brightness.dark);
  static ThemeData get day => _build(Brightness.light);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary500,
      onPrimary: Colors.white,
      secondary: AppColors.accent,
      onSecondary: Colors.white,
      error: AppColors.destructive,
      onError: Colors.white,
      surface: isDark ? AppColors.secondary900 : Colors.white,
      onSurface: isDark ? AppColors.secondary100 : AppColors.secondary900,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? AppColors.secondary900 : AppColors.primary50,
      fontFamily: 'Roboto',
      textTheme: (isDark ? ThemeData.dark() : ThemeData.light()).textTheme.apply(
            bodyColor: isDark ? AppColors.secondary100 : AppColors.secondary900,
            displayColor: isDark ? AppColors.secondary100 : AppColors.secondary900,
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppColors.secondary900,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: isDark ? AppColors.glassNightBg : AppColors.glassDayBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: isDark ? AppColors.glassNightBorder : AppColors.glassDayBorder),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary500,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white24 : AppColors.secondary200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white24 : AppColors.secondary200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary500, width: 2),
        ),
      ),
    );
  }
}
