import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding IBIS RICE master database from official configuration...');

  const passwordHash = await bcrypt.hash('Ibis2026!', 10);

  // 1. Create Default Core Role Accounts (.org & .com)
  const coreAccounts = [
    { email: 'admin@ibisrice.org', name: 'System Admin', role: 'ADMIN', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    { email: 'admin@ibisrice.com', name: 'System Admin', role: 'ADMIN', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    { email: 'warehouse@ibisrice.org', name: 'Bopha (Warehouse Scale Operator)', role: 'WAREHOUSE', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    { email: 'warehouse@ibisrice.com', name: 'Bopha (Warehouse Scale Operator)', role: 'WAREHOUSE', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    { email: 'finance@ibisrice.org', name: 'Channa (Finance Officer)', role: 'FINANCE', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    { email: 'finance@ibisrice.com', name: 'Channa (Finance Officer)', role: 'FINANCE', provinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
  ];

  for (const acc of coreAccounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { name: acc.name, role: acc.role as any, assignedProvinces: acc.provinces, status: 'ACTIVE' },
      create: {
        name: acc.name,
        email: acc.email,
        password: passwordHash,
        role: acc.role as any,
        assignedProvinces: acc.provinces,
        status: 'ACTIVE',
      },
    });
  }

  // 2. Create 24 Field Staff Accounts across 4 Provinces
  const provincesList = ['Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondulkiri'];
  for (let i = 1; i <= 24; i++) {
    const provinceAssigned = provincesList[(i - 1) % provincesList.length];
    const staffEmail = `field${i}@ibisrice.org`;
    const staffName = `Field Inspector #${i} (${provinceAssigned})`;

    await prisma.user.upsert({
      where: { email: staffEmail },
      update: { name: staffName, role: 'FIELD', assignedProvinces: provinceAssigned, status: 'ACTIVE' },
      create: {
        name: staffName,
        email: staffEmail,
        password: passwordHash,
        role: 'FIELD',
        assignedProvinces: provinceAssigned,
        status: 'ACTIVE',
      },
    });
  }

  // Include general field@ibisrice.org & field@ibisrice.com
  await prisma.user.upsert({
    where: { email: 'field@ibisrice.org' },
    update: { name: 'Sokha (Lead Inspector)', role: 'FIELD', assignedProvinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri' },
    create: {
      name: 'Sokha (Lead Inspector)',
      email: 'field@ibisrice.org',
      password: passwordHash,
      role: 'FIELD',
      assignedProvinces: 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri',
      status: 'ACTIVE',
    },
  });

  // 3. Seed Official Target Villages & Provinces from Excel configuration
  const villageData = [
    // Preah Vihear
    { name: 'Prey Veng', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Sambou', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Koh Ker', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Damnak Kantout', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Dan', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Pongro', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Kampenh', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Yeang', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Kong Yoang', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Tmat Paeuy', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Krala Peas', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Dang Phlet', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Narong', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Bra', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Soung', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Kham Keut', district: 'Chhaeb', province: 'Preah Vihear' },
    { name: 'Kampong Sangkae', district: 'Chhaeb', province: 'Preah Vihear' },

    // Stung Treng
    { name: 'Doung', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Kes', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Kang Cham', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Kang Kngaok', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Khes Kroam', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Khes Svay', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Pong Kriel', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Kham Phouk', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Phum Lun', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Ban Moung', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Samor', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Chantu', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Keng Nhai', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Siem Pang', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Dan Loung', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Peam Khes', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Srae Russei', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Kanchanh Kouk', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Teteam', district: 'Siem Pang', province: 'Stung Treng' },
    { name: "O'Chay", district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Nhang Sum', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'La Kay', district: 'Siem Pang', province: 'Stung Treng' },
    { name: 'Pha Bang', district: 'Siem Pang', province: 'Stung Treng' },

    // Ratanakiri
    { name: 'I-Tub', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Bak Kae', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Korng Nork', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Kalan', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Srae Pokthom', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Thmey', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Srae Chhuk', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Srae Poktoch', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Srae Chrey', district: 'Taveng', province: 'Ratanakiri' },
    { name: 'Roveak', district: 'Taveng', province: 'Ratanakiri' },

    // Mondulkiri
    { name: 'Pu Char', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Pu Kung', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Ou Chra', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Andoung Kraloeng', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Srae Lvi', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Gati', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Pu Trom', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Chokchar', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Sre Andaol', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Kmoum', district: 'Sen Monorom', province: 'Mondulkiri' },
    { name: 'Ktung', district: 'Sen Monorom', province: 'Mondulkiri' },
  ];

  for (const v of villageData) {
    await prisma.village.upsert({
      where: { name: v.name },
      update: { district: v.district, province: v.province, status: 'ACTIVE' },
      create: {
        name: v.name,
        district: v.district,
        province: v.province,
        status: 'ACTIVE',
      },
    });
  }

  // 4. Seed Commercial Banks
  const defaultBanks = [
    { name: 'ABA Bank', code: 'ABA' },
    { name: 'ACLEDA Bank', code: 'ACL' },
    { name: 'Canadia Bank', code: 'CAN' },
    { name: 'Sathapana Bank', code: 'STP' },
    { name: 'Wing Bank', code: 'WING' },
    { name: 'PRASAC Microfinance', code: 'PRASAC' },
    { name: 'AMK Microfinance', code: 'AMK' },
    { name: 'Hattha Bank', code: 'HTB' },
    { name: 'Campu Bank (Public Bank)', code: 'CPB' },
  ];

  for (const bank of defaultBanks) {
    await prisma.bank.upsert({
      where: { name: bank.name },
      update: { code: bank.code, status: 'ACTIVE' },
      create: {
        name: bank.name,
        code: bank.code,
        status: 'ACTIVE',
      },
    });
  }

  // 5. Seed Official Paddy Price Specifications & Base Prices from Excel configuration
  const defaultPriceSpecs = [
    // Phka Rumduol
    { variety: 'Phka Rumduol', grade: 'A1', basePrice: 1650, maxMoisture: 14.0, maxForeignMatter: 5.0 },
    { variety: 'Phka Rumduol', grade: 'A2', basePrice: 1550, maxMoisture: 14.5, maxForeignMatter: 5.0 },
    { variety: 'Phka Rumduol', grade: 'B1', basePrice: 1500, maxMoisture: 15.0, maxForeignMatter: 6.0 },
    { variety: 'Phka Rumduol', grade: 'B2', basePrice: 1450, maxMoisture: 15.5, maxForeignMatter: 6.5 },

    // Red Jasmine
    { variety: 'Red Jasmine', grade: 'A1', basePrice: 1850, maxMoisture: 14.0, maxForeignMatter: 5.0 },
    { variety: 'Red Jasmine', grade: 'A2', basePrice: 1750, maxMoisture: 14.5, maxForeignMatter: 5.0 },
    { variety: 'Red Jasmine', grade: 'B1', basePrice: 1700, maxMoisture: 15.0, maxForeignMatter: 6.0 },
    { variety: 'Red Jasmine', grade: 'B2', basePrice: 1650, maxMoisture: 15.5, maxForeignMatter: 6.5 },

    // Foundation Seed - Phka Rumduol
    { variety: 'Foundation Seed - Phka Rumduol', grade: 'A', basePrice: 2050, maxMoisture: 13.5, maxForeignMatter: 3.0 },

    // Foundation Seed - Red Jasmine
    { variety: 'Foundation Seed - Red Jasmine', grade: 'A', basePrice: 2150, maxMoisture: 13.5, maxForeignMatter: 3.0 },

    // Certified Seed
    { variety: 'Certified Seed', grade: 'A', basePrice: 1900, maxMoisture: 14.0, maxForeignMatter: 4.0 },

    // White Rice
    { variety: 'White Rice', grade: 'A', basePrice: 1320, maxMoisture: 14.0, maxForeignMatter: 5.0 },
    { variety: 'White Rice', grade: 'B', basePrice: 1220, maxMoisture: 15.0, maxForeignMatter: 6.0 },
  ];

  for (const spec of defaultPriceSpecs) {
    await prisma.paddyPriceSpec.upsert({
      where: {
        variety_grade: {
          variety: spec.variety,
          grade: spec.grade,
        },
      },
      update: spec,
      create: spec,
    });
  }

  // 6. Seed Official Warehouses & Buying Stations from Excel configuration
  const defaultLocations = [
    { name: 'CACC (KPT)', code: 'WH-CACC', type: 'WAREHOUSE', address: 'KPT Central Warehouse' },
    { name: 'Amru Nature (KPG)', code: 'WH-AMRU', type: 'WAREHOUSE', address: 'KPG Processing Facility' },
    { name: 'Other', code: 'WH-OTH', type: 'WAREHOUSE', address: 'General / Regional Hub' },
    { name: 'Preah Vihear', code: 'ST-PVH', type: 'STATION', address: 'Preah Vihear Regional Station' },
    { name: 'Stung Treng', code: 'ST-STR', type: 'STATION', address: 'Stung Treng Regional Station' },
    { name: 'Ratanakiri', code: 'ST-RAT', type: 'STATION', address: 'Ratanakiri Regional Station' },
    { name: 'Mondulkiri', code: 'ST-MDK', type: 'STATION', address: 'Mondulkiri Regional Station' },
  ];

  for (const loc of defaultLocations) {
    await prisma.locationRegistry.upsert({
      where: { name: loc.name },
      update: loc,
      create: loc,
    });
  }

  // 7. Seed System Configurations
  await prisma.systemSetting.upsert({
    where: { key: 'SCALE_TOLERANCE_PERCENT' },
    update: { value: '1.5' },
    create: {
      key: 'SCALE_TOLERANCE_PERCENT',
      value: '1.5',
    },
  });

  console.log('✅ Seeded 61 official target villages across 4 provinces (Preah Vihear, Stung Treng, Ratanakiri, Mondulkiri)');
  console.log('✅ Seeded official Paddy Price Specs (Phka Rumduol: 1650/1550/1500/1450, Red Jasmine: 1850/1750/1700/1650, Seed & White Rice)');
  console.log('✅ Seeded official Warehouses (CACC KPT, Amru Nature KPG, Other)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
