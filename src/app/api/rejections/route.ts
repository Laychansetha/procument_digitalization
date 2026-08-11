import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required.' }, { status: 400 });
    }

    const logs = await db.rejectionLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching rejection logs:', error);
    return NextResponse.json({ error: 'Failed to fetch rejection logs.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entityType, entityId, targetModule, reason } = body;

    if (!entityType || !entityId || !targetModule || !reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'entityType, entityId, targetModule, and a non-empty rejection reason are required.' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const userName = session.user.name || session.user.email || 'System User';
    const userRole = (session.user as any).role || 'WAREHOUSE';

    // 1. Create Rejection Log
    const rejectionLog = await db.rejectionLog.create({
      data: {
        entityType,
        entityId,
        targetModule,
        rejectedBy: userId,
        rejectedByName: userName,
        rejectedByRole: userRole,
        reason: reason.trim(),
        status: 'REJECTED',
      },
    });

    // 2. Update Target Entity Status based on strict linear approval chain
    if (entityType === 'TransportRecord') {
      const tr = await db.transportRecord.findUnique({
        where: { id: entityId },
        include: { intake: true },
      });

      if (targetModule === 'INVENTORY') {
        if (tr?.intake) {
          await db.warehouseIntake.update({
            where: { id: tr.intake.id },
            data: { inventoryStatus: 'REJECTED' },
          });
        }
        await db.transportRecord.update({
          where: { id: entityId },
          data: { status: 'RECEIVED' },
        });
      } else {
        await db.transportRecord.update({
          where: { id: entityId },
          data: { status: 'REJECTED' },
        });
      }
    } else if (entityType === 'WarehouseIntake') {
      const intake = await db.warehouseIntake.findUnique({ where: { id: entityId } });

      if (targetModule === 'INVENTORY') {
        await db.warehouseIntake.update({
          where: { id: entityId },
          data: { inventoryStatus: 'REJECTED' },
        });
        if (intake?.transportId) {
          await db.transportRecord.update({
            where: { id: intake.transportId },
            data: { status: 'RECEIVED' },
          });
        }
      } else if (targetModule === 'WAREHOUSE') {
        await db.warehouseIntake.update({
          where: { id: entityId },
          data: {
            status: 'REJECTED',
            inventoryStatus: 'REJECTED',
          },
        });
        if (intake?.transportId) {
          await db.transportRecord.update({
            where: { id: intake.transportId },
            data: { status: 'RECEIVED' },
          });
        }
      } else if (targetModule === 'FIELD') {
        await db.warehouseIntake.update({
          where: { id: entityId },
          data: {
            status: 'REJECTED',
            inventoryStatus: 'REJECTED',
          },
        });
        if (intake?.transportId) {
          await db.transportRecord.update({
            where: { id: intake.transportId },
            data: { status: 'REJECTED' },
          });
        }
      }
    } else if (entityType === 'PurchaseRecord') {
      await db.purchaseRecord.update({
        where: { id: entityId },
        data: { status: 'REJECTED' },
      });
    }

    // 3. Create Audit Log Entry
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action: 'REJECT',
        entityType,
        entityId,
        details: JSON.stringify({ targetModule, reason: reason.trim() }),
      },
    });

    return NextResponse.json({ success: true, rejectionLog });
  } catch (error: any) {
    console.error('Error creating rejection log:', error);
    return NextResponse.json({ error: 'Failed to process rejection.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required.' }, { status: 400 });
    }

    const userName = session.user.name || session.user.email || 'System User';

    // Find active REJECTED log and mark as RESOLVED
    const activeRejection = await db.rejectionLog.findFirst({
      where: { entityType, entityId, status: 'REJECTED' },
      orderBy: { createdAt: 'desc' },
    });

    if (activeRejection) {
      await db.rejectionLog.update({
        where: { id: activeRejection.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: userName,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resolving rejection log:', error);
    return NextResponse.json({ error: 'Failed to resolve rejection.' }, { status: 500 });
  }
}
