/**
 * Standardized date formatting utilities (DD/MM/YYYY) for UI displays and CSV exports.
 * Preserves underlying Date/ISO values and database storage untouched.
 */

export function formatDateDDMMYYYY(
  dateVal: string | number | Date | null | undefined,
  fallback = 'N/A'
): string {
  if (dateVal === null || dateVal === undefined || dateVal === '') return fallback;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTimeDDMMYYYY(
  dateVal: string | number | Date | null | undefined,
  fallback = 'N/A'
): string {
  if (dateVal === null || dateVal === undefined || dateVal === '') return fallback;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatTimeHHMM(
  dateVal: string | number | Date | null | undefined,
  fallback = ''
): string {
  if (dateVal === null || dateVal === undefined || dateVal === '') return fallback;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
