import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all transport records with intake & purchases
    const transportRecs = await db.transportRecord.findMany({
      include: {
        intake: true,
        purchases: {
          include: {
            items: true,
          },
        },
        lots: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const farmerProfiles = await db.farmerProfile.findMany();

    // Map each truck with farmer bank profiles & calculate truck-level finance metrics
    const trucksData = transportRecs.map((t) => {
      const purchasesWithProfiles = t.purchases.map((purchase) => {
        const pFamilyNorm = purchase.familyCode.toUpperCase().trim();
        const pVillageNorm = (purchase.village || '').toLowerCase().trim();

        // Match by composite (Family Code + Village) first, fallback to Family Code
        const profile =
          farmerProfiles.find(
            (f) =>
              f.familyCode.toUpperCase().trim() === pFamilyNorm &&
              (f.village || '').toLowerCase().trim() === pVillageNorm
          ) ||
          farmerProfiles.find(
            (f) => f.familyCode.toUpperCase().trim() === pFamilyNorm
          ) ||
          null;

        return {
          ...purchase,
          farmerProfile: profile,
        };
      });

      // Composite farmer identity (Family Code + Village)
      const totalFarmersCount = new Set(
        t.purchases.map((p) => `${p.familyCode.toUpperCase().trim()}___${(p.village || '').toLowerCase().trim()}`)
      ).size;
      const totalTruckNetPayment = t.purchases.reduce((sum, p) => sum + p.netPayment, 0);
      const totalTruckGrossPayment = t.purchases.reduce((sum, p) => sum + p.totalPayment, 0);

      const fieldWeight = t.totalFieldWeight || 0;
      const netWeight = t.intake?.warehouseNetWeight || 0;
      const diffKg = t.intake ? netWeight - fieldWeight : 0;
      const diffPercent = fieldWeight > 0 ? (diffKg / fieldWeight) * 100 : 0;

      return {
        transport: t,
        intake: t.intake,
        purchases: purchasesWithProfiles,
        totalFarmersCount,
        totalTruckNetPayment,
        totalTruckGrossPayment,
        fieldWeight,
        warehouseNetWeight: netWeight,
        weightDiffKg: diffKg,
        weightDiffPercent: diffPercent,
      };
    });

    return NextResponse.json(trucksData);
  } catch (error) {
    console.error('Error fetching finance trucks data:', error);
    return NextResponse.json({ error: 'Failed to fetch finance trucks data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || !userId || (userRole !== 'FINANCE' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Finance or Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, transportId, paymentMethod, paymentBatchNumber } = body;

    if (!transportId || !action) {
      return NextResponse.json({ error: 'Transport ID and action are required.' }, { status: 400 });
    }

    const transport = await db.transportRecord.findUnique({
      where: { id: transportId },
      include: { purchases: true, intake: true },
    });

    if (!transport) {
      return NextResponse.json({ error: 'Transport record not found.' }, { status: 404 });
    }

    // 4. TRUCK-LEVEL VERIFICATION
    if (action === 'VERIFY_TRUCK') {
      if (!transport.intake) {
        return NextResponse.json(
          { error: 'Cannot verify. Warehouse receiving must be completed first.' },
          { status: 400 }
        );
      }

      if (transport.intake.inventoryStatus !== 'INVENTORY_RECORDED') {
        return NextResponse.json(
          { error: 'Cannot verify. Paddy must be recorded into the inventory system by the Inventory Team before Finance verification.' },
          { status: 400 }
        );
      }

      await db.transportRecord.update({
        where: { id: transportId },
        data: { status: 'VERIFIED' },
      });

      await db.purchaseRecord.updateMany({
        where: { transportRecordId: transportId },
        data: { status: 'VERIFIED' },
      });

      if (transport.intake) {
        await db.warehouseIntake.update({
          where: { id: transport.intake.id },
          data: { status: 'RECEIVED' },
        });
      }

      // Resolve all rejection logs for this transport and intake
      await db.rejectionLog.updateMany({
        where: {
          OR: [
            { entityType: 'TransportRecord', entityId: transportId },
            ...(transport.intake ? [{ entityType: 'WarehouseIntake', entityId: transport.intake.id }] : []),
          ],
          status: 'REJECTED',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: session.user?.name || 'Finance Officer',
        },
      });

      await logAudit({
        userId,
        userEmail: session.user?.email,
        userName: session.user?.name || 'Finance Officer',
        userRole,
        action: 'VERIFY',
        entityType: 'TransportRecord',
        entityId: transportId,
        details: { plateNumber: transport.plateNumber, status: 'VERIFIED' },
      });

      return NextResponse.json({ success: true, status: 'VERIFIED' });
    }

    // 5. PAYMENT PROCESSING (COMPLETE PAYMENT)
    if (action === 'COMPLETE_PAYMENT') {
      const { paymentReceiptUrl } = body;
      const userName = session.user?.name || session.user?.email || 'Finance Officer';

      await db.transportRecord.update({
        where: { id: transportId },
        data: {
          status: 'DISBURSED',
          paymentReceiptUrl: paymentReceiptUrl || null,
          paymentMethod: paymentMethod || 'ABA Bulk Transfer',
          paymentBatchNumber: paymentBatchNumber || null,
          paidAt: new Date(),
          paidByStaffName: userName,
        },
      });

      await db.purchaseRecord.updateMany({
        where: { transportRecordId: transportId },
        data: { status: 'DISBURSED' },
      });

      // Resolve all rejection logs for this transport and intake
      await db.rejectionLog.updateMany({
        where: {
          OR: [
            { entityType: 'TransportRecord', entityId: transportId },
            ...(transport.intake ? [{ entityType: 'WarehouseIntake', entityId: transport.intake.id }] : []),
          ],
          status: 'REJECTED',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedByName: userName,
        },
      });

      await logAudit({
        userId,
        userEmail: session.user?.email,
        userName,
        userRole,
        action: 'DISBURSE',
        entityType: 'TransportRecord',
        entityId: transportId,
        details: {
          plateNumber: transport.plateNumber,
          paymentMethod: paymentMethod || 'ABA Bulk Transfer',
          paymentBatchNumber: paymentBatchNumber || 'BATCH-2026',
          paymentReceiptUrl: paymentReceiptUrl || null,
          status: 'DISBURSED',
        },
      });

      return NextResponse.json({ success: true, status: 'DISBURSED' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Error processing finance truck action:', error);
    return NextResponse.json({ error: 'Failed to process finance action.' }, { status: 500 });
  }
}
