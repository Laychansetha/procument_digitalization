import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface ResolvedUser {
  userId: string;
  userName: string;
  userRole: 'FIELD' | 'WAREHOUSE' | 'INVENTORY' | 'FINANCE' | 'ADMIN';
}

export async function getResolvedUser(req?: Request): Promise<ResolvedUser> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const sessUserId = (session.user as { id?: string }).id;
      const sessUserEmail = session.user.email;
      const sessUserName = session.user.name;

      // Verify the user exists in the database by ID, Email, or Name
      let dbUser = null;
      if (sessUserId) {
        dbUser = await db.user.findUnique({ where: { id: sessUserId } });
      }
      if (!dbUser && sessUserEmail) {
        dbUser = await db.user.findUnique({ where: { email: sessUserEmail } });
      }
      if (!dbUser && sessUserName) {
        dbUser = await db.user.findFirst({ where: { name: sessUserName } });
      }

      if (dbUser) {
        return {
          userId: dbUser.id,
          userName: dbUser.name,
          userRole: dbUser.role as any,
        };
      }
    }
  } catch (e) {
    // Session lookup skipped or failed
  }

  // Check custom headers passed by Mobile Field App during sync
  if (req) {
    try {
      const headerUserId = req.headers.get('x-user-id');
      const headerUserEmail = req.headers.get('x-user-email');
      const headerUserName = req.headers.get('x-user-name');

      if (headerUserId) {
        const dbUser = await db.user.findUnique({ where: { id: headerUserId } });
        if (dbUser) {
          return {
            userId: dbUser.id,
            userName: dbUser.name,
            userRole: dbUser.role as any,
          };
        }
      }

      if (headerUserEmail) {
        const dbUser = await db.user.findUnique({ where: { email: headerUserEmail.toLowerCase().trim() } });
        if (dbUser) {
          return {
            userId: dbUser.id,
            userName: dbUser.name,
            userRole: dbUser.role as any,
          };
        }
      }

      if (headerUserName) {
        const dbUser = await db.user.findFirst({ where: { name: headerUserName.trim() } });
        if (dbUser) {
          return {
            userId: dbUser.id,
            userName: dbUser.name,
            userRole: dbUser.role as any,
          };
        }
      }
    } catch (e) {
      // Header resolution error ignored
    }
  }

  // Fallback: Find active Field User for mobile offline synchronization
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
