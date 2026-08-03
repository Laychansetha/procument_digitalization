import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface ResolvedUser {
  userId: string;
  userName: string;
  userRole: 'FIELD' | 'WAREHOUSE' | 'FINANCE' | 'ADMIN';
}

export async function getResolvedUser(): Promise<ResolvedUser> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as { id?: string }).id) {
      return {
        userId: (session.user as { id: string }).id,
        userName: session.user.name || 'Web User',
        userRole: ((session.user as { role?: any }).role || 'FIELD') as any,
      };
    }
  } catch (e) {
    // Session lookup skipped or failed
  }

  // Fallback: Find or create system Field User for mobile offline synchronization
  let fieldUser = await db.user.findFirst({
    where: { role: 'FIELD', status: 'ACTIVE' },
  });

  if (!fieldUser) {
    fieldUser = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  }

  if (!fieldUser) {
    fieldUser = await db.user.create({
      data: {
        name: 'Mobile Field Inspector',
        email: 'field.mobile@ibisrice.org',
        password: '$2a$10$e8w4G2X0tXm7P5Q1wYnNveO8e7wQ5d4v3c2b1a0z9y8x7w6v5u4t3',
        role: 'FIELD',
        status: 'ACTIVE',
      },
    });
  }

  return {
    userId: fieldUser.id,
    userName: fieldUser.name,
    userRole: fieldUser.role as any,
  };
}
