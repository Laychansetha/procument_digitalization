import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const intakes = await db.warehouseIntake.findMany({
      include: {
        transport: {
          include: {
            purchases: {
              include: {
                items: true,
              },
            },
            lots: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(intakes);
  } catch (error) {
    console.error('Error fetching warehouse intake records:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse intake records.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Warehouse or Admin only
    if (userRole !== 'WAREHOUSE' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Warehouse Staff or Admin can record intake.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      transportId,
      warehouseGrossWeight,
      warehouseTareWeight,
      grossScalePhotoUrl,
      tareScalePhotoUrl,
      transportInvoiceUrl,
      notes,
    } = body;

    if (!transportId || warehouseGrossWeight === undefined || warehouseTareWeight === undefined) {
      return NextResponse.json(
        { error: 'Transport ID, Gross Weight, and Tare Weight are required.' },
        { status: 400 }
      );
    }

    // Check transport record
    const transport = await db.transportRecord.findUnique({
      where: { id: transportId },
      include: {
        purchases: true,
      },
    });

    if (!transport) {
      return NextResponse.json({ error: 'Transport record not found.' }, { status: 404 });
    }

    const netWeight = Number((warehouseGrossWeight - warehouseTareWeight).toFixed(2));
    const diffKg = Number((netWeight - transport.totalFieldWeight).toFixed(2));
    const diffPercent = transport.totalFieldWeight > 0
      ? Number(((diffKg / transport.totalFieldWeight) * 100).toFixed(2))
      : 0;

    // Create Warehouse Intake record
    const intake = await db.warehouseIntake.create({
      data: {
        transportId,
        warehouseGrossWeight: Number(warehouseGrossWeight),
        warehouseTareWeight: Number(warehouseTareWeight),
        warehouseNetWeight: netWeight,
        weightDiffKg: diffKg,
        weightDiffPercent: diffPercent,
        grossScalePhotoUrl: grossScalePhotoUrl || null,
        tareScalePhotoUrl: tareScalePhotoUrl || null,
        transportInvoiceUrl: transportInvoiceUrl || null,
        receivingStaffId: userId,
        receivingStaffName: session.user?.name || 'Warehouse Staff',
        notes: notes || null,
        status: 'RECEIVED',
      },
    });

    // 5. UPDATE TRUCK STATUS TO "RECEIVED"
    await db.transportRecord.update({
      where: { id: transportId },
      data: { status: 'RECEIVED' },
    });

    // 5. MARK ALL LINKED PURCHASE RECORDS AS "RECEIVED" AT WAREHOUSE
    await db.purchaseRecord.updateMany({
      where: { transportRecordId: transportId },
      data: { status: 'RECEIVED' },
    });

    // Security Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Warehouse Staff',
        userRole: userRole as any,
        action: 'INTAKE',
        entityType: 'WarehouseIntake',
        entityId: intake.id,
        details: JSON.stringify({
          transportId,
          warehouseNetWeight: netWeight,
          fieldWeight: transport.totalFieldWeight,
          diffKg,
          diffPercent,
        }),
      },
    });

    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    console.error('Error saving warehouse intake:', error);
    return NextResponse.json({ error: 'Failed to record warehouse intake.' }, { status: 500 });
  }
}
