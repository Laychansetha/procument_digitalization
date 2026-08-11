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

    // Update WarehouseIntake record into Inventory Recorded status
    const updatedIntake = await db.warehouseIntake.update({
      where: { id: intakeId },
      data: {
        inventoryStatus: 'INVENTORY_RECORDED',
        inventoryStaffId: userId,
        inventoryStaffName: session.user?.name || 'Inventory Officer',
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

    // Resolve active rejection log if record was returned by Finance for correction
    const activeRejection = await db.rejectionLog.findFirst({
      where: { entityType: 'WarehouseIntake', entityId: intakeId, status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    });

    if (activeRejection) {
      await db.rejectionLog.update({
        where: { id: activeRejection.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: session.user?.name || session.user?.email || 'Inventory Staff',
        },
      });
    }

    // Create Audit Log entry
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Inventory Staff',
        userRole: userRole as any,
        action: 'CONFIRM_INVENTORY',
        entityType: 'WarehouseIntake',
        entityId: intakeId,
        details: JSON.stringify({
          warehouseId: `WR-2026-${intakeId.slice(-6).toUpperCase()}`,
          inventoryLocation: inventoryLocation || 'Main Warehouse Storage',
          netWeight: existingIntake.warehouseNetWeight,
        }),
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
