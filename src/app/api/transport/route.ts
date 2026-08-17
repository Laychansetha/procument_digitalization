import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getResolvedUser } from '@/lib/sync-auth';
import { getAllowedVillagesForSession, isVillageAuthorized } from '@/lib/province-guard';
import { processAndSaveImage } from '@/lib/image-upload-server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedVillages = await getAllowedVillagesForSession(session?.user);

    const whereClause = allowedVillages !== null
      ? {
          OR: [
            { lots: { some: { village: { in: allowedVillages } } } },
            { purchases: { some: { village: { in: allowedVillages } } } },
          ],
        }
      : {};

    const transports = await db.transportRecord.findMany({
      where: whereClause,
      include: {
        purchases: {
          include: {
            items: true,
          },
        },
        lots: true,
        intake: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transports);
  } catch (error) {
    console.error('Error fetching transport records:', error);
    return NextResponse.json({ error: 'Failed to fetch transport records.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, userName, userRole } = await getResolvedUser(request);

    const body = await request.json();
    const {
      driverName,
      plateNumber,
      mobileNumber,
      loadingLocation,
      destinationWarehouse,
      notes,
      truckCleaned,
      truckPhotoUrl,
      driverSignature,
      selectedPurchaseIds, // Array of purchase IDs assigned to this truck
    } = body;

    if (!driverName || !plateNumber) {
      return NextResponse.json({ error: 'Driver name and plate number are required.' }, { status: 400 });
    }

    if (!selectedPurchaseIds || !Array.isArray(selectedPurchaseIds) || selectedPurchaseIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one purchase record to assign to this truck.' }, { status: 400 });
    }

    // Find purchase records by exact ID
    const purchasesToAssign = await db.purchaseRecord.findMany({
      where: {
        id: { in: selectedPurchaseIds },
      },
      include: {
        items: true,
      },
    });

    if (purchasesToAssign.length === 0) {
      return NextResponse.json({ error: 'Selected purchase records were not found.' }, { status: 404 });
    }

    // Calculate totals
    const totalSacks = purchasesToAssign.reduce((sum, p) => sum + (p.items?.[0]?.sacks || 0), 0);
    const totalFieldWeight = purchasesToAssign.reduce((sum, p) => sum + p.totalWeight, 0);

    const savedTruckPhoto = await processAndSaveImage(truckPhotoUrl, 'truck_loading');

    // Create Transport Record
    const transport = await db.transportRecord.create({
      data: {
        driverName: driverName.trim(),
        plateNumber: plateNumber.toUpperCase().trim(),
        mobileNumber: mobileNumber || null,
        truckCleaned: truckCleaned ?? true,
        truckPhotoUrl: savedTruckPhoto || truckPhotoUrl || null,
        driverSignature: driverSignature || null,
        loadingLocation: loadingLocation || 'Chhaeb Buying Station',
        destinationWarehouse: destinationWarehouse || 'Central Mill Warehouse, Preah Vihear',
        notes: notes || null,
        totalSacks,
        totalFieldWeight,
        fieldStaffName: userName || 'Field Inspector',
        fieldStaffDate: new Date().toISOString().split('T')[0],
        fieldStaffTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'EN_ROUTE',
        createdBy: userId,
        lots: {
          create: purchasesToAssign.map((p) => ({
            variety: p.items?.[0]?.variety || 'Red Jasmine',
            familyCode: p.familyCode,
            farmerName: p.farmerName,
            village: p.village,
            sacks: p.items?.[0]?.sacks || 0,
            weight: p.totalWeight,
            purchaseRecordId: p.id,
          })),
        },
      },
    });

    // Link assigned purchases and mark as IN_TRANSIT
    const assignedIds = purchasesToAssign.map((p) => p.id);
    await db.purchaseRecord.updateMany({
      where: {
        id: { in: assignedIds },
      },
      data: {
        transportRecordId: transport.id,
        status: 'IN_TRANSIT',
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action: 'CREATE',
        entityType: 'TransportRecord',
        entityId: transport.id,
        details: JSON.stringify({
          driverName,
          plateNumber,
          totalSacks,
          totalFieldWeight,
          purchaseCount: purchasesToAssign.length,
        }),
      },
    });

    return NextResponse.json(transport, { status: 201 });
  } catch (error) {
    console.error('Error creating transport record:', error);
    return NextResponse.json({ error: 'Failed to create transport record.' }, { status: 500 });
  }
}
