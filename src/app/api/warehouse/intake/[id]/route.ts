import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getWarehouseId } from '@/lib/warehouse-config';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.warehouseIntake.findUnique({
      where: { id },
      include: { transport: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse receiving record not found.' }, { status: 404 });
    }

    // Locking Rule: Cannot edit if Finance team has already verified or paid
    if (existing.transport && (existing.transport.status === 'VERIFIED' || existing.transport.status === 'DISBURSED')) {
      return NextResponse.json(
        { error: 'This record has already been verified by Finance and can no longer be edited.' },
        { status: 400 }
      );
    }

    const grossWeight = parseFloat(body.warehouseGrossWeight) || 0;
    const tareWeight = parseFloat(body.warehouseTareWeight) || 0;
    const grossScalePhotoUrl = body.grossScalePhotoUrl ?? existing.grossScalePhotoUrl;
    const tareScalePhotoUrl = body.tareScalePhotoUrl ?? existing.tareScalePhotoUrl;
    const transportInvoiceUrl = body.transportInvoiceUrl ?? existing.transportInvoiceUrl;
    const receivingStaffName = body.receivingStaffName ? String(body.receivingStaffName).trim() : undefined;
    const arrivedWarehouse = body.arrivedWarehouse ? getWarehouseId(body.arrivedWarehouse) : undefined;

    const netWeight = Math.max(0, grossWeight - tareWeight);
    const fieldWeight = existing.transport?.totalFieldWeight || 0;
    const weightDiffKg = netWeight - fieldWeight;
    const weightDiffPercent = fieldWeight > 0 ? (weightDiffKg / fieldWeight) * 100 : 0;

    const updated = await db.warehouseIntake.update({
      where: { id },
      data: {
        warehouseGrossWeight: grossWeight,
        warehouseTareWeight: tareWeight,
        warehouseNetWeight: netWeight,
        weightDiffKg,
        weightDiffPercent,
        grossScalePhotoUrl,
        tareScalePhotoUrl,
        transportInvoiceUrl,
        ...(receivingStaffName ? { receivingStaffName } : {}),
        ...(arrivedWarehouse ? { arrivedWarehouse } : {}),
        status: 'RECEIVED',
        inventoryStatus: 'WAITING_FOR_INVENTORY',
      },
      include: { transport: true },
    });

    // Mark active rejection log as RESOLVED when Warehouse resubmits corrected intake
    const activeRejection = await db.rejectionLog.findFirst({
      where: { entityType: 'WarehouseIntake', entityId: id, status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    });

    if (activeRejection) {
      await db.rejectionLog.update({
        where: { id: activeRejection.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: session.user?.name || session.user?.email || 'Warehouse Staff',
        },
      });
    }

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Warehouse Staff',
        userRole: ((session.user as { role?: string })?.role as any) || 'WAREHOUSE',
        action: 'UPDATE',
        entityType: 'WarehouseIntake',
        entityId: id,
        details: JSON.stringify({
          transportId: existing.transportId,
          grossWeight,
          tareWeight,
          netWeight,
          weightDiffKg,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating warehouse receiving record:', error);
    return NextResponse.json({ error: 'Failed to update warehouse receiving record.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin role required to delete warehouse intake records.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.warehouseIntake.findUnique({
      where: { id },
      include: { transport: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse intake record not found.' }, { status: 404 });
    }

    // Revert transport record status to EN_ROUTE
    if (existing.transportId) {
      await db.transportRecord.update({
        where: { id: existing.transportId },
        data: { status: 'EN_ROUTE' },
      });

      await db.purchaseRecord.updateMany({
        where: { transportRecordId: existing.transportId },
        data: { status: 'IN_TRANSIT' },
      });
    }

    // Delete warehouse intake record
    await db.warehouseIntake.delete({
      where: { id },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'DELETE',
        entityType: 'WarehouseIntake',
        entityId: id,
        details: JSON.stringify({
          transportId: existing.transportId,
          netWeight: existing.warehouseNetWeight,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting warehouse intake record:', error);
    return NextResponse.json({ error: 'Failed to delete warehouse intake record.' }, { status: 500 });
  }
}
