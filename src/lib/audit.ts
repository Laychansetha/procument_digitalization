import { db } from './db';
import { Role } from '@prisma/client';

interface CreateAuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  userEmail,
  userName,
  userRole,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: CreateAuditLogParams) {
  try {
    let validUserId: string | null = null;

    if (userId) {
      const userById = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
      if (userById) {
        validUserId = userById.id;
      }
    }

    if (!validUserId && userEmail) {
      const userByEmail = await db.user.findUnique({ where: { email: userEmail }, select: { id: true, name: true, role: true } });
      if (userByEmail) {
        validUserId = userByEmail.id;
      }
    }

    if (!validUserId) {
      const fallbackUser = await db.user.findFirst({ select: { id: true, name: true, role: true } });
      if (fallbackUser) {
        validUserId = fallbackUser.id;
      }
    }

    if (!validUserId) {
      console.warn('logAudit: No user found in database to attach audit log.');
      return null;
    }

    const safeRole = (userRole as Role) || 'ADMIN';
    const safeDetails = details
      ? typeof details === 'string'
        ? details
        : JSON.stringify(details)
      : null;

    return await db.auditLog.create({
      data: {
        userId: validUserId,
        userName: userName || 'System User',
        userRole: safeRole,
        action,
        entityType,
        entityId,
        details: safeDetails,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('logAudit: Failed to write audit log entry (non-fatal):', error);
    return null;
  }
}
