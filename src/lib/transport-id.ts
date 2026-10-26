/**
 * Helper utilities for generating and formatting Transport IDs.
 * Format requirement: Combine truck plate number and dispatch date in DDMMYY format.
 * Example:
 * Truck plate: 3A-8899
 * Dispatch date: 26 October 2026
 * Transport ID: 3A-8899_261026
 */

export function generateTransportId(
  plateNumber: string,
  dispatchDate: Date | string = new Date()
): string {
  const d = typeof dispatchDate === 'string' ? new Date(dispatchDate) : dispatchDate;
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const day = String(validDate.getDate()).padStart(2, '0');
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const year = String(validDate.getFullYear()).slice(-2);

  const cleanPlate = (plateNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '-');

  return `${cleanPlate}_${day}${month}${year}`;
}

export function formatTransportId(
  t: {
    id?: string;
    plateNumber?: string;
    createdAt?: string | Date;
    date?: string | Date;
  } | null | undefined
): string {
  if (!t) return '';

  // 1. If t.id is already formatted as PLATE_DDMMYY or contains underscore
  if (t.id && t.id.includes('_') && !t.id.startsWith('offline_')) {
    return t.id;
  }

  // 2. Generate from truck plate number and dispatch date in DDMMYY format
  if (t.plateNumber) {
    const rawDate = t.createdAt || t.date;
    return generateTransportId(t.plateNumber, rawDate || new Date());
  }

  // 3. Fallback for legacy records without plate number
  if (t.id) {
    return `TR-2026-${t.id.slice(-6).toUpperCase()}`;
  }

  return 'TR-UNKNOWN';
}
