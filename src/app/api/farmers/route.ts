import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getResolvedUser, getSessionOrHeaderUser } from '@/lib/sync-auth';
import { processAndSaveImage } from '@/lib/image-upload-server';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const authUser = await getSessionOrHeaderUser(request);
    const allowedVillages = await getAllowedVillagesForSession(authUser);

    const whereClause = allowedVillages !== null ? { village: { in: allowedVillages } } : {};

    const profiles = await db.farmerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching farmer profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch farmer profiles.' }, { status: 500 });
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
      phone,
      paymentMethod,
      bankName,
      accountNumber,
      accountHolder,
      relationship,
      bankDocumentUrl,
      notes,
    } = body;

    if (!familyCode || !farmerName) {
      return NextResponse.json({ error: 'Family code and farmer name are required.' }, { status: 400 });
    }

    const normCode = familyCode.toUpperCase().trim();
    const normVillage = (village || '').trim();

    if (authUser && !(await isVillageAuthorized(normVillage, authUser))) {
      return NextResponse.json({ error: `Unauthorized. Village '${normVillage}' is outside your assigned province.` }, { status: 403 });
    }

    // Match by composite key and serverRecordId (preventing duplicates when key fields are edited)
    const compositeMatch = await db.farmerProfile.findFirst({
      where: {
        familyCode: normCode,
        village: normVillage,
      },
    });

    let existing = null;
    if (serverRecordId) {
      const byId = await db.farmerProfile.findUnique({
        where: { id: String(serverRecordId) },
      });
      if (byId && authUser && !(await isVillageAuthorized(byId.village, authUser))) {
        return NextResponse.json({ error: `Unauthorized. Profile belongs to village '${byId.village}' which is outside your assigned province.` }, { status: 403 });
      }
      if (byId && compositeMatch && byId.id !== compositeMatch.id) {
        existing = compositeMatch;
      } else {
        existing = byId;
      }
    }
    if (!existing) {
      existing = compositeMatch;
    }

    const savedDocUrl = await processAndSaveImage(bankDocumentUrl, 'doc');

    let profile;
    if (existing) {
      profile = await db.farmerProfile.update({
        where: { id: existing.id },
        data: {
          familyCode: normCode,
          farmerName: farmerName.trim(),
          village: normVillage,
          phone: phone || existing.phone,
          paymentMethod: paymentMethod || existing.paymentMethod,
          bankName: paymentMethod === 'Bank Transfer' ? (bankName || existing.bankName) : (paymentMethod === 'Cash' ? 'Cash' : bankName),
          accountNumber: paymentMethod === 'Bank Transfer' ? (accountNumber || existing.accountNumber) : '—',
          accountHolder: paymentMethod === 'Bank Transfer' ? (accountHolder || farmerName) : farmerName,
          relationship: relationship || existing.relationship,
          bankDocumentUrl: savedDocUrl || existing.bankDocumentUrl,
          notes: notes || existing.notes,
          createdBy: existing.createdBy || userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      profile = await db.farmerProfile.create({
        data: {
          familyCode: normCode,
          farmerName: farmerName.trim(),
          village: normVillage,
          phone: phone || '',
          paymentMethod: paymentMethod || 'Bank Transfer',
          bankName: paymentMethod === 'Bank Transfer' ? bankName : (paymentMethod === 'Cash' ? 'Cash' : bankName),
          accountNumber: paymentMethod === 'Bank Transfer' ? (accountNumber || '—') : '—',
          accountHolder: paymentMethod === 'Bank Transfer' ? (accountHolder || farmerName) : farmerName,
          relationship: relationship || 'Self',
          bankDocumentUrl: savedDocUrl || null,
          notes: notes || '',
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
      entityType: 'FarmerProfile',
      entityId: profile.id,
      details: { familyCode: normCode, village: normVillage, farmerName, bankName, accountNumber, hasBankPhoto: Boolean(bankDocumentUrl) },
    });

    return NextResponse.json(profile, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error saving farmer profile:', error);
    return NextResponse.json({ error: 'Failed to save farmer payment profile.' }, { status: 500 });
  }
}
