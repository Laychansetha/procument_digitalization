import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { isVillageAuthorized } from '@/lib/province-guard';
import { processAndSaveImage } from '@/lib/image-upload-server';
import { logAudit } from '@/lib/audit';

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

    const existing = await db.purchaseRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Purchase record not found.' }, { status: 404 });
    }

    if (session.user && !(await isVillageAuthorized(existing.village, session.user as any))) {
      return NextResponse.json({ error: `Unauthorized. Record belongs to village '${existing.village}' which is outside your assigned province.` }, { status: 403 });
    }

    if (body.village && session.user && !(await isVillageAuthorized(body.village, session.user as any))) {
      return NextResponse.json({ error: `Unauthorized. Target village '${body.village}' is outside your assigned province.` }, { status: 403 });
    }

    // Locking check: Allow editing if status is PENDING, DRAFT, REJECTED OR if assigned to a transport record whose status is REJECTED
    let isLocked = false;
    if (existing.transportRecordId) {
      const linkedTransport = await db.transportRecord.findUnique({
        where: { id: existing.transportRecordId },
      });
      if (linkedTransport && linkedTransport.status !== 'REJECTED') {
        isLocked = true;
      }
    } else if (existing.status !== 'PENDING' && existing.status !== 'REJECTED' && existing.status !== 'DRAFT') {
      isLocked = true;
    }

    if (isLocked) {
      return NextResponse.json(
        { error: 'Cannot edit purchase record. This record has already been assigned to an active transport dispatch or received by warehouse.' },
        { status: 400 }
      );
    }

    const {
      familyCode,
      farmerName,
      village,
      seedBorrowed,
      seedDeduction,
      signatureFarmer,
      signatureStaff,
      specsRecordId,
      items,
    } = body;

    const item = items?.[0] || {};
    const sacksCount = item.sacks || 0;
    const totalWeightKg = item.quantity || 0;
    const stdPrice = parseFloat(item.standardPrice) || (existing.items?.[0]?.standardPrice || 0);
    const addPrice = parseFloat(item.additionalPrice) || 0;
    const finPrice = stdPrice + addPrice;
    const totalPaddyValue = item.totalValue || (totalWeightKg * finPrice);

    const sBorrowed = parseFloat(seedBorrowed) || 0;
    const sRepayment = sBorrowed * 1.1; // 10% seed interest
    const calculatedSeedDeduction = sRepayment * finPrice;
    const seedDeductionVal = seedDeduction !== undefined && !isNaN(parseFloat(seedDeduction)) ? parseFloat(seedDeduction) : calculatedSeedDeduction;
    const netPaymentToFarmer = Math.max(0, totalPaddyValue - seedDeductionVal);

    const savedFarmerSig = signatureFarmer ? await processAndSaveImage(signatureFarmer, 'sig_farmer') : null;
    const savedStaffSig = signatureStaff ? await processAndSaveImage(signatureStaff, 'sig_staff') : null;

    // Update Purchase Record (if previously REJECTED, reset to PENDING so it can be dispatched again)
    const nextStatus = existing.status === 'REJECTED' ? 'PENDING' : existing.status;

    const updatedRecord = await db.purchaseRecord.update({
      where: { id },
      data: {
        familyCode: (familyCode || existing.familyCode).toUpperCase().trim(),
        farmerName: (farmerName || existing.farmerName).trim(),
        village: village || existing.village,
        totalWeight: totalWeightKg,
        totalPayment: totalPaddyValue,
        seedBorrowed: sBorrowed,
        seedRepayment: sRepayment,
        seedDeduction: seedDeductionVal,
        additionalPremium: addPrice,
        netPayment: netPaymentToFarmer,
        signatureFarmer: savedFarmerSig || signatureFarmer || existing.signatureFarmer,
        signatureStaff: savedStaffSig || signatureStaff || existing.signatureStaff,
        purchasingStaffId: userId,
        purchasingStaffName: session.user?.name || existing.purchasingStaffName,
        specsRecordId: specsRecordId || existing.specsRecordId,
        status: nextStatus,
      },
    });

    // Update or Create Item
    if (existing.items && existing.items.length > 0) {
      await db.purchaseItem.update({
        where: { id: existing.items[0].id },
        data: {
          variety: item.variety || existing.items[0].variety || 'Red Jasmine',
          grade: item.grade || existing.items[0].grade || 'A1',
          standardPrice: stdPrice,
          additionalPrice: addPrice,
          finalPrice: finPrice,
          sacks: sacksCount,
          quantity: totalWeightKg,
          totalValue: totalPaddyValue,
          sackWeights: JSON.stringify(item.sackWeights || []),
        },
      });
    } else {
      await db.purchaseItem.create({
        data: {
          purchaseId: id,
          variety: item.variety || 'Red Jasmine',
          grade: item.grade || 'A1',
          standardPrice: stdPrice,
          additionalPrice: addPrice,
          finalPrice: finPrice,
          sacks: sacksCount,
          quantity: totalWeightKg,
          totalValue: totalPaddyValue,
          sackWeights: JSON.stringify(item.sackWeights || []),
        },
      });
    }

    // If assigned to a transport record (e.g. a REJECTED truck), synchronize TransportLot and TransportRecord totals
    if (existing.transportRecordId) {
      await db.transportLot.updateMany({
        where: { transportId: existing.transportRecordId, purchaseRecordId: id },
        data: {
          variety: item.variety || existing.items?.[0]?.variety || 'Red Jasmine',
          familyCode: updatedRecord.familyCode,
          farmerName: updatedRecord.farmerName,
          village: updatedRecord.village,
          sacks: sacksCount,
          weight: totalWeightKg,
        },
      });

      const siblingPurchases = await db.purchaseRecord.findMany({
        where: { transportRecordId: existing.transportRecordId },
        include: { items: true },
      });
      const newTotalSacks = siblingPurchases.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
      const newTotalFieldWeight = siblingPurchases.reduce((sum, p) => sum + p.totalWeight, 0);

      await db.transportRecord.update({
        where: { id: existing.transportRecordId },
        data: {
          totalSacks: newTotalSacks,
          totalFieldWeight: newTotalFieldWeight,
        },
      });
    }

    // Resolve any active rejection logs for this purchase
    await db.rejectionLog.updateMany({
      where: { entityType: 'PurchaseRecord', entityId: id, status: 'REJECTED' },
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
      userRole: (session.user as { role?: string })?.role,
      action: 'UPDATE',
      entityType: 'PurchaseRecord',
      entityId: id,
      details: {
        familyCode: updatedRecord.familyCode,
        farmerName: updatedRecord.farmerName,
        totalWeight: totalWeightKg,
        netPayment: netPaymentToFarmer,
        status: nextStatus,
      },
    });

    const fullRecord = await db.purchaseRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    return NextResponse.json(fullRecord);
  } catch (error) {
    console.error('Error updating purchase record:', error);
    return NextResponse.json({ error: 'Failed to update purchase record.' }, { status: 500 });
  }
}

