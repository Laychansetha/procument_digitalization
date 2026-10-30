import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding IBIS RICE master database from official configuration...');

  // 1. Seed Official Accounts from username_roles.csv
  const csvUsers = [
    { province: 'na', username: 'chansetha', password: 'Setha*2026', role: 'ADMIN' },
    { province: 'Preah Vihear', username: 'piseth', password: 'PVH-piseth-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'chandara', password: 'PVH-chandara-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'chin', password: 'PVH-chin-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'sokunrath', password: 'PVH-sokunrath-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'vornne', password: 'PVH-vornne-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'sokun', password: 'PVH-sokun-2026', role: 'FIELD' },
    { province: 'Preah Vihear', username: 'vuthy', password: 'PVH-vuthy-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'theavy', password: 'ST-theavy-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'samol', password: 'ST-samol-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'yornthy', password: 'ST-yornthy-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'kalayan', password: 'ST-kalayan-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'vongrith', password: 'ST-vongrith-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'samath', password: 'ST-samath-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'kimly', password: 'ST-kimly-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'sreypov', password: 'ST-sreypov-2026', role: 'FIELD' },
    { province: 'Stung Treng', username: 'thearith', password: 'ST-thearith-2026', role: 'FIELD' },
    { province: 'Ratanakiri', username: 'sombath', password: 'RTK-sombath-2026', role: 'FIELD' },
    { province: 'Mondulkiri', username: 'tong', password: 'MDK-tong-2026', role: 'FIELD' },
    { province: 'Mondulkiri', username: 'sokmen', password: 'MDK-sokmen-2026', role: 'FIELD' },
    { province: 'Mondulkiri', username: 'vimean', password: 'MDK-vimean-2026', role: 'FIELD' },
    { province: 'Mondulkiri', username: 'chantha', password: 'MDK-chantha-2026', role: 'FIELD' },
    { province: 'Mondulkiri', username: 'thana', password: 'MDK-thana-2026', role: 'FIELD' },
    { province: 'na', username: 'chanvoleak', password: 'PP-voleak-2026', role: 'FINANCE' },
    { province: 'na', username: 'sengiy', password: 'PP-seangiy-2026', role: 'FINANCE' },
    { province: 'na', username: 'neath', password: 'PP-neath-2026', role: 'FINANCE' },
    { province: 'na', username: 'kanha', password: 'PP-kanha-2026', role: 'FINANCE' },
    { province: 'na', username: 'heap', password: 'ST-heap-2026', role: 'FINANCE' },
    { province: 'na', username: 'phearun', password: 'KPT-phearun-2026', role: 'WAREHOUSE' },
    { province: 'na', username: 'bousong', password: 'PNH-bousong-2026', role: 'INVENTORY' },
  ];

  for (const u of csvUsers) {
    const userPassHash = await bcrypt.hash(u.password, 10);
    const email = `${u.username}@ibisrice.com`;
    await prisma.user.upsert({
      where: { email },
      update: { name: u.username, password: userPassHash, role: u.role as any, assignedProvinces: u.province, status: 'ACTIVE' },
      create: {
        name: u.username,
        email: email,
        password: userPassHash,
        role: u.role as any,
        assignedProvinces: u.province,
        status: 'ACTIVE',
      },
    });
  }

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
    { variety: 'Phka Rumduol', grade: 'A1', basePrice: 1650, minWholeGrain: 75, maxBrokenRice: 25, impurity: 2, maxForeignMatter: 6, maxMoisture: 13.5, moistureRange: '13 - 14' },
    { variety: 'Phka Rumduol', grade: 'A2', basePrice: 1550, minWholeGrain: 70, maxBrokenRice: 30, impurity: 4, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },
    { variety: 'Phka Rumduol', grade: 'B1', basePrice: 1500, minWholeGrain: 60, maxBrokenRice: 40, impurity: 2, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },
    { variety: 'Phka Rumduol', grade: 'B2', basePrice: 1450, minWholeGrain: 50, maxBrokenRice: 50, impurity: 4, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },

    // Red Jasmine
    { variety: 'Red Jasmine', grade: 'A1', basePrice: 1850, minWholeGrain: 75, maxBrokenRice: 25, impurity: null, maxForeignMatter: 6, maxMoisture: 13.5, moistureRange: '13 - 14' },
    { variety: 'Red Jasmine', grade: 'A2', basePrice: 1750, minWholeGrain: 70, maxBrokenRice: 30, impurity: null, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },
    { variety: 'Red Jasmine', grade: 'B1', basePrice: 1700, minWholeGrain: 60, maxBrokenRice: 40, impurity: null, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },
    { variety: 'Red Jasmine', grade: 'B2', basePrice: 1650, minWholeGrain: 50, maxBrokenRice: 50, impurity: null, maxForeignMatter: 6, maxMoisture: 14.0, moistureRange: '13 - 15' },

    // Foundation Seed - Red Jasmine
    { variety: 'Foundation Seed - Red Jasmine', grade: 'A', basePrice: 2150, minWholeGrain: 98, maxBrokenRice: null, impurity: 1, maxForeignMatter: 1, maxMoisture: 12.0, moistureRange: '11 - 13' },

    // Foundation Seed - Phka Rumduol
    { variety: 'Foundation Seed - Phka Rumduol', grade: 'A', basePrice: 2050, minWholeGrain: 98, maxBrokenRice: null, impurity: 1, maxForeignMatter: 1, maxMoisture: 12.0, moistureRange: '11 - 13' },

    // Certified Seed
    { variety: 'Certified Seed', grade: 'A', basePrice: 1900, minWholeGrain: 96, maxBrokenRice: null, impurity: 2, maxForeignMatter: 2, maxMoisture: 12.0, moistureRange: '11 - 13' },

    // White Rice
    { variety: 'White Rice', grade: 'A', basePrice: 1320, minWholeGrain: null, maxBrokenRice: null, impurity: null, maxForeignMatter: 4, maxMoisture: 13.5, moistureRange: '13 - 14' },
    { variety: 'White Rice', grade: 'B', basePrice: 1220, minWholeGrain: null, maxBrokenRice: null, impurity: null, maxForeignMatter: 8, maxMoisture: 13.5, moistureRange: '13 - 14' },
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
    { name: 'CACC (KPT)', code: 'W002', type: 'WAREHOUSE', address: 'KPT Central Warehouse' },
    { name: 'Amru Nature (KPG)', code: 'W003', type: 'WAREHOUSE', address: 'KPG Processing Facility' },
    { name: 'Koh Nhek', code: 'W004', type: 'WAREHOUSE', address: 'Koh Nhek Regional Warehouse' },
    { name: 'Other', code: 'W005', type: 'WAREHOUSE', address: 'General / Regional Hub' },
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
