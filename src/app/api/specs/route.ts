import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedVillages = await getAllowedVillagesForSession(session?.user);

    const whereClause = allowedVillages !== null ? { village: { in: allowedVillages } } : {};

    const specs = await db.specsRecord.findMany({
      where: whereClause,
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
    const session = await getServerSession(authOptions);
    const { userId, userName, userRole } = await getResolvedUser();

    const body = await request.json();
    const {
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

    if (session?.user && !(await isVillageAuthorized(normVillage, session.user))) {
      return NextResponse.json({ error: `Unauthorized. Village '${normVillage}' is outside your assigned province.` }, { status: 403 });
    }
    const bPrice = parseFloat(basePrice) || 0;
    const fPrice = parseFloat(finalPrice) || bPrice;

    // Check if specs record already exists for this (Family Code + Village)
    const existing = await db.specsRecord.findFirst({
      where: {
        familyCode: normCode,
        village: normVillage,
      },
    });

    let spec;
    if (existing) {
      spec = await db.specsRecord.update({
        where: { id: existing.id },
        data: {
          farmerName: farmerName.trim(),
          paddyType,
          selectedGrade,
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
        },
      });
    } else {
      spec = await db.specsRecord.create({
        data: {
          familyCode: normCode,
          farmerName: farmerName.trim(),
          village: normVillage,
          paddyType,
          selectedGrade,
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
      });
    }

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action: existing ? 'UPDATE' : 'CREATE',
        entityType: 'SpecsRecord',
        entityId: spec.id,
        details: JSON.stringify({ familyCode: normCode, village: normVillage, farmerName, paddyType, selectedGrade, finalPrice: fPrice }),
      },
    });

    return NextResponse.json(spec, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating specs record:', error);
    return NextResponse.json({ error: 'Failed to save specs record.' }, { status: 500 });
  }
}
