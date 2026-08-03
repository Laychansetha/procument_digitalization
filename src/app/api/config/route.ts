import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default fallback settings
const DEFAULT_SETTINGS = {
  seedInterestRate: 1.10,
  scaleTolerancePercent: 1.5,
  orgName: 'IBIS RICE Cambodia',
  orgLogoUrl: '/logo.png',
  defaultCurrency: 'KHR',
  measurementUnit: 'kg',
  offlineSyncPeriodDays: 30,
};

export async function GET() {
  try {
    // 1. Fetch SystemSettings Key-Value Store
    const dbSettings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const item of dbSettings) {
      try {
        settingsMap[item.key] = JSON.parse(item.value);
      } catch (e) {
        settingsMap[item.key] = item.value;
      }
    }

    // 2. Fetch Paddy Price Specs
    let paddySpecs = await prisma.paddyPriceSpec.findMany({
      orderBy: [{ variety: 'asc' }, { grade: 'asc' }],
    });

    if (paddySpecs.length === 0) {
      paddySpecs = [
        { id: 'default_1', variety: 'Phka Rumduol', grade: 'A1', basePrice: 1750, organicBonus: 100, maxMoisture: 14.0, maxForeignMatter: 5.0, minWholeGrain: 75, maxBrokenRice: 25, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
        { id: 'default_2', variety: 'Red Jasmine', grade: 'A1', basePrice: 1650, organicBonus: 100, maxMoisture: 14.0, maxForeignMatter: 5.0, minWholeGrain: 75, maxBrokenRice: 25, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
        { id: 'default_3', variety: 'Sen Kra Ob', grade: 'A1', basePrice: 1600, organicBonus: 100, maxMoisture: 14.0, maxForeignMatter: 5.0, minWholeGrain: 75, maxBrokenRice: 25, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      ] as any;
    }

    // 3. Fetch Villages
    let rawVillages = await prisma.village.findMany({
      orderBy: { name: 'asc' },
    });

    if (rawVillages.length === 0) {
      rawVillages = [
        { id: 'v_1', name: 'Bra', code: 'BRA', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'v_2', name: 'Chhaeb Kraom', code: 'CHK', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'v_3', name: 'Chhaeb Leu', code: 'CHL', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'v_4', name: 'Mlu Prey', code: 'MLP', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'v_5', name: 'Sangkae', code: 'SKE', district: 'Chhaeb', province: 'Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
      ] as any;
    }

    // 4. Fetch Commercial Banks
    let rawBanks = await prisma.bank.findMany({
      orderBy: { name: 'asc' },
    });

    if (rawBanks.length === 0) {
      rawBanks = [
        { id: 'b_1', name: 'ABA Bank', code: 'ABA', status: 'ACTIVE', createdAt: new Date() },
        { id: 'b_2', name: 'ACLEDA Bank', code: 'ACL', status: 'ACTIVE', createdAt: new Date() },
        { id: 'b_3', name: 'Wing Bank', code: 'WING', status: 'ACTIVE', createdAt: new Date() },
        { id: 'b_4', name: 'Canadia Bank', code: 'CND', status: 'ACTIVE', createdAt: new Date() },
        { id: 'b_5', name: 'AMK Microfinance', code: 'AMK', status: 'ACTIVE', createdAt: new Date() },
      ] as any;
    }

    // 5. Fetch Location Registries (Buying Stations & Warehouses)
    let locations = await prisma.locationRegistry.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    if (locations.length === 0) {
      locations = [
        { id: 'loc_1', name: 'Chhaeb Buying Station', type: 'BUYING_STATION', code: 'STN-CHB', address: 'Chhaeb, Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'loc_2', name: 'Mlu Prey Collection Point', type: 'BUYING_STATION', code: 'STN-MLP', address: 'Mlu Prey, Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'loc_3', name: 'Tbeng Meanchey Station', type: 'BUYING_STATION', code: 'STN-TBM', address: 'Tbeng Meanchey, Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'loc_4', name: 'Central Mill Warehouse, Preah Vihear', type: 'WAREHOUSE', code: 'WH-PVH', address: 'Central Hub, Preah Vihear', status: 'ACTIVE', createdAt: new Date() },
        { id: 'loc_5', name: 'Phnom Penh Export Terminal', type: 'WAREHOUSE', code: 'WH-PNH', address: 'Phnom Penh Port', status: 'ACTIVE', createdAt: new Date() },
      ] as any;
    }

    // 6. Fetch Fleet Vehicles
    let fleet = await prisma.fleetVehicle.findMany({
      where: { status: 'ACTIVE' },
    });

    return NextResponse.json({
      settings: settingsMap,
      paddySpecs,
      rawVillages,
      rawBanks,
      villages: rawVillages.map((v) => v.name),
      banks: rawBanks.map((b) => b.name),
      locations,
      fleet,
    });
  } catch (error: any) {
    console.error('API Config GET Error:', error);
    return NextResponse.json(
      {
        settings: DEFAULT_SETTINGS,
        paddySpecs: [],
        rawVillages: [],
        rawBanks: [],
        villages: ['Bra', 'Chhaeb Kraom', 'Chhaeb Leu', 'Mlu Prey', 'Sangkae'],
        banks: ['ABA Bank', 'ACLEDA Bank', 'Wing Bank', 'Canadia Bank', 'AMK Microfinance'],
        locations: [
          { id: 'loc_1', name: 'Chhaeb Buying Station', type: 'BUYING_STATION' },
          { id: 'loc_2', name: 'Central Mill Warehouse, Preah Vihear', type: 'WAREHOUSE' },
        ],
        fleet: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringVal },
      create: { key, value: stringVal },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error('API Config POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
