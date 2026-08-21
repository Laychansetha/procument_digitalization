import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { processAndSaveImage } from '@/lib/image-upload-server';
import { logAudit } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || !userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.transportRecord.findUnique({
      where: { id },
      include: {
        intake: true,
        purchases: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transport record not found.' }, { status: 404 });
    }

    // LOCKING RULE: Field Team can ONLY edit transport record if status is REJECTED or if EN_ROUTE before warehouse receiving
    if (existing.status !== 'REJECTED' && (existing.intake || existing.status !== 'EN_ROUTE')) {
      return NextResponse.json(
        { error: 'This transport record has already been received by the warehouse and can no longer be edited.' },
        { status: 400 }
      );
    }

    const {
      driverName,
      plateNumber,
      mobileNumber,
      loadingLocation,
      destinationWarehouse,
      notes,
      truckCleaned,
      truckPhotoUrl,
      driverSignature,
      selectedPurchaseIds,
    } = body;

    if (!driverName || !plateNumber) {
      return NextResponse.json({ error: 'Driver name and plate number are required.' }, { status: 400 });
    }

    if (!selectedPurchaseIds || !Array.isArray(selectedPurchaseIds) || selectedPurchaseIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one purchase record to assign to this truck.' }, { status: 400 });
    }

    // Fetch details of selected purchase records
    const purchasesToAssign = await db.purchaseRecord.findMany({
      where: {
        id: { in: selectedPurchaseIds },
      },
      include: {
        items: true,
      },
    });

    if (purchasesToAssign.length === 0) {
      return NextResponse.json({ error: 'Selected purchase records were not found.' }, { status: 404 });
    }

    // Calculate totals
    const totalSacks = purchasesToAssign.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
    const totalFieldWeight = purchasesToAssign.reduce((sum, p) => sum + p.totalWeight, 0);

    const savedTruckPhoto = truckPhotoUrl !== undefined ? await processAndSaveImage(truckPhotoUrl, 'truck_loading') : existing.truckPhotoUrl;

    // 1. Unlink purchases that were removed from this truck
    await db.purchaseRecord.updateMany({
      where: {
        transportRecordId: id,
        id: { notIn: selectedPurchaseIds },
      },
      data: {
        transportRecordId: null,
        status: 'PENDING',
      },
    });

    // 2. Link newly assigned purchases and mark as IN_TRANSIT
    await db.purchaseRecord.updateMany({
      where: {
        id: { in: selectedPurchaseIds },
      },
      data: {
        transportRecordId: id,
        status: 'IN_TRANSIT',
      },
    });

    // 3. Clear and recreate TransportLots
    await db.transportLot.deleteMany({
      where: { transportId: id },
    });

    const updated = await db.transportRecord.update({
      where: { id },
      data: {
        driverName,
        plateNumber,
        mobileNumber: mobileNumber !== undefined ? mobileNumber : existing.mobileNumber,
        truckCleaned: truckCleaned !== undefined ? Boolean(truckCleaned) : existing.truckCleaned,
        truckPhotoUrl: savedTruckPhoto !== undefined ? savedTruckPhoto : existing.truckPhotoUrl,
        driverSignature: driverSignature !== undefined ? driverSignature : existing.driverSignature,
        loadingLocation: loadingLocation || existing.loadingLocation,
        destinationWarehouse: destinationWarehouse || existing.destinationWarehouse,
        notes: notes !== undefined ? notes : existing.notes,
        totalSacks,
        totalFieldWeight,
        status: 'EN_ROUTE',
        lots: {
          create: purchasesToAssign.map((p) => ({
            variety: p.items?.[0]?.variety || 'Red Jasmine',
            familyCode: p.familyCode,
            farmerName: p.farmerName,
            village: p.village,
            sacks: p.items?.[0]?.sacks || 0,
            weight: p.totalWeight,
            purchaseRecordId: p.id,
          })),
        },
      },
      include: {
        purchases: {
          include: {
            items: true,
          },
        },
        lots: true,
        intake: true,
      },
    });

    // If an existing WarehouseIntake existed, update it with new field weights and reset inventory status so it seamlessly continues to Warehouse and Inventory
    if (existing.intake) {
      const netWeight = existing.intake.warehouseNetWeight || 0;
      const diffKg = Number((netWeight - totalFieldWeight).toFixed(2));
      const diffPercent = totalFieldWeight > 0 ? Number(((diffKg / totalFieldWeight) * 100).toFixed(2)) : 0;

      await db.warehouseIntake.update({
        where: { id: existing.intake.id },
        data: {
          status: 'RECEIVED',
          inventoryStatus: 'WAITING_FOR_INVENTORY',
          weightDiffKg: diffKg,
          weightDiffPercent: diffPercent,
        },
      });
    }

    // Resolve any active rejection logs for this transport record or intake
    await db.rejectionLog.updateMany({
      where: {
        OR: [
          { entityType: 'TransportRecord', entityId: id },
          { entityType: 'WarehouseIntake', entityId: existing.intake?.id },
        ],
        status: 'REJECTED',
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByName: session.user?.name || session.user?.email || 'Field Staff',
      },
    });

    // Audit Log
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Field Staff',
      userRole,
      action: 'UPDATE',
      entityType: 'TransportRecord',
      entityId: id,
      details: {
        driverName,
        plateNumber,
        totalSacks,
        totalFieldWeight,
        purchaseCount: purchasesToAssign.length,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating transport record:', error);
    return NextResponse.json({ error: 'Failed to update transport record.' }, { status: 500 });
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
        { error: 'Unauthorized. Admin role required to delete transport records.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.transportRecord.findUnique({
      where: { id },
      include: { purchases: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transport record not found.' }, { status: 404 });
    }

    // Unlink purchases back to unassigned PENDING status
    await db.purchaseRecord.updateMany({
      where: { transportRecordId: id },
      data: { transportRecordId: null, status: 'PENDING' },
    });

    // Delete transport record
    await db.transportRecord.delete({
      where: { id },
    });

    // Audit Log
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Admin',
      userRole: 'ADMIN',
      action: 'DELETE',
      entityType: 'TransportRecord',
      entityId: id,
      details: {
        driverName: existing.driverName,
        plateNumber: existing.plateNumber,
        purchasesUnlinkedCount: existing.purchases.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transport record:', error);
    return NextResponse.json({ error: 'Failed to delete transport record.' }, { status: 500 });
  }
}
