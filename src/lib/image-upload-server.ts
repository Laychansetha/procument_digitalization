import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Server-side helper that accepts an image payload (Base64 Data URI, raw Base64 string, or uploaded path).
 * If the payload is Base64, it saves it as a physical file in public/uploads/ and returns the relative URL (/uploads/...).
 * If it's already a valid /uploads/ or HTTP URL, it returns it directly.
 */
export async function processAndSaveImage(
  imageInput?: string | null,
  prefix = 'img'
): Promise<string | null> {
  if (!imageInput || !imageInput.trim()) return null;
  const trimmed = imageInput.trim();

  // If already a hosted URL or relative uploads path
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Reject local phone/device file paths
  if (
    trimmed.startsWith('/data/user/') ||
    trimmed.startsWith('/storage/emulated/') ||
    trimmed.startsWith('file://') ||
    trimmed.includes(':\\')
  ) {
    return null;
  }

  try {
    let base64Data = trimmed;
    let ext = '.png';

    if (trimmed.startsWith('data:image/')) {
      const matches = trimmed.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const format = matches[1].toLowerCase();
        ext = `.${format === 'jpeg' ? 'jpg' : format}`;
        base64Data = matches[2];
      } else {
        base64Data = trimmed.split(',')[1] || trimmed;
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) return null;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error(`Error saving image payload (${prefix}):`, error);
    if (trimmed.startsWith('data:image/')) return trimmed;
    return `data:image/png;base64,${trimmed}`;
  }
}
