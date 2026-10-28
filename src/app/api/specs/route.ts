import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedVillages = await getAllowedVillagesForSession(session?.user);

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
    const session = await getServerSession(authOptions);
    const { userId, userName, userRole } = await getResolvedUser(request);

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

    // Check if specs record already exists for this exact (Family Code + Village + Paddy Type + Grade)
    const existing = await db.specsRecord.findFirst({
      where: {
        familyCode: normCode,
        village: normVillage,
        paddyType: paddyType.trim(),
        selectedGrade: selectedGrade.trim(),
      },
    });

    let spec;
    if (existing) {
      spec = await db.specsRecord.update({
        where: { id: existing.id },
        data: {
          farmerName: farmerName.trim(),
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
