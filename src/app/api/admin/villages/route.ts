import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { CANONICAL_PROVINCES, normalizeProvinceName } from '@/lib/province-guard';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; assignedProvinces?: string } | undefined;

    const { searchParams } = new URL(request.url);
    const provincesQuery = searchParams.get('provinces');

    let whereClause = {};
    const targetProvincesStr = provincesQuery || (user?.role === 'FIELD' ? user?.assignedProvinces : undefined);

    if (targetProvincesStr && targetProvincesStr.toLowerCase() !== 'na') {
      const normalizedProvinces = Array.from(
        new Set(
          targetProvincesStr
            .split(',')
            .map((p) => normalizeProvinceName(p))
            .filter(Boolean)
        )
      );

      if (
        normalizedProvinces.length > 0 &&
        normalizedProvinces.length < 4 &&
        !normalizedProvinces.some((p) => p.toLowerCase() === 'all') &&
        !CANONICAL_PROVINCES.every((ap) => normalizedProvinces.some((p) => p.toLowerCase() === ap.toLowerCase()))
      ) {
        const queryProvinces = new Set<string>(normalizedProvinces);
        if (queryProvinces.has('Mondulkiri')) {
          queryProvinces.add('Mondolkiri');
        }
        whereClause = {
          province: { in: Array.from(queryProvinces) },
        };
      }
    }

    const villages = await db.village.findMany({
      where: whereClause,
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(villages);
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json({ error: 'Failed to fetch villages.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || (userRole !== 'ADMIN' && userRole !== 'FIELD')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Field role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, code, district, province, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Village name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const normalizedProvince = province ? normalizeProvinceName(province) : 'Preah Vihear';
    let village;

    if (id) {
      village = await db.village.update({
        where: { id },
        data: {
          name: trimmedName,
          code: code || null,
          district: district || 'Chhaeb',
          province: normalizedProvince,
          status: status || 'ACTIVE',
        },
      });
    } else {
      village = await db.village.upsert({
        where: { name: trimmedName },
        update: {
          code: code || null,
          district: district || 'Chhaeb',
          province: normalizedProvince,
          status: status || 'ACTIVE',
        },
        create: {
          name: trimmedName,
          code: code || null,
          district: district || 'Chhaeb',
          province: normalizedProvince,
          status: status || 'ACTIVE',
        },
      });
    }

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: userRole as 'ADMIN' | 'FIELD',
      action: 'CONFIG',
      entityType: 'Village',
      entityId: village.id,
      details: { villageName: trimmedName, province: normalizedProvince, status: village.status },
    });

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error('Error saving village:', error);
    return NextResponse.json({ error: 'Failed to save village.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Village ID is required.' }, { status: 400 });
    }

    await db.village.delete({ where: { id } });

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: 'ADMIN',
      action: 'CONFIG',
      entityType: 'Village',
      entityId: id,
      details: { action: 'DELETE_VILLAGE', villageId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting village:', error);
    return NextResponse.json({ error: 'Failed to delete village.' }, { status: 500 });
  }
}
