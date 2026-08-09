import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/admin/users — List all users for User Management
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedProvinces: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST /api/admin/users — Create new user account
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const adminId = (session?.user as { id?: string })?.id;

    if (!session || !adminId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, status, assignedProvinces } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Full Name, Username/Email, Password, and Role are required.' },
        { status: 400 }
      );
    }

    const usernameClean = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: usernameClean }, { name }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user account with this username or name already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const provStr = Array.isArray(assignedProvinces)
      ? assignedProvinces.join(',')
      : (assignedProvinces || 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri');

    const newUser = await db.user.create({
      data: {
        name,
        email: usernameClean,
        password: hashedPassword,
        role: role || 'FIELD',
        assignedProvinces: provStr,
        status: status || 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedProvinces: true,
        status: true,
        createdAt: true,
      },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'CREATE',
        entityType: 'UserAccount',
        entityId: newUser.id,
        details: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role, assignedProvinces: provStr }),
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 });
  }
}
