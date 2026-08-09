/**
 * Utility function to format image URLs and Base64 strings safely for HTML <img> elements.
 */
export function formatImageSrc(src?: string | null): string {
  if (!src || !src.trim()) return '';
  const trimmed = src.trim();

  // Standard web URLs, relative uploads path, or Data URIs
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    // Exclude invalid local phone/PC cache filepaths that were saved by mistake
    if (
      trimmed.startsWith('/data/user/') ||
      trimmed.startsWith('/storage/emulated/') ||
      trimmed.startsWith('file://') ||
      trimmed.includes(':\\')
    ) {
      return '';
    }
    return trimmed;
  }

  // Exclude Windows or local file paths
  if (trimmed.includes(':\\') || trimmed.startsWith('C:') || trimmed.startsWith('D:')) {
    return '';
  }

  // Raw Base64 string from Flutter signature canvas
  return `data:image/png;base64,${trimmed}`;
}
