import { db } from '../src/lib/db';

async function testMasterDataSync() {
  console.log('🧪 Testing Master Data Sync (Bank Addition & /api/config response)...');

  const testBankName = `Test Bank ${Date.now()}`;
  console.log(`1. Upserting new bank: "${testBankName}"...`);

  const createdBank = await db.bank.upsert({
    where: { name: testBankName },
    update: { status: 'ACTIVE', code: 'TEST' },
    create: { name: testBankName, code: 'TEST', status: 'ACTIVE' },
  });

  console.log('2. Fetching /api/config from server...');
  const res = await fetch('http://localhost:3000/api/config?t=' + Date.now());
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}`);
  }

  const data = await res.json();
  const rawBanks: any[] = data.rawBanks || [];
  const banks: string[] = data.banks || [];

  console.log(`   Total Banks Returned: ${rawBanks.length}`);

  const hasNewBank = banks.includes(testBankName) || rawBanks.some((b) => b.name === testBankName);

  if (!hasNewBank) {
    throw new Error(`❌ Failed: New bank "${testBankName}" was NOT found in /api/config response!`);
  }

  console.log(`✓ New bank "${testBankName}" successfully retrieved in /api/config response!`);

  // Clean up test bank
  await db.bank.delete({ where: { id: createdBank.id } });
  console.log('✓ Cleaned up test bank.');
  console.log('🎉 MASTER DATA SYNC VERIFICATION PASSED SUCCESSFULLY!');
}

testMasterDataSync().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
