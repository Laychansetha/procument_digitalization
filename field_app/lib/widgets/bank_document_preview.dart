import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../config/theme.dart';

class BankDocumentPreview extends StatelessWidget {
  final String? imagePath;
  final double size;
  final bool enableZoomOnClick;
  final BorderRadius? borderRadius;

  const BankDocumentPreview({
    Key? key,
    required this.imagePath,
    this.size = 48.0,
    this.enableZoomOnClick = true,
    this.borderRadius,
  }) : super(key: key);

  void _showZoomDialog(BuildContext context) {
    if (imagePath == null || imagePath!.isEmpty) return;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              decoration: BoxDecoration(
                color: AppTheme.cardBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: const [
                  BoxShadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 10)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Dialog Header
                  Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.account_balance, color: AppTheme.skyBlue, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Bank Passbook / Document',
                              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textWhite, fontSize: 14),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: AppTheme.textMuted, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: AppTheme.borderLight),

                  // Image Container
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.65,
                      maxWidth: MediaQuery.of(context).size.width * 0.9,
                    ),
                    child: InteractiveViewer(
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                        child: BankDocumentPreview(
                          imagePath: imagePath,
                          size: 400,
                          enableZoomOnClick: false,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget content = _buildImageWidget(context);

    if (borderRadius != null) {
      content = ClipRRect(borderRadius: borderRadius!, child: content);
    }

    if (enableZoomOnClick && imagePath != null && imagePath!.isNotEmpty) {
      return GestureDetector(
        onTap: () => _showZoomDialog(context),
        child: content,
      );
    }

    return content;
  }

  Widget _buildImageWidget(BuildContext context) {
    final path = imagePath?.trim() ?? '';

    if (path.isEmpty) {
      return Container(
        width: size,
        height: size,
        color: Colors.white.withOpacity(0.05),
        child: Icon(Icons.camera_alt, color: AppTheme.skyBlue, size: size * 0.5),
      );
    }

    // 1. Base64 Data URL (data:image/...)
    if (path.startsWith('data:image/')) {
      try {
        final base64Str = path.contains(',') ? path.split(',')[1] : path;
        final bytes = base64Decode(base64Str.replaceAll(RegExp(r'\s+'), ''));
        return Image.memory(
          bytes,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (ctx, err, stack) => _buildErrorFallback(),
        );
      } catch (e) {
        return _buildErrorFallback();
      }
    }

    // 2. Full HTTP/HTTPS Network URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(
        path,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => _buildErrorFallback(),
      );
    }

    // 3. Relative web server upload path (/uploads/...)
    if (path.startsWith('/uploads/')) {
      final serverUrl = AppConfig.baseUrl.replaceAll(RegExp(r'/$'), '');
      final fullUrl = '$serverUrl$path';
      return Image.network(
        fullUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => _buildErrorFallback(),
      );
    }

    // 4. Local File System Path
    if (!kIsWeb) {
      try {
        final file = File(path);
        if (file.existsSync()) {
          return Image.file(
            file,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (ctx, err, stack) => _buildErrorFallback(),
          );
        }
      } catch (e) {
        // Fallthrough
      }
    }

    // 5. Fallback Web Network attempt
    if (kIsWeb) {
      return Image.network(
        path,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => _buildErrorFallback(),
      );
    }

    return _buildErrorFallback();
  }

  Widget _buildErrorFallback() {
    return Container(
      width: size,
      height: size,
      color: Colors.white.withOpacity(0.08),
      child: Center(
        child: Icon(Icons.account_balance, color: AppTheme.skyBlue, size: size * 0.5),
      ),
    );
  }
}
