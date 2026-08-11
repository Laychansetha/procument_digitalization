import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, assignedProvinces: true },
  });
  console.log('=== USERS & ASSIGNED PROVINCES ===');
  console.table(users);

  const villages = await prisma.village.findMany({
    select: { id: true, name: true, district: true, province: true },
  });
  console.log('\n=== VILLAGES BY PROVINCE ===');
  const byProvince: Record<string, string[]> = {};
  for (const v of villages) {
    const prov = v.province || 'Unassigned';
    if (!byProvince[prov]) byProvince[prov] = [];
    byProvince[prov].push(v.name);
  }
  for (const [prov, vList] of Object.entries(byProvince)) {
    console.log(`\n--- ${prov} (${vList.length} villages) ---`);
    console.log(vList.join(', '));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
