import 'package:flutter/material.dart';

class AppTheme {
  // Theme Color Tokens matching IBIS RICE Web App Palette
  static const Color background = Color(0xFF0B0F19);
  static const Color cardBackground = Color(0xFF141C2F);
  static const Color inputBackground = Color(0xFF1E293B);
  
  static const Color emeraldPrimary = Color(0xFF10B981);
  static const Color emeraldLight = Color(0xFF34D399);
  static const Color skyBlue = Color(0xFF38BDF8);
  static const Color amberGold = Color(0xFFF59E0B);
  static const Color purpleAccent = Color(0xFFA855F7);
  static const Color errorRed = Color(0xFFEF4444);
  
  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color borderLight = Color(0x1AFFFFFF);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: emeraldPrimary,
      cardColor: cardBackground,
      colorScheme: const ColorScheme.dark(
        primary: emeraldPrimary,
        secondary: skyBlue,
        surface: cardBackground,
        error: errorRed,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: cardBackground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textWhite,
          fontSize: 16,
          fontWeight: FontWeight.w800,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputBackground,
        floatingLabelBehavior: FloatingLabelBehavior.always, // Fixes label overlap with values!
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: emeraldPrimary, width: 2),
        ),
        labelStyle: const TextStyle(color: textMuted, fontSize: 12, fontWeight: FontWeight.bold),
        hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: emeraldPrimary,
          foregroundColor: const Color(0xFF0B0F19),
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}
