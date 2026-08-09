import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // LOCKING RULE: Cannot edit SpecsRecord if a PurchaseRecord has already been created from it
    const linkedPurchase = await db.purchaseRecord.findFirst({
      where: { specsRecordId: id },
    });

    if (linkedPurchase) {
      return NextResponse.json(
        { error: 'This Specs Record has already been used for a purchase and can no longer be edited.' },
        { status: 400 }
      );
    }

    const updated = await db.specsRecord.update({
      where: { id },
      data: {
        familyCode: body.familyCode !== undefined ? body.familyCode.toUpperCase().trim() : existing.familyCode,
        farmerName: body.farmerName !== undefined ? body.farmerName.trim() : existing.farmerName,
        village: body.village !== undefined ? body.village : existing.village,
        paddyType: body.paddyType !== undefined ? body.paddyType : existing.paddyType,
        selectedGrade: body.selectedGrade !== undefined ? body.selectedGrade : existing.selectedGrade,
        isOrganic: body.isOrganic !== undefined ? Boolean(body.isOrganic) : existing.isOrganic,
        moisture: body.moisture !== undefined ? parseFloat(body.moisture) : existing.moisture,
        foreignMatter: body.foreignMatter !== undefined ? parseFloat(body.foreignMatter) : existing.foreignMatter,
        purity: body.purity !== undefined && body.purity !== null ? parseFloat(body.purity) : existing.purity,
        impurity: body.impurity !== undefined && body.impurity !== null ? parseFloat(body.impurity) : existing.impurity,
        wholeGrain: body.wholeGrain !== undefined && body.wholeGrain !== null ? parseFloat(body.wholeGrain) : existing.wholeGrain,
        brokenRice: body.brokenRice !== undefined && body.brokenRice !== null ? parseFloat(body.brokenRice) : existing.brokenRice,
        isValid: body.isValid !== undefined ? Boolean(body.isValid) : existing.isValid,
        basePrice: body.basePrice !== undefined ? parseFloat(body.basePrice) : existing.basePrice,
        finalPrice: body.finalPrice !== undefined ? parseFloat(body.finalPrice) : existing.finalPrice,
        bestQualifyingGrade: body.bestQualifyingGrade || body.selectedGrade || existing.bestQualifyingGrade,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'User',
        userRole: (userRole as any) || 'FIELD',
        action: 'UPDATE',
        entityType: 'SpecsRecord',
        entityId: id,
        details: JSON.stringify({
          familyCode: updated.familyCode,
          farmerName: updated.farmerName,
          paddyType: updated.paddyType,
          selectedGrade: updated.selectedGrade,
          finalPrice: updated.finalPrice,
        }),
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
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin role required to delete specs records.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.specsRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Specs record not found.' }, { status: 404 });
    }

    await db.specsRecord.delete({
      where: { id },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'DELETE',
        entityType: 'SpecsRecord',
        entityId: id,
        details: JSON.stringify({
          familyCode: existing.familyCode,
          farmerName: existing.farmerName,
          paddyType: existing.paddyType,
          selectedGrade: existing.selectedGrade,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting specs record:', error);
    return NextResponse.json({ error: 'Failed to delete specs record.' }, { status: 500 });
  }
}
