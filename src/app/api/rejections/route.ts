import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await db.rejectionLog.findMany({
      where,
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

    // Verify valid user for foreign key constraint
    const validUser = await db.user.findFirst({
      where: { OR: [{ id: userId }, { email: session.user.email || '' }] },
    });
    const fallbackUser = await db.user.findFirst({ where: { role: 'ADMIN' } }) || await db.user.findFirst();
    const effectiveUserId = validUser?.id || fallbackUser?.id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'No user account found in database.' }, { status: 400 });
    }

    // 1. Create Rejection Log
    const rejectionLog = await db.rejectionLog.create({
      data: {
        entityType,
        entityId,
        targetModule,
        rejectedBy: effectiveUserId,
        rejectedByName: session.user.name || validUser?.name || 'System User',
        rejectedByRole: (validUser?.role as any) || userRole,
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
        } else {
          // Check if intake exists with transportId
          const matchingIntake = await db.warehouseIntake.findUnique({ where: { transportId: entityId } });
          if (matchingIntake) {
            await db.warehouseIntake.update({
              where: { id: matchingIntake.id },
              data: { inventoryStatus: 'REJECTED' },
            });
          }
        }
        await db.transportRecord.update({
          where: { id: entityId },
          data: { status: 'RECEIVED' },
        });
      } else if (targetModule === 'WAREHOUSE') {
        if (tr?.intake) {
          await db.warehouseIntake.update({
            where: { id: tr.intake.id },
            data: { status: 'REJECTED', inventoryStatus: 'REJECTED' },
          });
        }
        await db.transportRecord.update({
          where: { id: entityId },
          data: { status: 'RECEIVED' },
        });
      } else {
        // targetModule === 'FIELD'
        if (tr?.intake) {
          await db.warehouseIntake.update({
            where: { id: tr.intake.id },
            data: { status: 'REJECTED', inventoryStatus: 'REJECTED' },
          });
        }
        await db.transportRecord.update({
          where: { id: entityId },
          data: { status: 'REJECTED' },
        });
        await db.purchaseRecord.updateMany({
          where: { transportRecordId: entityId },
          data: { status: 'REJECTED' },
        });
      }
    } else if (entityType === 'WarehouseIntake') {
      let intake = await db.warehouseIntake.findUnique({ where: { id: entityId } });
      if (!intake) {
        intake = await db.warehouseIntake.findUnique({ where: { transportId: entityId } });
      }

      if (intake) {
        if (targetModule === 'INVENTORY') {
          await db.warehouseIntake.update({
            where: { id: intake.id },
            data: { inventoryStatus: 'REJECTED' },
          });
          if (intake.transportId) {
            await db.transportRecord.update({
              where: { id: intake.transportId },
              data: { status: 'RECEIVED' },
            });
          }
        } else if (targetModule === 'WAREHOUSE') {
          await db.warehouseIntake.update({
            where: { id: intake.id },
            data: {
              status: 'REJECTED',
              inventoryStatus: 'REJECTED',
            },
          });
          if (intake.transportId) {
            await db.transportRecord.update({
              where: { id: intake.transportId },
              data: { status: 'RECEIVED' },
            });
          }
        } else if (targetModule === 'FIELD') {
          await db.warehouseIntake.update({
            where: { id: intake.id },
            data: {
              status: 'REJECTED',
              inventoryStatus: 'REJECTED',
            },
          });
          if (intake.transportId) {
            await db.transportRecord.update({
              where: { id: intake.transportId },
              data: { status: 'REJECTED' },
            });
            await db.purchaseRecord.updateMany({
              where: { transportRecordId: intake.transportId },
              data: { status: 'REJECTED' },
            });
          }
        }
      }
    } else if (entityType === 'PurchaseRecord') {
      await db.purchaseRecord.update({
        where: { id: entityId },
        data: { status: 'REJECTED' },
      });
    }

    // 3. Create Audit Log Entry
    await logAudit({
      userId,
      userEmail: session.user.email,
      userName,
      userRole,
      action: 'REJECT',
      entityType,
      entityId,
      details: { targetModule, reason: reason.trim() },
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
