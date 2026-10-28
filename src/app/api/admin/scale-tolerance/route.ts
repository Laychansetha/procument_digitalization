import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

const DEFAULT_TOLERANCE = {
  acceptableKg: 300,
  warningKg: 500,
  criticalKg: 500,
};

export async function GET() {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: 'scale_tolerance' },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_TOLERANCE);
    }

    const parsed = JSON.parse(setting.value);
    return NextResponse.json({
      acceptableKg: parsed.acceptableKg ?? 300,
      warningKg: parsed.warningKg ?? 500,
      criticalKg: parsed.criticalKg ?? 500,
    });
  } catch (error) {
    console.error('Error fetching scale tolerance:', error);
    return NextResponse.json(DEFAULT_TOLERANCE);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const acceptableKg = Math.max(0, parseFloat(body.acceptableKg) || 300);
    const warningKg = Math.max(acceptableKg, parseFloat(body.warningKg) || 500);
    const criticalKg = Math.max(warningKg, parseFloat(body.criticalKg) || 500);

    const valuePayload = JSON.stringify({ acceptableKg, warningKg, criticalKg });

    const setting = await db.systemSetting.upsert({
      where: { key: 'scale_tolerance' },
      update: { value: valuePayload },
      create: { key: 'scale_tolerance', value: valuePayload },
    });

    await logAudit({
      userId,
      userName: session.user?.name || 'Admin',
      userRole: 'ADMIN',
      action: 'CONFIG',
      entityType: 'ScaleTolerance',
      entityId: setting.id,
      details: { acceptableKg, warningKg, criticalKg },
    });

    return NextResponse.json({
      success: true,
      acceptableKg,
      warningKg,
      criticalKg,
    });
  } catch (error) {
    console.error('Error updating scale tolerance:', error);
    return NextResponse.json({ error: 'Failed to save scale tolerance settings.' }, { status: 500 });
  }
}