export async function DELETE(
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

    const existing = await db.purchaseRecord.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Purchase record not found.' }, { status: 404 });
    }

    // Check village authorization for Field Staff / Province bounds
    if (session.user && !(await isVillageAuthorized(existing.village, session.user as any))) {
      return NextResponse.json(
        { error: `Unauthorized. Record belongs to village '${existing.village}' which is outside your assigned province.` },
        { status: 403 }
      );
    }

    // Stage Locking check: Allow deletion ONLY if record is at Field stage (PENDING, DRAFT, REJECTED) or linked Transport is REJECTED
    let isLocked = false;
    if (existing.transportRecordId) {
      const linkedTransport = await db.transportRecord.findUnique({
        where: { id: existing.transportRecordId },
      });
      if (linkedTransport && linkedTransport.status !== 'REJECTED') {
        isLocked = true;
      }
    } else if (existing.status !== 'PENDING' && existing.status !== 'REJECTED' && existing.status !== 'DRAFT') {
      isLocked = true;
    }

    if (isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete purchase record. This record has already been dispatched to an active truck or received/accepted by warehouse.' },
        { status: 400 }
      );
    }

    const parentTransportId = existing.transportRecordId;

    // Delete purchase record (PurchaseItem will be cascade deleted)
    await db.purchaseRecord.delete({
      where: { id },
    });

    // If this purchase belonged to a REJECTED transport, clean up its TransportLot and recalculate truck totals
    if (parentTransportId) {
      await db.transportLot.deleteMany({
        where: { transportId: parentTransportId, purchaseRecordId: id },
      });

      const remainingPurchases = await db.purchaseRecord.findMany({
        where: { transportRecordId: parentTransportId },
        include: { items: true },
      });
      const newTotalSacks = remainingPurchases.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
      const newTotalFieldWeight = remainingPurchases.reduce((sum, p) => sum + p.totalWeight, 0);

      await db.transportRecord.update({
        where: { id: parentTransportId },
        data: {
          totalSacks: newTotalSacks,
          totalFieldWeight: newTotalFieldWeight,
        },
      });
    }

    // Audit Log
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Field Staff',
      userRole: (session.user as { role?: string })?.role,
      action: 'DELETE',
      entityType: 'PurchaseRecord',
      entityId: id,
      details: {
        familyCode: existing.familyCode,
        farmerName: existing.farmerName,
        village: existing.village,
        totalWeight: existing.totalWeight,
        netPayment: existing.netPayment,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting purchase record:', error);
    return NextResponse.json({ error: 'Failed to delete purchase record.' }, { status: 500 });
  }
}
