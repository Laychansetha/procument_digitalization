import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { isVillageAuthorized } from '@/lib/province-guard';

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

    const existing = await db.specsRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Specs record not found.' }, { status: 404 });
    }

    if (session.user && !(await isVillageAuthorized(existing.village, session.user as any))) {
      return NextResponse.json({ error: `Unauthorized. Record belongs to village '${existing.village}' which is outside your assigned province.` }, { status: 403 });
    }

    if (body.village && session.user && !(await isVillageAuthorized(body.village, session.user as any))) {
      return NextResponse.json({ error: `Unauthorized. Target village '${body.village}' is outside your assigned province.` }, { status: 403 });
    }

    // LOCKING RULE: Cannot edit SpecsRecord if linked purchase has already been assigned to transport or dispatched
    const linkedPurchase = await db.purchaseRecord.findFirst({
      where: {
        specsRecordId: id,
        status: { notIn: ['REJECTED'] },
      },
      include: {
        items: true,
      },
    });

    if (linkedPurchase && (linkedPurchase.status !== 'PENDING' || linkedPurchase.transportRecordId)) {
      return NextResponse.json(
        { error: 'This Specs Record cannot be edited because its linked purchase has already been assigned to transport or dispatched.' },
        { status: 400 }
      );
    }

    const parsedMoisture = body.moisture !== undefined && !isNaN(parseFloat(body.moisture))
      ? parseFloat(body.moisture)
      : existing.moisture;

    const parsedForeignMatter = body.foreignMatter !== undefined && !isNaN(parseFloat(body.foreignMatter))
      ? parseFloat(body.foreignMatter)
      : existing.foreignMatter;

    const parsedBasePrice = body.basePrice !== undefined && !isNaN(parseFloat(body.basePrice))
      ? parseFloat(body.basePrice)
      : existing.basePrice;

    const parsedFinalPrice = body.finalPrice !== undefined && !isNaN(parseFloat(body.finalPrice))
      ? parseFloat(body.finalPrice)
      : (parsedBasePrice || existing.finalPrice);

    const updated = await db.specsRecord.update({
      where: { id },
      data: {
        familyCode: body.familyCode !== undefined ? body.familyCode.toUpperCase().trim() : existing.familyCode,
        farmerName: body.farmerName !== undefined ? body.farmerName.trim() : existing.farmerName,
        village: body.village !== undefined ? body.village : existing.village,
        paddyType: body.paddyType !== undefined ? body.paddyType : existing.paddyType,
        selectedGrade: body.selectedGrade !== undefined ? body.selectedGrade : existing.selectedGrade,
        isOrganic: body.isOrganic !== undefined ? Boolean(body.isOrganic) : existing.isOrganic,
        moisture: parsedMoisture,
        foreignMatter: parsedForeignMatter,
        purity: body.purity !== undefined && body.purity !== null && !isNaN(parseFloat(body.purity)) ? parseFloat(body.purity) : existing.purity,
        impurity: body.impurity !== undefined && body.impurity !== null && !isNaN(parseFloat(body.impurity)) ? parseFloat(body.impurity) : existing.impurity,
        wholeGrain: body.wholeGrain !== undefined && body.wholeGrain !== null && !isNaN(parseFloat(body.wholeGrain)) ? parseFloat(body.wholeGrain) : existing.wholeGrain,
        brokenRice: body.brokenRice !== undefined && body.brokenRice !== null && !isNaN(parseFloat(body.brokenRice)) ? parseFloat(body.brokenRice) : existing.brokenRice,
        isValid: body.isValid !== undefined ? Boolean(body.isValid) : existing.isValid,
        basePrice: parsedBasePrice,
        finalPrice: parsedFinalPrice,
        bestQualifyingGrade: body.bestQualifyingGrade || body.selectedGrade || existing.bestQualifyingGrade,
      },
    });

    // If a pending purchase is linked, update it to reflect the updated specs
    if (linkedPurchase) {
      const item = linkedPurchase.items?.[0];
      if (item) {
        const newStandardPrice = parsedFinalPrice;
        const newFinalPrice = newStandardPrice + item.additionalPrice;
        const newTotalValue = item.quantity * newFinalPrice;
        const newSeedDeduction = Math.round(linkedPurchase.seedRepayment * newFinalPrice);
        const newNetPayment = Math.max(0, newTotalValue - newSeedDeduction);

        await db.purchaseItem.update({
          where: { id: item.id },
          data: {
            variety: updated.paddyType,
            grade: updated.selectedGrade,
            standardPrice: newStandardPrice,
            finalPrice: newFinalPrice,
            totalValue: newTotalValue,
          },
        });

        await db.purchaseRecord.update({
          where: { id: linkedPurchase.id },
          data: {
            familyCode: updated.familyCode,
            farmerName: updated.farmerName,
            village: updated.village,
            totalPayment: newTotalValue,
            seedDeduction: newSeedDeduction,
            netPayment: newNetPayment,
          },
        });
      } else {
        await db.purchaseRecord.update({
          where: { id: linkedPurchase.id },
          data: {
            familyCode: updated.familyCode,
            farmerName: updated.farmerName,
            village: updated.village,
          },
        });
      }
    }

    // Audit Log
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Field Staff',
      userRole,
      action: 'UPDATE',
      entityType: 'SpecsRecord',
      entityId: id,
      details: {
        familyCode: updated.familyCode,
        farmerName: updated.farmerName,
        paddyType: updated.paddyType,
        selectedGrade: updated.selectedGrade,
        finalPrice: updated.finalPrice,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating specs record:', error);
    return NextResponse.json({ error: 'Failed to update specs record.' }, { status: 500 });
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

    const existing = await db.specsRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Specs record not found.' }, { status: 404 });
    }

    // Check village authorization
    if (session.user && !(await isVillageAuthorized(existing.village, session.user as any))) {
      return NextResponse.json(
        { error: `Unauthorized. Record belongs to village '${existing.village}' which is outside your assigned province.` },
        { status: 403 }
      );
    }

    // LOCKING RULE: Cannot delete SpecsRecord if an active PurchaseRecord is linked to it
    const linkedPurchase = await db.purchaseRecord.findFirst({
      where: {
        specsRecordId: id,
        status: { notIn: ['REJECTED'] },
      },
    });

    if (linkedPurchase) {
      return NextResponse.json(
        { error: 'Cannot delete Specs Record. This record is currently linked to an active Purchase Record.' },
        { status: 400 }
      );
    }

    await db.specsRecord.delete({
      where: { id },
    });

    // Audit Log
    await logAudit({
      userId,
      userEmail: session.user?.email,
      userName: session.user?.name || 'Field Staff',
      userRole: (session.user as { role?: string })?.role,
      action: 'DELETE',
      entityType: 'SpecsRecord',
      entityId: id,
      details: {
        familyCode: existing.familyCode,
        farmerName: existing.farmerName,
        paddyType: existing.paddyType,
        selectedGrade: existing.selectedGrade,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting specs record:', error);
    return NextResponse.json({ error: 'Failed to delete specs record.' }, { status: 500 });
  }
}
