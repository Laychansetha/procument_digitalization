import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface ResolvedUser {
  userId: string;
  userName: string;
  userRole: 'FIELD' | 'WAREHOUSE' | 'INVENTORY' | 'FINANCE' | 'ADMIN';
  assignedProvinces?: string;
  email?: string;
}

async function resolveActiveUserFromHeaders(req: Request): Promise<ResolvedUser | null> {
  try {
    const headerUserId = req.headers.get('x-user-id')?.trim();
    const headerUserEmail = req.headers.get('x-user-email')?.trim();
    const headerUserName = req.headers.get('x-user-name')?.trim();

    if (headerUserId) {
      const dbUser = await db.user.findUnique({ where: { id: headerUserId } });
      if (dbUser && dbUser.status === 'ACTIVE') {
        return {
          userId: dbUser.id,
          userName: dbUser.name,
          userRole: dbUser.role,
          assignedProvinces: dbUser.assignedProvinces ?? undefined,
          email: dbUser.email,
        };
      }
    }

    if (headerUserEmail) {
      const dbUser = await db.user.findUnique({ where: { email: headerUserEmail.toLowerCase() } });
      if (dbUser && dbUser.status === 'ACTIVE') {
        return {
          userId: dbUser.id,
          userName: dbUser.name,
          userRole: dbUser.role,
          assignedProvinces: dbUser.assignedProvinces ?? undefined,
          email: dbUser.email,
        };
      }
    }

    if (headerUserName) {
      const dbUser = await db.user.findFirst({ where: { name: headerUserName, status: 'ACTIVE' } });
      if (dbUser) {
        return {
          userId: dbUser.id,
          userName: dbUser.name,
          userRole: dbUser.role,
          assignedProvinces: dbUser.assignedProvinces ?? undefined,
          email: dbUser.email,
        };
      }
    }
  } catch {
    // Header resolution error ignored
  }
  return null;
}

export async function getResolvedUser(req?: Request): Promise<ResolvedUser> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const sessUserId = (session.user as { id?: string }).id;
      const sessUserEmail = session.user.email;
      const sessUserName = session.user.name;

      // Verify the user exists and is active in the database by ID, Email, or Name
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

      if (dbUser && dbUser.status === 'ACTIVE') {
        return {
          userId: dbUser.id,
          userName: dbUser.name,
          userRole: dbUser.role,
          assignedProvinces: dbUser.assignedProvinces ?? undefined,
          email: dbUser.email,
        };
      }
    }
  } catch {
    // Session lookup skipped or failed
  }

  // Check custom headers passed by Mobile Field App during sync
  if (req) {
    const headerUser = await resolveActiveUserFromHeaders(req);
    if (headerUser) {
      return headerUser;
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
    throw new Error('Unauthorized: No active field user found in database.');
  }

  return {
    userId: fieldUser.id,
    userName: fieldUser.name,
    userRole: fieldUser.role,
    assignedProvinces: fieldUser.assignedProvinces ?? undefined,
    email: fieldUser.email,
  };
}

/**
 * Resolves the authenticated active user (from NextAuth session or Mobile Field App headers)
 * without falling back to an arbitrary user. Returns null if unauthenticated or inactive.
 */
export async function getSessionOrHeaderUser(req?: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return session.user as {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
      assignedProvinces?: string;
    };
  }

  if (req) {
    const headerUser = await resolveActiveUserFromHeaders(req);
    if (headerUser) {
      return {
        id: headerUser.userId,
        name: headerUser.userName,
        email: headerUser.email ?? null,
        role: headerUser.userRole,
        assignedProvinces: headerUser.assignedProvinces,
      };
    }
  }

  return null;
}
