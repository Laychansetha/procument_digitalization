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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(intakes);
  } catch (error) {
    console.error('Error fetching inventory records:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory records' }, { status: 500 });
  }
}

import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || !userId || (userRole !== 'INVENTORY' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden. Only Inventory Staff or System Admin can confirm inventory records.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { intakeId, inventoryLocation, inventoryNotes } = body;

    if (!intakeId) {
      return NextResponse.json({ error: 'Warehouse Intake ID is required' }, { status: 400 });
    }

    const existingIntake = await db.warehouseIntake.findUnique({
      where: { id: intakeId },
      include: { transport: true },
    });

    if (!existingIntake) {
      return NextResponse.json({ error: 'Warehouse Intake record not found' }, { status: 404 });
    }

    // Verify valid user for database relations
    const validUser = await db.user.findFirst({
      where: { OR: [{ id: userId }, { email: session.user?.email || '' }] },
    });
    const effectiveUserId = validUser?.id || userId;

    // Update WarehouseIntake record into Inventory Recorded status
    const updatedIntake = await db.warehouseIntake.update({
      where: { id: intakeId },
      data: {
        status: 'RECEIVED',
        inventoryStatus: 'INVENTORY_RECORDED',
        inventoryStaffId: effectiveUserId,
        inventoryStaffName: session.user?.name || validUser?.name || 'Inventory Officer',
        inventoryConfirmedAt: new Date(),
        inventoryLocation: inventoryLocation || 'Main Warehouse Storage',
        inventoryNotes: inventoryNotes || null,
      },
      include: {
        transport: {
          include: {
            purchases: true,
          },
        },
      },
    });

    // Resolve all active rejection logs for this intake, linked transport, and purchases
    await db.rejectionLog.updateMany({
      where: {
        OR: [
          { entityType: 'WarehouseIntake', entityId: intakeId },
          { entityType: 'TransportRecord', entityId: existingIntake.transportId },
        ],
        status: 'REJECTED',
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByName: session.user?.name || session.user?.email || 'Inventory Staff',
      },
    });

    // Safely write Audit Log entry
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || validUser?.name || 'Inventory Staff',
      userRole,
      action: 'CONFIRM_INVENTORY',
      entityType: 'WarehouseIntake',
      entityId: intakeId,
      details: {
        warehouseId: `WR-2026-${intakeId.slice(-6).toUpperCase()}`,
        inventoryLocation: inventoryLocation || 'Main Warehouse Storage',
        netWeight: existingIntake.warehouseNetWeight,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Inventory recorded successfully for Warehouse Record WR-2026-${intakeId.slice(-6).toUpperCase()}`,
      intake: updatedIntake,
    });
  } catch (error: any) {
    console.error('Error confirming inventory record:', error);
    return NextResponse.json({ error: error.message || 'Failed to confirm inventory record' }, { status: 500 });
  }
}
