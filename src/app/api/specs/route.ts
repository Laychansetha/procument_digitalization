import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getResolvedUser, getSessionOrHeaderUser } from '@/lib/sync-auth';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const authUser = await getSessionOrHeaderUser(request);
    const allowedVillages = await getAllowedVillagesForSession(authUser);

    const whereClause = allowedVillages !== null ? { village: { in: allowedVillages } } : {};

    const specs = await db.specsRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(specs);
  } catch (error) {
    console.error('Error fetching specs:', error);
    return NextResponse.json({ error: 'Failed to fetch specs records.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getSessionOrHeaderUser(request);
    const { userId, userName, userRole } = await getResolvedUser(request);

    const body = await request.json();
    const {
      serverRecordId,
      familyCode,
      farmerName,
      village,
      paddyType,
      selectedGrade,
      isOrganic,
      moisture,
      foreignMatter,
      purity,
      impurity,
      wholeGrain,
      brokenRice,
      isValid,
      basePrice,
      finalPrice,
      bestQualifyingGrade,
    } = body;

    if (!familyCode || !farmerName || !paddyType || !selectedGrade) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const normCode = familyCode.toUpperCase().trim();
    const normVillage = (village || '').trim();

    if (authUser && !(await isVillageAuthorized(normVillage, authUser))) {
      return NextResponse.json({ error: `Unauthorized. Village '${normVillage}' is outside your assigned province.` }, { status: 403 });
    }
    const bPrice = parseFloat(basePrice) || 0;
    const fPrice = parseFloat(finalPrice) || bPrice;

    // Match by composite key and serverRecordId (preventing duplicates when key fields are edited)
    const compositeMatch = await db.specsRecord.findFirst({
      where: {
        familyCode: normCode,
        village: normVillage,
        paddyType: paddyType.trim(),
        selectedGrade: selectedGrade.trim(),
      },
    });

    let existing = null;
    if (serverRecordId) {
      const byId = await db.specsRecord.findUnique({
        where: { id: String(serverRecordId) },
      });
      if (byId && authUser && !(await isVillageAuthorized(byId.village, authUser))) {
        return NextResponse.json({ error: `Unauthorized. Record belongs to village '${byId.village}' which is outside your assigned province.` }, { status: 403 });
      }
      if (byId && compositeMatch && byId.id !== compositeMatch.id) {
        // Another record already owns the target composite key; update compositeMatch to prevent duplicates
        existing = compositeMatch;
      } else {
        existing = byId;
      }
    }
    if (!existing) {
      existing = compositeMatch;
    }

    let spec;
    if (existing) {
      // Prevent overwriting a SpecsRecord whose linked purchase has already been dispatched
      const linkedPurchase = await db.purchaseRecord.findFirst({
        where: {
          specsRecordId: existing.id,
          status: { notIn: ['REJECTED'] },
        },
      });
      if (linkedPurchase && (linkedPurchase.status !== 'PENDING' || linkedPurchase.transportRecordId)) {
        return NextResponse.json(
          { error: 'This Specs Record cannot be updated because its linked purchase has already been assigned to transport or dispatched.' },
          { status: 400 }
        );
      }

      spec = await db.specsRecord.update({
        where: { id: existing.id },
        data: {
          familyCode: normCode,
          farmerName: farmerName.trim(),
          village: normVillage,
          paddyType: paddyType.trim(),
          selectedGrade: selectedGrade.trim(),
          isOrganic: isOrganic !== undefined ? Boolean(isOrganic) : true,
          moisture: parseFloat(moisture) || 0,
          foreignMatter: parseFloat(foreignMatter) || 0,
          purity: purity !== undefined && purity !== null ? parseFloat(purity) : null,
          impurity: impurity !== undefined && impurity !== null ? parseFloat(impurity) : null,
          wholeGrain: wholeGrain !== undefined && wholeGrain !== null ? parseFloat(wholeGrain) : null,
          brokenRice: brokenRice !== undefined && brokenRice !== null ? parseFloat(brokenRice) : null,
          isValid: Boolean(isValid),
          basePrice: bPrice,
          finalPrice: fPrice,
          bestQualifyingGrade: bestQualifyingGrade || selectedGrade,
          createdBy: existing.createdBy || userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      spec = await db.specsRecord.create({
        data: {
          familyCode: normCode,
          farmerName: farmerName.trim(),
          village: normVillage,
          paddyType: paddyType.trim(),
          selectedGrade: selectedGrade.trim(),
          isOrganic: isOrganic !== undefined ? Boolean(isOrganic) : true,
          moisture: parseFloat(moisture) || 0,
          foreignMatter: parseFloat(foreignMatter) || 0,
          purity: purity !== undefined && purity !== null ? parseFloat(purity) : null,
          impurity: impurity !== undefined && impurity !== null ? parseFloat(impurity) : null,
          wholeGrain: wholeGrain !== undefined && wholeGrain !== null ? parseFloat(wholeGrain) : null,
          brokenRice: brokenRice !== undefined && brokenRice !== null ? parseFloat(brokenRice) : null,
          isValid: Boolean(isValid),
          basePrice: bPrice,
          finalPrice: fPrice,
          bestQualifyingGrade: bestQualifyingGrade || selectedGrade,
          createdBy: userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }

    await logAudit({
      userId,
      userName,
      userRole,
      action: existing ? 'UPDATE' : 'CREATE',
      entityType: 'SpecsRecord',
      entityId: spec.id,
      details: { familyCode: normCode, village: normVillage, farmerName, paddyType, selectedGrade, finalPrice: fPrice },
    });

    return NextResponse.json(spec, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating specs record:', error);
    return NextResponse.json({ error: 'Failed to save specs record.' }, { status: 500 });
  }
}
