import { db } from '@/lib/db';

export interface SessionUserInfo {
  id?: string;
  role?: string;
  assignedProvinces?: string;
  [key: string]: any;
}

export const CANONICAL_PROVINCES = ['Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondulkiri'] as const;

export function normalizeProvinceName(name: string): string {
  const clean = name.trim().toLowerCase();
  if (clean === 'preah vihear') return 'Preah Vihear';
  if (clean === 'stung treng') return 'Stung Treng';
  if (clean === 'ratanakiri') return 'Ratanakiri';
  if (clean === 'mondulkiri' || clean === 'mondolkiri') return 'Mondulkiri';
  return name.trim();
}

/**
 * Returns allowed village names array for FIELD team user session.
 * If user is ADMIN or non-FIELD role, or assignedProvinces contains all provinces, returns null (unrestricted).
 */
export async function getAllowedVillagesForSession(
  sessionUser?: SessionUserInfo | null
): Promise<string[] | null> {
  if (!sessionUser) return null;

  const role = sessionUser.role;
  // Non-FIELD roles (ADMIN, WAREHOUSE, INVENTORY, FINANCE) have full cross-regional access
  if (role !== 'FIELD') {
    return null;
  }

  const rawAssigned = sessionUser.assignedProvinces?.trim();
  if (!rawAssigned || rawAssigned.toLowerCase() === 'na' || rawAssigned.toLowerCase() === 'all') {
    return null;
  }

  const normalizedProvinces = Array.from(
    new Set(
      rawAssigned
        .split(',')
        .map((p) => normalizeProvinceName(p))
        .filter(Boolean)
    )
  );

  // If user is assigned to all 4 provinces, return null (unrestricted)
  if (
    normalizedProvinces.length >= 4 ||
    CANONICAL_PROVINCES.every((ap) => normalizedProvinces.some((p) => p.toLowerCase() === ap.toLowerCase()))
  ) {
    return null;
  }

  // Expand Mondulkiri/Mondolkiri for DB query safety
  const queryProvinces = new Set<string>(normalizedProvinces);
  if (queryProvinces.has('Mondulkiri')) {
    queryProvinces.add('Mondolkiri');
  }

  // Fetch villages belonging to user's assigned provinces
  const villages = await db.village.findMany({
    where: {
      province: { in: Array.from(queryProvinces) },
    },
    select: { name: true },
  });

  return villages.map((v) => v.name);
}

/**
 * Helper to check if a target village is authorized for the given session.
 */
export async function isVillageAuthorized(
  villageName: string,
  sessionUser?: SessionUserInfo | null
): Promise<boolean> {
  const allowed = await getAllowedVillagesForSession(sessionUser);
  if (allowed === null) return true; // Unrestricted
  return allowed.includes(villageName.trim());
}
