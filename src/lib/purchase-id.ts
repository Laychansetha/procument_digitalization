/**
 * Helper utilities for generating and formatting Purchase IDs.
 * Format requirement: FamilyCode_DDMMYY_24H
 * Example:
 * Family code: TB010
 * Date: 26 October 2026
 * Time identifier: 10
 * Purchase ID: TB010_261026_10
 */

function getDateParts(dateInput: Date | string | undefined | null) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const validDate = d && !isNaN(d.getTime()) ? d : new Date();

  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Phnom_Penh',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(validDate);
    const day = parts.find((p) => p.type === 'day')?.value || String(validDate.getDate()).padStart(2, '0');
    const month = parts.find((p) => p.type === 'month')?.value || String(validDate.getMonth() + 1).padStart(2, '0');
    const year = parts.find((p) => p.type === 'year')?.value || String(validDate.getFullYear()).slice(-2);
    let hour = parts.find((p) => p.type === 'hour')?.value || String(validDate.getHours()).padStart(2, '0');
    if (hour === '24') hour = '00';
    return { day, month, year, hour };
  } catch {
    const day = String(validDate.getDate()).padStart(2, '0');
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const year = String(validDate.getFullYear()).slice(-2);
    const hour = String(validDate.getHours()).padStart(2, '0');
    return { day, month, year, hour };
  }
}

export function generatePurchaseId(
  familyCode: string,
  date: Date | string = new Date()
): string {
  const { day, month, year, hour } = getDateParts(date);

  const cleanFamilyCode = (familyCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');

  return `${cleanFamilyCode || 'PURCHASE'}_${day}${month}${year}_${hour}`;
}

export function formatPurchaseId(
  p: {
    id?: string;
    familyCode?: string;
    createdAt?: string | Date;
    date?: string | Date;
  } | null | undefined
): string {
  if (!p) return '';

  // 1. If p.id already matches the format (e.g. TB010_261026_10 or with suffix _2)
  if (p.id && p.id.includes('_') && !p.id.startsWith('offline_')) {
    return p.id;
  }

  // 2. If familyCode and createdAt/date are available, format to FamilyCode_DDMMYY_24H
  if (p.familyCode) {
    const rawDate = p.createdAt || p.date;
    return generatePurchaseId(p.familyCode, rawDate || new Date());
  }

  // 3. Fallback for legacy records without family code
  if (p.id) {
    return `PR-2026-${p.id.slice(-6).toUpperCase()}`;
  }

  return 'PR-UNKNOWN';
}
