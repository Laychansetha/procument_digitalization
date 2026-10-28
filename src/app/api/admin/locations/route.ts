import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const locations = await db.locationRegistry.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || (userRole !== 'ADMIN' && userRole !== 'WAREHOUSE')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Warehouse role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, type, code, address, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Location name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const locType = type || 'BUYING_STATION';

    let location;

    if (id) {
      // Update existing record by ID
      location = await db.locationRegistry.update({
        where: { id },
        data: {
          name: trimmedName,
          type: locType,
          code: code || null,
          address: address || null,
          status: status || 'ACTIVE',
        },
      });
    } else {
      // Upsert by unique name
      location = await db.locationRegistry.upsert({
        where: { name: trimmedName },
        update: {
          type: locType,
          code: code || null,
          address: address || null,
          status: status || 'ACTIVE',
        },
        create: {
          name: trimmedName,
          type: locType,
          code: code || null,
          address: address || null,
          status: status || 'ACTIVE',
        },
      });
    }

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: userRole as 'ADMIN' | 'WAREHOUSE',
      action: 'CONFIG',
      entityType: 'LocationRegistry',
      entityId: location.id,
      details: { name: trimmedName, type: locType },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json({ error: 'Failed to save location.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required.' }, { status: 400 });
    }

    await db.locationRegistry.delete({ where: { id } });

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: 'ADMIN',
      action: 'CONFIG',
      entityType: 'LocationRegistry',
      entityId: id,
      details: { action: 'DELETE_LOCATION', locationId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location.' }, { status: 500 });
  }
}
