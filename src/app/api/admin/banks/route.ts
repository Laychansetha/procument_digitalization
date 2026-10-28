import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const banks = await db.bank.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(banks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ error: 'Failed to fetch banks.' }, { status: 500 });
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
    const { id, name, code, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Bank name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    let bank;

    if (id) {
      bank = await db.bank.update({
        where: { id },
        data: {
          name: trimmedName,
          code: code || '',
          status: status || 'ACTIVE',
        },
      });
    } else {
      bank = await db.bank.upsert({
        where: { name: trimmedName },
        update: {
          code: code || '',
          status: status || 'ACTIVE',
        },
        create: {
          name: trimmedName,
          code: code || '',
          status: status || 'ACTIVE',
        },
      });
    }

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: userRole as 'ADMIN' | 'FINANCE',
      action: 'CONFIG',
      entityType: 'Bank',
      entityId: bank.id,
      details: { bankName: trimmedName, code: bank.code },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error('Error saving bank:', error);
    return NextResponse.json({ error: 'Failed to save bank.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Bank ID is required.' }, { status: 400 });
    }

    await db.bank.delete({ where: { id } });

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: 'ADMIN',
      action: 'CONFIG',
      entityType: 'Bank',
      entityId: id,
      details: { action: 'DELETE_BANK', bankId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank:', error);
    return NextResponse.json({ error: 'Failed to delete bank.' }, { status: 500 });
  }
}
