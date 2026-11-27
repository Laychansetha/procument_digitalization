import { normalizeProvinceName } from '@/lib/province-guard';

/**
 * Canonical 2026 regional pricing zones derived from villages_province_grade_warehouse.xlsx (specs_price_2026).
 * - Region 1: Preah Vihear and Mondolkiri
 * - Region 2: Stung Treng and Ratanakiri
 */
export const PRICING_REGION_1 = 'Preah Vihear and Mondolkiri' as const;
export const PRICING_REGION_2 = 'Stung Treng and Ratanakiri' as const;

export type PricingRegion = typeof PRICING_REGION_1 | typeof PRICING_REGION_2;

export const ALL_PRICING_REGIONS: readonly PricingRegion[] = [
  PRICING_REGION_1,
  PRICING_REGION_2,
];

/**
 * Normalizes a pricing region label (case-insensitive, tolerant of Mondulkiri/Mondolkiri spelling).
 */
export function normalizePricingRegion(region?: string | null): PricingRegion {
  const clean = (region || '').trim().toLowerCase();
  if (
    clean.includes('stung treng') ||
    clean.includes('ratanakiri') ||
    clean === 'region 2' ||
    clean === 'region_2'
  ) {
    return PRICING_REGION_2;
  }
  return PRICING_REGION_1;
}

/**
 * Maps a single province name to its Pricing Region.
 * Returns null if the province is empty or unrecognized.
 */
export function getPricingRegionForProvince(province?: string | null): PricingRegion | null {
  if (!province || !province.trim()) return null;
  const norm = normalizeProvinceName(province);
  if (norm === 'Preah Vihear' || norm === 'Mondulkiri') {
    return PRICING_REGION_1;
  }
  if (norm === 'Stung Treng' || norm === 'Ratanakiri') {
    return PRICING_REGION_2;
  }
  return null;
}

/**
 * Resolves a single applicable Pricing Region from a comma-separated assignedProvinces string
 * (e.g. "Preah Vihear", "Mondulkiri", "Stung Treng", "Ratanakiri").
 * Returns null when the user has cross-regional / unrestricted access (e.g. ADMIN, "na", "All",
 * or provinces spanning both Region 1 and Region 2).
 */
export function getPricingRegionForAssignedProvinces(
  assignedProvinces?: string | null
): PricingRegion | null {
  const raw = (assignedProvinces || '').trim();
  if (!raw || raw.toLowerCase() === 'na' || raw.toLowerCase() === 'all') {
    return null;
  }

  const regions = new Set<PricingRegion>();
  for (const token of raw.split(',')) {
    const region = getPricingRegionForProvince(token);
    if (region) {
      regions.add(region);
    }
  }

  if (regions.size === 1) {
    return Array.from(regions)[0];
  }
  return null;
}
