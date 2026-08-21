import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; assignedProvinces?: string } | undefined;

    const { searchParams } = new URL(request.url);
    const provincesQuery = searchParams.get('provinces');

    let whereClause = {};
    const targetProvincesStr = provincesQuery || (user?.role === 'FIELD' ? user?.assignedProvinces : undefined);

    if (targetProvincesStr) {
      const provinces = targetProvincesStr
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const allProvinces = ['Preah Vihear', 'Stung Treng', 'Ratanakiri', 'Mondolkiri'];
      if (provinces.length > 0 && provinces.length < 4 && !provinces.some((p) => p.toLowerCase() === 'all')) {
        // Map to exact casing in DB
        const matchedDbProvinces = allProvinces.filter((ap) =>
          provinces.some((p) => p.toLowerCase() === ap.toLowerCase())
        );
        whereClause = {
          province: { in: matchedDbProvinces.length > 0 ? matchedDbProvinces : provinces },
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
    let village;

    if (id) {
      village = await db.village.update({
        where: { id },
        data: {
          name: trimmedName,
          code: code || null,
          district: district || 'Chhaeb',
          province: province || 'Preah Vihear',
          status: status || 'ACTIVE',
        },
      });
    } else {
      village = await db.village.upsert({
        where: { name: trimmedName },
        update: {
          code: code || null,
          district: district || 'Chhaeb',
          province: province || 'Preah Vihear',
          status: status || 'ACTIVE',
        },
        create: {
          name: trimmedName,
          code: code || null,
          district: district || 'Chhaeb',
          province: province || 'Preah Vihear',
          status: status || 'ACTIVE',
        },
      });
    }

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: (userRole as 'ADMIN' | 'FIELD'),
        action: 'CONFIG',
        entityType: 'Village',
        entityId: village.id,
        details: JSON.stringify({ villageName: trimmedName, status: village.status }),
      },
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

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'CONFIG',
        entityType: 'Village',
        entityId: id,
        details: JSON.stringify({ action: 'DELETE_VILLAGE', villageId: id }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting village:', error);
    return NextResponse.json({ error: 'Failed to delete village.' }, { status: 500 });
  }
}
