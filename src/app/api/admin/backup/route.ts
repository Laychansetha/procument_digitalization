import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { normalizeProvinceName } from '@/lib/province-guard';

// GET /api/admin/backup — Export full database backup as JSON file
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const rawUsers = await db.user.findMany();
    const safeUsers = rawUsers.map(({ password: _password, ...rest }) => rest);

    const masterData = {
      users: safeUsers,
      villages: await db.village.findMany(),
      banks: await db.bank.findMany(),
      locations: await db.locationRegistry.findMany(),
      priceSpecs: await db.paddyPriceSpec.findMany(),
      systemSettings: await db.systemSetting.findMany(),
    };

    const transactionData = {
      farmers: await db.farmerProfile.findMany(),
      specs: await db.specsRecord.findMany(),
      purchases: await db.purchaseRecord.findMany({ include: { items: true } }),
      transports: await db.transportRecord.findMany({ include: { lots: true } }),
      intakes: await db.warehouseIntake.findMany(),
      rejections: await db.rejectionLog.findMany(),
      auditLogs: await db.auditLog.findMany(),
    };

    const backupPayload = {
      system: 'IBIS_RICE_PAYMENT_SYSTEM',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.user?.name || session.user?.email || 'Admin',
      counts: {
        users: masterData.users.length,
        villages: masterData.villages.length,
        banks: masterData.banks.length,
        locations: masterData.locations.length,
        priceSpecs: masterData.priceSpecs.length,
        farmers: transactionData.farmers.length,
        specs: transactionData.specs.length,
        purchases: transactionData.purchases.length,
        transports: transactionData.transports.length,
        intakes: transactionData.intakes.length,
        rejections: transactionData.rejections.length,
      },
      masterData,
      transactionData,
    };

    const fileName = `IBIS_Rice_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting database backup:', error);
    return NextResponse.json({ error: 'Failed to export database backup.' }, { status: 500 });
  }
}

// POST /api/admin/backup — Restore database from backup JSON file payload
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = (session?.user as { id?: string })?.id;
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || !adminId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const payload = await request.json();

    if (!payload || payload.system !== 'IBIS_RICE_PAYMENT_SYSTEM') {
      return NextResponse.json(
        { error: 'Invalid backup file format. File must be an official IBIS Rice JSON backup.' },
        { status: 400 }
      );
    }

    const { masterData } = payload;

    // Restore Master Data (Upserting to prevent primary key conflicts)
    if (masterData) {
      if (Array.isArray(masterData.villages)) {
        for (const v of masterData.villages) {
          const normProv = v.province ? normalizeProvinceName(v.province) : 'Preah Vihear';
          await db.village.upsert({
            where: { name: v.name },
            update: { province: normProv, district: v.district, code: v.code, status: v.status || 'ACTIVE' },
            create: { name: v.name, province: normProv, district: v.district, code: v.code, status: v.status || 'ACTIVE' },
          });
        }
      }

      if (Array.isArray(masterData.banks)) {
        for (const b of masterData.banks) {
          await db.bank.upsert({
            where: { name: b.name },
            update: { code: b.code, status: b.status || 'ACTIVE' },
            create: { name: b.name, code: b.code, status: b.status || 'ACTIVE' },
          });
        }
      }

      if (Array.isArray(masterData.locations)) {
        for (const l of masterData.locations) {
          await db.locationRegistry.upsert({
            where: { name: l.name },
            update: { type: l.type, code: l.code, address: l.address, status: l.status || 'ACTIVE' },
            create: { name: l.name, type: l.type, code: l.code, address: l.address, status: l.status || 'ACTIVE' },
          });
        }
      }

      if (Array.isArray(masterData.priceSpecs)) {
        for (const s of masterData.priceSpecs) {
          await db.paddyPriceSpec.upsert({
            where: { variety_grade: { variety: s.variety, grade: s.grade } },
            update: {
              basePrice: s.basePrice,
              maxMoisture: s.maxMoisture,
              maxForeignMatter: s.maxForeignMatter,
              minWholeGrain: s.minWholeGrain ?? null,
              maxBrokenRice: s.maxBrokenRice ?? null,
              impurity: s.impurity ?? null,
              moistureRange: s.moistureRange ?? null,
              status: s.status || 'ACTIVE',
            },
            create: {
              variety: s.variety,
              grade: s.grade,
              basePrice: s.basePrice,
              maxMoisture: s.maxMoisture,
              maxForeignMatter: s.maxForeignMatter,
              minWholeGrain: s.minWholeGrain ?? null,
              maxBrokenRice: s.maxBrokenRice ?? null,
              impurity: s.impurity ?? null,
              moistureRange: s.moistureRange ?? null,
              status: s.status || 'ACTIVE',
            },
          });
        }
      }

      if (Array.isArray(masterData.systemSettings)) {
        for (const st of masterData.systemSettings) {
          await db.systemSetting.upsert({
            where: { key: st.key },
            update: { value: st.value },
            create: { key: st.key, value: st.value },
          });
        }
      }
    }

    // Record Audit Log for restore
    await logAudit({
      userId: adminId,
      userName: session.user?.name || session.user?.email || 'Admin',
      userRole: 'ADMIN',
      action: 'CONFIG',
      entityType: 'SystemSetting',
      entityId: 'DATABASE_RESTORE',
      details: {
        action: 'RESTORE_DATABASE',
        backupExportedAt: payload.exportedAt,
        counts: payload.counts,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database backup imported and restored successfully!',
      counts: payload.counts,
    });
  } catch (error) {
    console.error('Error importing database backup:', error);
    return NextResponse.json({ error: 'Failed to import and restore database backup.' }, { status: 500 });
  }
}
