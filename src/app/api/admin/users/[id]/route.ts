import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT /api/admin/users/[id] — Edit user account, reset password, update assignedProvinces
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const adminId = (session?.user as { id?: string })?.id;

    if (!session || !adminId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, status, assignedProvinces } = body;

    const existing = await db.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (assignedProvinces !== undefined) {
      updateData.assignedProvinces = Array.isArray(assignedProvinces)
        ? assignedProvinces.join(',')
        : String(assignedProvinces);
    }
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedProvinces: true,
        status: true,
        updatedAt: true,
      },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'UPDATE',
        entityType: 'UserAccount',
        entityId: id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData).filter((k) => k !== 'password'),
          resetPassword: Boolean(password),
        }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user account.' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Delete user account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    const adminId = (session?.user as { id?: string })?.id;

    if (!session || !adminId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;

    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own active Admin account.' }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    await db.user.delete({
      where: { id },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userName: session.user?.name || 'Admin',
        userRole: 'ADMIN',
        action: 'DELETE',
        entityType: 'UserAccount',
        entityId: id,
        details: JSON.stringify({ name: existing.name, email: existing.email, role: existing.role }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user account.' }, { status: 500 });
  }
}
