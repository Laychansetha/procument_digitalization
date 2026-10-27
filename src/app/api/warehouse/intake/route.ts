import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getWarehouseId } from '@/lib/warehouse-config';

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

import { processAndSaveImage } from '@/lib/image-upload-server';

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
      receivingStaffName,
      arrivedWarehouse,
    } = body;

    if (!transportId || warehouseGrossWeight === undefined || warehouseTareWeight === undefined || !arrivedWarehouse?.toString().trim()) {
      return NextResponse.json(
        { error: 'Transport ID, Gross Weight, Tare Weight, and Arrived Warehouse are required.' },
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

    // Process images (Base64 to /uploads/)
    const savedGrossPhoto = await processAndSaveImage(grossScalePhotoUrl, 'gross_scale');
    const savedTarePhoto = await processAndSaveImage(tareScalePhotoUrl, 'tare_scale');
    const savedInvoicePhoto = await processAndSaveImage(transportInvoiceUrl, 'invoice');

    const actualArrivedWarehouse = getWarehouseId(arrivedWarehouse.toString().trim());

    // Check if an intake record already exists for this transportId
    const existingIntake = await db.warehouseIntake.findUnique({
      where: { transportId },
    });

    let intake;
    if (existingIntake) {
      intake = await db.warehouseIntake.update({
        where: { id: existingIntake.id },
        data: {
          warehouseGrossWeight: Number(warehouseGrossWeight),
          warehouseTareWeight: Number(warehouseTareWeight),
          warehouseNetWeight: netWeight,
          weightDiffKg: diffKg,
          weightDiffPercent: diffPercent,
          grossScalePhotoUrl: savedGrossPhoto || existingIntake.grossScalePhotoUrl,
          tareScalePhotoUrl: savedTarePhoto || existingIntake.tareScalePhotoUrl,
          transportInvoiceUrl: savedInvoicePhoto || existingIntake.transportInvoiceUrl,
          receivingStaffId: userId,
          receivingStaffName: receivingStaffName?.trim() || session.user?.name || existingIntake.receivingStaffName || 'Warehouse Staff',
          arrivedWarehouse: actualArrivedWarehouse,
          notes: notes !== undefined ? notes : existingIntake.notes,
          status: 'RECEIVED',
          inventoryStatus: 'WAITING_FOR_INVENTORY',
        },
      });

      // Resolve any active rejection logs for this intake
      await db.rejectionLog.updateMany({
        where: {
          entityType: 'WarehouseIntake',
          entityId: existingIntake.id,
          status: 'REJECTED',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: session.user?.name || 'Warehouse Staff',
        },
      });
    } else {
      intake = await db.warehouseIntake.create({
        data: {
          transportId,
          warehouseGrossWeight: Number(warehouseGrossWeight),
          warehouseTareWeight: Number(warehouseTareWeight),
          warehouseNetWeight: netWeight,
          weightDiffKg: diffKg,
          weightDiffPercent: diffPercent,
          grossScalePhotoUrl: savedGrossPhoto || null,
          tareScalePhotoUrl: savedTarePhoto || null,
          transportInvoiceUrl: savedInvoicePhoto || null,
          receivingStaffId: userId,
          receivingStaffName: receivingStaffName?.trim() || session.user?.name || 'Warehouse Staff',
          arrivedWarehouse: actualArrivedWarehouse,
          notes: notes || null,
          status: 'RECEIVED',
          inventoryStatus: 'WAITING_FOR_INVENTORY',
        },
      });
    }

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
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Warehouse Staff',
      userRole,
      action: existingIntake ? 'UPDATE' : 'INTAKE',
      entityType: 'WarehouseIntake',
      entityId: intake.id,
      details: {
        transportId,
        warehouseNetWeight: netWeight,
        fieldWeight: transport.totalFieldWeight,
        diffKg,
        diffPercent,
      },
    });

    return NextResponse.json(intake, { status: existingIntake ? 200 : 201 });
  } catch (error) {
    console.error('Error saving warehouse intake:', error);
    return NextResponse.json({ error: 'Failed to record warehouse intake.' }, { status: 500 });
  }
}
