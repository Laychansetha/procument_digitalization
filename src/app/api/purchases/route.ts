import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { processAndSaveImage } from '@/lib/image-upload-server';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';

import { generatePurchaseId } from '@/lib/purchase-id';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedVillages = await getAllowedVillagesForSession(session?.user);

    const whereClause = allowedVillages !== null ? { village: { in: allowedVillages } } : {};

    const purchases = await db.purchaseRecord.findMany({
      where: whereClause,
      include: {
        items: true,
        transportRecord: {
          select: { id: true, status: true },
        },
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
    const session = await getServerSession(authOptions);
    const { userId, userName, userRole } = await getResolvedUser(request);

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

    if (session?.user && !(await isVillageAuthorized(normVillage, session.user))) {
      return NextResponse.json({ error: `Unauthorized. Village '${normVillage}' is outside your assigned province.` }, { status: 403 });
    }

    const firstItem = items[0] || {};
    const stdPrice = parseFloat(firstItem.standardPrice) || 0;
    const addPrice = parseFloat(firstItem.additionalPrice ?? additionalPremium) || 0;
    const finPrice = stdPrice + addPrice;

    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const grossPayment = items.reduce((sum, item) => sum + (parseFloat(item.totalValue) || (parseFloat(item.quantity) * finPrice)), 0);

    const sBorrowed = parseFloat(seedBorrowed) || 0;
    const sRepayment = sBorrowed * 1.1; // 10% seed interest
    const calculatedSeedDeduction = sRepayment * finPrice; // Repayment kg * final purchase price
    const sDeduction = seedDeduction !== undefined && !isNaN(parseFloat(seedDeduction)) ? parseFloat(seedDeduction) : calculatedSeedDeduction;
    const netPayment = Math.max(0, grossPayment - sDeduction);

    const addPremium = addPrice;

    // Resolve specs record by ID or composite key (familyCode + village)
    let linkedSpecsId = specsRecordId || null;
    if (!linkedSpecsId || linkedSpecsId.startsWith('offline_')) {
      const foundSpecs = await db.specsRecord.findFirst({
        where: {
          familyCode: normCode,
          village: normVillage,
          paddyType: firstItem.variety ? firstItem.variety.trim() : undefined,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (foundSpecs) {
        linkedSpecsId = foundSpecs.id;
      } else if (linkedSpecsId?.startsWith('offline_')) {
        linkedSpecsId = null;
      }
    }

    const savedFarmerSig = await processAndSaveImage(signatureFarmer, 'sig_farmer');
    const savedStaffSig = await processAndSaveImage(signatureStaff, 'sig_staff');

    // Generate unique Purchase ID in FamilyCode_DDMMYY_24H format
    const basePurchaseId = generatePurchaseId(normCode);
    let purchaseId = basePurchaseId;
    let dupCounter = 2;
    while (await db.purchaseRecord.findUnique({ where: { id: purchaseId } })) {
      purchaseId = `${basePurchaseId}_${dupCounter}`;
      dupCounter++;
    }

    const purchase = await db.purchaseRecord.create({
      data: {
        id: purchaseId,
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
          create: items.map((item) => {
            const itemStd = parseFloat(item.standardPrice) || stdPrice;
            const itemAdd = parseFloat(item.additionalPrice ?? addPremium) || 0;
            const itemFin = itemStd + itemAdd;
            const itemQty = parseFloat(item.quantity) || 0;
            return {
              variety: item.variety,
              grade: item.grade || '',
              standardPrice: itemStd,
              additionalPrice: itemAdd,
              finalPrice: itemFin,
              sacks: parseInt(item.sacks, 10) || 0,
              quantity: itemQty,
              totalValue: parseFloat(item.totalValue) || (itemQty * itemFin),
              sackWeights: Array.isArray(item.sackWeights) ? JSON.stringify(item.sackWeights) : item.sackWeights || null,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    // Audit Log
    await logAudit({
      userId,
      userEmail: session?.user?.email,
      userName,
      userRole,
      action: 'CREATE',
      entityType: 'PurchaseRecord',
      entityId: purchase.id,
      details: {
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
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase record:', error);
    return NextResponse.json({ error: 'Failed to create purchase record.' }, { status: 500 });
  }
}
