import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { processAndSaveImage } from '@/lib/image-upload-server';

export async function GET() {
  try {
    const purchases = await db.purchaseRecord.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase records.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userName, userRole } = await getResolvedUser();

    const body = await request.json();
    const {
      familyCode,
      farmerName,
      village,
      items,
      seedBorrowed,
      seedDeduction,
      additionalPremium,
      signatureFarmer,
      signatureStaff,
      specsRecordId,
    } = body;

    if (!familyCode || !farmerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Family code, farmer name, and items are required.' }, { status: 400 });
    }

    const normCode = familyCode.toUpperCase().trim();
    const normVillage = (village || '').trim();

    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const grossPayment = items.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0);

    const sBorrowed = parseFloat(seedBorrowed) || 0;
    const sDeduction = parseFloat(seedDeduction) || 0;
    const sRepayment = sBorrowed * 1.1; // 10% seed interest
    const netPayment = Math.max(0, grossPayment - sDeduction);

    const addPremium = parseFloat(additionalPremium) || 0;

    // Resolve specs record by ID or composite key (familyCode + village)
    let linkedSpecsId = specsRecordId || null;
    if (!linkedSpecsId) {
      const foundSpecs = await db.specsRecord.findFirst({
        where: { familyCode: normCode, village: normVillage },
        orderBy: { createdAt: 'desc' },
      });
      if (foundSpecs) {
        linkedSpecsId = foundSpecs.id;
      }
    }

    const savedFarmerSig = await processAndSaveImage(signatureFarmer, 'sig_farmer');
    const savedStaffSig = await processAndSaveImage(signatureStaff, 'sig_staff');

    const purchase = await db.purchaseRecord.create({
      data: {
        familyCode: normCode,
        farmerName: farmerName.trim(),
        village: normVillage,
        totalWeight,
        totalPayment: grossPayment,
        seedBorrowed: sBorrowed,
        seedRepayment: sRepayment,
        seedDeduction: sDeduction,
        additionalPremium: addPremium,
        netPayment,
        signatureFarmer: savedFarmerSig || signatureFarmer || null,
        signatureStaff: savedStaffSig || signatureStaff || null,
        purchasingStaffId: userId,
        purchasingStaffName: userName,
        specsRecordId: linkedSpecsId,
        status: 'PENDING',
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            variety: item.variety,
            grade: item.grade || '',
            standardPrice: parseFloat(item.standardPrice) || 0,
            additionalPrice: parseFloat(item.additionalPrice) || 0,
            finalPrice: parseFloat(item.finalPrice) || 0,
            sacks: parseInt(item.sacks, 10) || 0,
            quantity: parseFloat(item.quantity) || 0,
            totalValue: parseFloat(item.totalValue) || 0,
            sackWeights: Array.isArray(item.sackWeights) ? JSON.stringify(item.sackWeights) : item.sackWeights || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action: 'CREATE',
        entityType: 'PurchaseRecord',
        entityId: purchase.id,
        details: JSON.stringify({
          familyCode: normCode,
          village: normVillage,
          farmerName,
          totalWeight,
          totalPayment: grossPayment,
          netPayment,
          purchasingStaff: userName,
          sackCount: items[0]?.sacks || 0,
          hasFarmerSignature: Boolean(signatureFarmer),
          hasStaffSignature: Boolean(signatureStaff),
          linkedSpecsId: linkedSpecsId || 'None',
        }),
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase record:', error);
    return NextResponse.json({ error: 'Failed to create purchase record.' }, { status: 500 });
  }
}
