import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const editingTransportId = searchParams.get('editingTransportId');

    const whereCondition: any = editingTransportId
      ? {
          OR: [
            { transportRecordId: null },
            { transportRecordId: editingTransportId },
          ],
        }
      : {
          transportRecordId: null,
          status: {
            in: ['PENDING', 'APPROVED'],
          },
        };

    const unassignedPurchases = await db.purchaseRecord.findMany({
      where: whereCondition,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(unassignedPurchases);
  } catch (error) {
    console.error('Error fetching unassigned purchase records:', error);
    return NextResponse.json({ error: 'Failed to fetch unassigned purchase records.' }, { status: 500 });
  }
}
