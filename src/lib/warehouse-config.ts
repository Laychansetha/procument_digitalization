/**
 * Configuration and helper utilities for Destination Warehouses.
 * IDs are the primary stored values in records and CSV exports:
 * - W002 - CACC (KPT)
 * - W003 - Amru Nature (KPG)
 * - W004 - Koh Nhek
 * - W005 - Other
 */

export interface DestinationWarehouseOption {
  id: string;
  name: string;
  label: string;
}

export const DESTINATION_WAREHOUSES: DestinationWarehouseOption[] = [
  { id: 'W002', name: 'CACC (KPT)', label: 'W002 - CACC (KPT)' },
  { id: 'W003', name: 'Amru Nature (KPG)', label: 'W003 - Amru Nature (KPG)' },
  { id: 'W004', name: 'Koh Nhek', label: 'W004 - Koh Nhek' },
  { id: 'W005', name: 'Other', label: 'W005 - Other' },
];

/**
 * Returns the warehouse ID (e.g. 'W002') for a given warehouse ID or legacy name.
 */
export function getWarehouseId(val?: string | null): string {
  if (!val) return 'W002';
  const clean = val.trim();

  // If already an ID or starts with W002-W005
  if (/^W00[2-5]/i.test(clean)) {
    return clean.slice(0, 4).toUpperCase();
  }

  const lower = clean.toLowerCase();
  if (lower.includes('cacc') || lower.includes('kpt') || lower.includes('central mill')) {
    return 'W002';
  }
  if (lower.includes('amru') || lower.includes('kpg')) {
    return 'W003';
  }
  if (lower.includes('koh nhek') || lower.includes('nhek')) {
    return 'W004';
  }
  if (lower.includes('other')) {
    return 'W005';
  }

  return clean;
}

/**
 * Returns the full warehouse name (e.g. 'CACC (KPT)') for a given warehouse ID or legacy name.
 */
export function getWarehouseName(val?: string | null): string {
  const id = getWarehouseId(val);
  const found = DESTINATION_WAREHOUSES.find((w) => w.id === id);
  if (found) return found.name;
  return val ? val.trim() : 'CACC (KPT)';
}

/**
 * Returns the full display label (e.g. 'W002 - CACC (KPT)') for a given warehouse ID or legacy name.
 */
export function getWarehouseDisplay(val?: string | null): string {
  const id = getWarehouseId(val);
  const found = DESTINATION_WAREHOUSES.find((w) => w.id === id);
  if (found) return found.label;
  return val ? `${id} - ${val}` : 'W002 - CACC (KPT)';
}
