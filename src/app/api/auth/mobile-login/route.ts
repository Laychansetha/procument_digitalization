import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required.' },
        { status: 400 }
      );
    }

    const usernameOrEmail = String(email).toLowerCase().trim();
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail },
          { name: usernameOrEmail },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account has been deactivated. Please contact System Admin.' },
        { status: 403 }
      );
    }

    // Role Enforcement: Mobile Field App requires FIELD role
    if (user.role !== 'FIELD') {
      return NextResponse.json(
        { error: `Access denied. Only Field Team accounts can access the Mobile Field App. (Your account role is ${user.role})` },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Update lastLogin timestamp
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (e) {
      console.error('Failed to update lastLogin:', e);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedProvinces: user.assignedProvinces || 'Preah Vihear',
      },
    });
  } catch (error: any) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
