import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reconcile purchases with farmer profiles & transport warehouse intakes
    const purchases = await db.purchaseRecord.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const farmerProfiles = await db.farmerProfile.findMany();
    const transportRecs = await db.transportRecord.findMany({
      include: {
        lots: true,
        intake: true,
      },
    });

    // Match each purchase record with farmer profile & transport warehouse intake
    const reconciledData = purchases.map((purchase) => {
      const profile = farmerProfiles.find(
        (p) => p.familyCode.toUpperCase() === purchase.familyCode.toUpperCase()
      ) || null;

      // Find matching transport record by explicit transportRecordId or fallback to familyCode
      let matchedTransport = null;
      if (purchase.transportRecordId) {
        matchedTransport = transportRecs.find((t) => t.id === purchase.transportRecordId) || null;
      }
      if (!matchedTransport) {
        const matchedLot = transportRecs.flatMap((t) =>
          t.lots.map((lot) => ({ ...lot, transport: t }))
        ).find((lot) => lot.purchaseRecordId === purchase.id || lot.familyCode.toUpperCase() === purchase.familyCode.toUpperCase());
        if (matchedLot) matchedTransport = matchedLot.transport;
      }

      return {
        purchase,
        farmerProfile: profile,
        transport: matchedTransport,
        warehouseIntake: matchedTransport ? matchedTransport.intake : null,
      };
    });

    return NextResponse.json(reconciledData);
  } catch (error) {
    console.error('Error fetching finance reconciliation data:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || (userRole !== 'FINANCE' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Finance role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { purchaseId, status } = body; // PENDING, VERIFIED, DISBURSED, ON_HOLD

    if (!purchaseId || !status) {
      return NextResponse.json({ error: 'Purchase ID and status are required.' }, { status: 400 });
    }

    const updated = await db.purchaseRecord.update({
      where: { id: purchaseId },
      data: { status },
    });

    // Audit Log
    await logAudit({
      userId,
      userName: session.user?.name || 'Finance Officer',
      userRole: userRole as 'FINANCE' | 'ADMIN',
      action: 'DISBURSE',
      entityType: 'PurchaseRecord',
      entityId: purchaseId,
      details: { newStatus: status, familyCode: updated.familyCode, netPayment: updated.netPayment },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating disbursement status:', error);
    return NextResponse.json({ error: 'Failed to update disbursement status.' }, { status: 500 });
  }
}
