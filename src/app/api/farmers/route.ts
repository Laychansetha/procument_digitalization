import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { processAndSaveImage } from '@/lib/image-upload-server';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedVillages = await getAllowedVillagesForSession(session?.user);

    const whereClause = allowedVillages !== null ? { village: { in: allowedVillages } } : {};

    const profiles = await db.farmerProfile.findMany({
      where: whereClause,
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
    const session = await getServerSession(authOptions);
    const { userId, userName, userRole } = await getResolvedUser(request);

    const body = await request.json();
    const {
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

    if (session?.user && !(await isVillageAuthorized(normVillage, session.user))) {
      return NextResponse.json({ error: `Unauthorized. Village '${normVillage}' is outside your assigned province.` }, { status: 403 });
    }

    // Check if profile exists for composite key (Family Code + Village)
    const existing = await db.farmerProfile.findFirst({
      where: {
        familyCode: normCode,
        village: normVillage,
      },
    });

    const savedDocUrl = await processAndSaveImage(bankDocumentUrl, 'doc');

    let profile;
    if (existing) {
      profile = await db.farmerProfile.update({
        where: { id: existing.id },
        data: {
          farmerName: farmerName.trim(),
          phone: phone || existing.phone,
          paymentMethod: paymentMethod || existing.paymentMethod,
          bankName: paymentMethod === 'Bank Transfer' ? (bankName || existing.bankName) : (paymentMethod === 'Cash' ? 'Cash' : bankName),
          accountNumber: paymentMethod === 'Bank Transfer' ? (accountNumber || existing.accountNumber) : '—',
          accountHolder: paymentMethod === 'Bank Transfer' ? (accountHolder || farmerName) : farmerName,
          relationship: relationship || existing.relationship,
          bankDocumentUrl: savedDocUrl || existing.bankDocumentUrl,
          notes: notes || existing.notes,
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
      });
    }

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action: existing ? 'UPDATE' : 'CREATE',
        entityType: 'FarmerProfile',
        entityId: profile.id,
        details: JSON.stringify({ familyCode: normCode, village: normVillage, farmerName, bankName, accountNumber, hasBankPhoto: Boolean(bankDocumentUrl) }),
      },
    });

    return NextResponse.json(profile, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error saving farmer profile:', error);
    return NextResponse.json({ error: 'Failed to save farmer payment profile.' }, { status: 500 });
  }
}
