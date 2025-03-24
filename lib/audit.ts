import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function addAuditLog(
  userId: string,
  action: string,
  details?: any,
  ipAddress?: string
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      details,
      ipAddress
    }
  });
}

export async function getAuditLogs(userId: string, limit = 10) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}