import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  seedInterestRate: 1.10,
  scaleTolerancePercent: 1.5,
  orgName: 'IBIS RICE Cambodia',
  orgLogoUrl: '/logo.png',
  defaultCurrency: 'KHR',
  measurementUnit: 'kg',
  offlineSyncPeriodDays: 30,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provincesQuery = searchParams.get('provinces'); // e.g. "Preah Vihear,Stung Treng"
    const userIdQuery = searchParams.get('userId');

    let assignedProvincesList: string[] = [];

    if (provincesQuery && provincesQuery.trim()) {
      assignedProvincesList = provincesQuery.split(',').map((p) => p.trim().toLowerCase());
    } else if (userIdQuery) {
      const user = await prisma.user.findUnique({ where: { id: userIdQuery } });
      if (user?.assignedProvinces) {
        assignedProvincesList = user.assignedProvinces.split(',').map((p) => p.trim().toLowerCase());
      }
    }

    // 1. Fetch SystemSettings
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
    const paddySpecs = await prisma.paddyPriceSpec.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ variety: 'asc' }, { grade: 'asc' }],
    });

    // 3. Fetch Villages
    const rawVillages = await prisma.village.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
    });

    // Filter villages if user has assigned provinces
    let filteredVillages = rawVillages;
    if (assignedProvincesList.length > 0) {
      filteredVillages = rawVillages.filter((v) =>
        assignedProvincesList.includes((v.province || 'Preah Vihear').toLowerCase())
      );
      // Fallback: if filtering yields empty, return all villages
      if (filteredVillages.length === 0) filteredVillages = rawVillages;
    }

    // 4. Fetch Commercial Banks
    const rawBanks = await prisma.bank.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });

    // 5. Fetch Location Registries (Buying Stations & Warehouses)
    const locations = await prisma.locationRegistry.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // 6. Fetch Fleet Vehicles
    const fleet = await prisma.fleetVehicle.findMany({
      where: { status: 'ACTIVE' },
    });

    const serverTimestamp = new Date().toISOString();
    const configVersion = `v1-${Date.now()}`;

    return NextResponse.json({
      serverTimestamp,
      configVersion,
      settings: settingsMap,
      paddySpecs,
      rawVillages: filteredVillages,
      allVillages: rawVillages,
      rawBanks,
      villages: filteredVillages.map((v) => v.name),
      banks: rawBanks.map((b) => b.name),
      locations,
      fleet,
      warehouses: locations.filter((l) => l.type === 'WAREHOUSE').map((l) => l.name),
    });
  } catch (error: any) {
    console.error('API Config GET Error:', error);
    return NextResponse.json(
      {
        serverTimestamp: new Date().toISOString(),
        configVersion: 'v1-fallback',
        settings: DEFAULT_SETTINGS,
        paddySpecs: [],
        rawVillages: [],
        allVillages: [],
        rawBanks: [],
        villages: ['Bra', 'Damnak Kantout', 'Dan', 'Dang Phlet', 'Kampenh', 'Sangkae'],
        banks: ['ABA Bank', 'ACLEDA Bank', 'Wing Bank', 'Canadia Bank', 'AMK Microfinance'],
        locations: [
          { id: 'wh_1', name: 'CACC (KPT)', type: 'WAREHOUSE' },
          { id: 'wh_2', name: 'Amru Rice (KPG)', type: 'WAREHOUSE' },
          { id: 'wh_3', name: 'Other', type: 'WAREHOUSE' },
        ],
        fleet: [],
        warehouses: ['CACC (KPT)', 'Amru Rice (KPG)', 'Other'],
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
