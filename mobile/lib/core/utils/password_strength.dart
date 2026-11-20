import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum PasswordStrength { weak, fair, good, strong }

/// Shared password-strength heuristic used by both Register and the public
/// Order form — length + character-class variety, same rule everywhere so
/// the meter reads identically across the app.
PasswordStrength passwordStrengthFor(String password) {
  if (password.isEmpty) return PasswordStrength.weak;
  var score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (RegExp(r'[A-Z]').hasMatch(password)) score++;
  if (RegExp(r'[0-9]').hasMatch(password)) score++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(password)) score++;

  if (score <= 1) return PasswordStrength.weak;
  if (score <= 2) return PasswordStrength.fair;
  if (score <= 3) return PasswordStrength.good;
  return PasswordStrength.strong;
}

Color passwordStrengthColor(PasswordStrength strength) => switch (strength) {
      PasswordStrength.weak => AppColors.destructive,
      PasswordStrength.fair => AppColors.warning,
      PasswordStrength.good => AppColors.info,
      PasswordStrength.strong => AppColors.fine,
    };

String passwordStrengthLabel(PasswordStrength strength) => switch (strength) {
      PasswordStrength.weak => 'Weak',
      PasswordStrength.fair => 'Fair',
      PasswordStrength.good => 'Good',
      PasswordStrength.strong => 'Strong',
    };

double passwordStrengthFraction(PasswordStrength strength) => switch (strength) {
      PasswordStrength.weak => 0.25,
      PasswordStrength.fair => 0.5,
      PasswordStrength.good => 0.75,
      PasswordStrength.strong => 1.0,
    };
