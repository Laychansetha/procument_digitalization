import { db } from '@/lib/db';

export interface SessionUserInfo {
  id?: string;
  role?: string;
  assignedProvinces?: string;
  [key: string]: any;
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
  if (!rawAssigned) {
    return null;
  }

  const provinces = rawAssigned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  // If user is assigned to all 4 provinces, return null (unrestricted)
  const allProvinces = ['Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondolkiri'];
  if (provinces.length >= 4 || allProvinces.every((p) => provinces.includes(p))) {
    return null;
  }

  // Fetch villages belonging to user's assigned provinces
  const villages = await db.village.findMany({
    where: {
      province: { in: provinces },
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
