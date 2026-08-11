import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE ROW COUNTS ===');
  console.log('User:', await prisma.user.count());
  console.log('Village:', await prisma.village.count());
  console.log('Bank:', await prisma.bank.count());
  console.log('LocationRegistry:', await prisma.locationRegistry.count());
  console.log('PaddyPriceSpec:', await prisma.paddyPriceSpec.count());
  console.log('SystemSetting:', await prisma.systemSetting.count());
  console.log('---------------------------');
  console.log('FarmerProfile (Transaction):', await prisma.farmerProfile.count());
  console.log('SpecsRecord (Transaction):', await prisma.specsRecord.count());
  console.log('PurchaseRecord (Transaction):', await prisma.purchaseRecord.count());
  console.log('PurchaseItem (Transaction):', await prisma.purchaseItem.count());
  console.log('TransportRecord (Transaction):', await prisma.transportRecord.count());
  console.log('TransportLot (Transaction):', await prisma.transportLot.count());
  console.log('WarehouseIntake (Transaction):', await prisma.warehouseIntake.count());
  console.log('AuditLog (Transaction):', await prisma.auditLog.count());
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
