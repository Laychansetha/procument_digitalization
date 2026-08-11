import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const specs = await db.paddyPriceSpec.findMany({
      orderBy: [{ variety: 'asc' }, { grade: 'asc' }],
    });
    return NextResponse.json(specs);
  } catch (error) {
    console.error('Error fetching price specs:', error);
    return NextResponse.json({ error: 'Failed to fetch price specifications.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || (userRole !== 'ADMIN' && userRole !== 'FINANCE')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Finance role required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      variety,
      grade,
      basePrice,
      maxMoisture,
      maxForeignMatter,
      minWholeGrain,
      maxBrokenRice,
      impurity,
      moistureRange,
      status,
    } = body;

    if (!variety || !grade || basePrice === undefined) {
      return NextResponse.json({ error: 'Variety, Grade, and Base Price are required.' }, { status: 400 });
    }

    const trimmedVariety = variety.trim();
    const trimmedGrade = grade.trim();

    let priceSpec;

    if (id) {
      priceSpec = await db.paddyPriceSpec.update({
        where: { id },
        data: {
          variety: trimmedVariety,
          grade: trimmedGrade,
          basePrice: parseFloat(basePrice),
          maxMoisture: parseFloat(maxMoisture) || 14.0,
          maxForeignMatter: parseFloat(maxForeignMatter) || 5.0,
          minWholeGrain: minWholeGrain !== undefined && minWholeGrain !== '' ? parseFloat(minWholeGrain) : null,
          maxBrokenRice: maxBrokenRice !== undefined && maxBrokenRice !== '' ? parseFloat(maxBrokenRice) : null,
          impurity: impurity !== undefined && impurity !== '' ? parseFloat(impurity) : null,
          moistureRange: moistureRange || null,
          status: status || 'ACTIVE',
        },
      });
    } else {
      priceSpec = await db.paddyPriceSpec.upsert({
        where: {
          variety_grade: {
            variety: trimmedVariety,
            grade: trimmedGrade,
          },
        },
        update: {
          basePrice: parseFloat(basePrice),
          maxMoisture: parseFloat(maxMoisture) || 14.0,
          maxForeignMatter: parseFloat(maxForeignMatter) || 5.0,
          minWholeGrain: minWholeGrain !== undefined && minWholeGrain !== '' ? parseFloat(minWholeGrain) : null,
          maxBrokenRice: maxBrokenRice !== undefined && maxBrokenRice !== '' ? parseFloat(maxBrokenRice) : null,
          impurity: impurity !== undefined && impurity !== '' ? parseFloat(impurity) : null,
          moistureRange: moistureRange || null,
          status: status || 'ACTIVE',
        },
        create: {
          variety: trimmedVariety,
          grade: trimmedGrade,
          basePrice: parseFloat(basePrice),
          maxMoisture: parseFloat(maxMoisture) || 14.0,
          maxForeignMatter: parseFloat(maxForeignMatter) || 5.0,
          minWholeGrain: minWholeGrain !== undefined && minWholeGrain !== '' ? parseFloat(minWholeGrain) : null,
          maxBrokenRice: maxBrokenRice !== undefined && maxBrokenRice !== '' ? parseFloat(maxBrokenRice) : null,
          impurity: impurity !== undefined && impurity !== '' ? parseFloat(impurity) : null,
          moistureRange: moistureRange || null,
          status: status || 'ACTIVE',
        },
      });
    }

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: (userRole as 'ADMIN' | 'FINANCE'),
        action: 'CONFIG',
        entityType: 'PaddyPriceSpec',
        entityId: priceSpec.id,
        details: JSON.stringify({ variety: trimmedVariety, grade: trimmedGrade, basePrice }),
      },
    });

    return NextResponse.json(priceSpec, { status: 201 });
  } catch (error) {
    console.error('Error saving price spec:', error);
    return NextResponse.json({ error: 'Failed to save price specification.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Price Spec ID is required.' }, { status: 400 });
    }

    await db.paddyPriceSpec.delete({ where: { id } });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'CONFIG',
        entityType: 'PaddyPriceSpec',
        entityId: id,
        details: JSON.stringify({ action: 'DELETE_PRICE_SPEC', priceSpecId: id }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price spec:', error);
    return NextResponse.json({ error: 'Failed to delete price specification.' }, { status: 500 });
  }
}
