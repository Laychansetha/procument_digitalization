import { db } from '../src/lib/db';

async function testProvinceAndCombinedMatching() {
  console.log('🧪 Starting Province Village Filtering & Combined Matching Test...\n');

  // 1. Verify all provinces village counts from DB
  const pvhVillages = await db.village.findMany({ where: { province: { equals: 'Preah Vihear', mode: 'insensitive' } } });
  const stVillages = await db.village.findMany({ where: { province: { equals: 'Stung Treng', mode: 'insensitive' } } });
  const rtkVillages = await db.village.findMany({ where: { province: { equals: 'Ratanakiri', mode: 'insensitive' } } });
  const mdkVillages = await db.village.findMany({ where: { province: { equals: 'Mondulkiri', mode: 'insensitive' } } });

  console.log(`✓ Preah Vihear: ${pvhVillages.length} villages (expected 17)`);
  console.log(`✓ Stung Treng: ${stVillages.length} villages (expected 23)`);
  console.log(`✓ Ratanakiri: ${rtkVillages.length} villages (expected 10)`);
  console.log(`✓ Mondolkiri: ${mdkVillages.length} villages (expected 11)`);

  if (pvhVillages.length !== 17 || stVillages.length !== 23 || rtkVillages.length !== 10 || mdkVillages.length !== 11) {
    throw new Error('❌ Village count mismatch with official master database!');
  }

  // 2. Test Combined Matching: Create two farmers with SAME familyCode 'KK-001' in different villages
  console.log('\n🧪 Testing Combined Key (Family Code + Village)...');
  const code = 'KK-001';
  const village1 = 'Kang Kngaok'; // Stung Treng
  const village2 = 'Khes Kroam';  // Stung Treng

  const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin user found');

  // Create Farmer 1
  const f1 = await db.farmerProfile.upsert({
    where: { id: 'test_f1_kk_001' },
    update: { farmerName: 'Farmer One (Kang Kngaok)', village: village1, familyCode: code },
    create: {
      id: 'test_f1_kk_001',
      familyCode: code,
      farmerName: 'Farmer One (Kang Kngaok)',
      village: village1,
      bankName: 'ABA Bank',
      accountNumber: '11111111',
      accountHolder: 'Farmer One',
      paymentMethod: 'Bank Transfer',

      user: { connect: { id: admin.id } },
    },
  });

  // Create Farmer 2 with SAME code 'KK-001' in different village
  const f2 = await db.farmerProfile.upsert({
    where: { id: 'test_f2_kk_001' },
    update: { farmerName: 'Farmer Two (Khes Kroam)', village: village2, familyCode: code },
    create: {
      id: 'test_f2_kk_001',
      familyCode: code,
      farmerName: 'Farmer Two (Khes Kroam)',
      village: village2,
      bankName: 'Wing Bank',
      accountNumber: '22222222',
      accountHolder: 'Farmer Two',
      paymentMethod: 'Bank Transfer',

      user: { connect: { id: admin.id } },
    },
  });

  // Lookup with Village 1
  const lookup1 = await db.farmerProfile.findFirst({
    where: { familyCode: code, village: village1 },
  });
  console.log(`✓ Lookup (${code} in ${village1}):`, lookup1?.farmerName);

  // Lookup with Village 2
  const lookup2 = await db.farmerProfile.findFirst({
    where: { familyCode: code, village: village2 },
  });
  console.log(`✓ Lookup (${code} in ${village2}):`, lookup2?.farmerName);

  if (lookup1?.farmerName !== 'Farmer One (Kang Kngaok)' || lookup2?.farmerName !== 'Farmer Two (Khes Kroam)') {
    throw new Error('❌ Combined lookup failed to distinguish between farmers with identical Family Code in different villages!');
  }

  // Cleanup test profiles
  await db.farmerProfile.deleteMany({ where: { id: { in: ['test_f1_kk_001', 'test_f2_kk_001'] } } });

  console.log('\n🎉 ALL PROVINCE FILTERING & COMBINED MATCHING TESTS PASSED SUCCESSFULLY!');
}

testProvinceAndCombinedMatching()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
