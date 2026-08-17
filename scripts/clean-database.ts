import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning test transaction data while preserving master configuration...');

  // Delete transaction records in order of foreign key dependencies
  const deletedIntakes = await prisma.warehouseIntake.deleteMany({});
  console.log(`  ✓ Cleared ${deletedIntakes.count} Warehouse Intake records.`);

  const deletedLots = await prisma.transportLot.deleteMany({});
  console.log(`  ✓ Cleared ${deletedLots.count} Transport Lot records.`);

  const deletedItems = await prisma.purchaseItem.deleteMany({});
  console.log(`  ✓ Cleared ${deletedItems.count} Purchase Item records.`);

  const deletedPurchases = await prisma.purchaseRecord.deleteMany({});
  console.log(`  ✓ Cleared ${deletedPurchases.count} Purchase records.`);

  const deletedTransports = await prisma.transportRecord.deleteMany({});
  console.log(`  ✓ Cleared ${deletedTransports.count} Transport records.`);

  const deletedSpecs = await prisma.specsRecord.deleteMany({});
  console.log(`  ✓ Cleared ${deletedSpecs.count} Quality Specs records.`);

  const deletedProfiles = await prisma.farmerProfile.deleteMany({});
  console.log(`  ✓ Cleared ${deletedProfiles.count} Farmer Profiles.`);

  const deletedRejections = await prisma.rejectionLog.deleteMany({});
  console.log(`  ✓ Cleared ${deletedRejections.count} Rejection Log records.`);

  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`  ✓ Cleared ${deletedAuditLogs.count} Audit Logs.`);

  // Clean uploaded test files in public/uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedFilesCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(uploadsDir, file));
        deletedFilesCount++;
      }
    }
    console.log(`  ✓ Removed ${deletedFilesCount} test upload files from public/uploads.`);
  }

  console.log('✅ Local database transaction records and upload files successfully cleaned.');
}

cleanDatabase()
  .catch((err) => {
    console.error('❌ Error during database cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
