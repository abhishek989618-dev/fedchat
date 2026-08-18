
import {prisma} from "../../config/database.js";

export const auditLogRepository = {
  // =====================================================
  // CREATE
  // =====================================================

  async create(data: {
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId,

        action: data.action,
        entity: data.entity,
        entityId: data.entityId,

        oldValue:
          data.oldValue === undefined
            ? undefined
            : (data.oldValue as object),

        newValue:
          data.newValue === undefined
            ? undefined
            : (data.newValue as object),

        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  },

  // =====================================================
  // FIND ALL
  // =====================================================

  async findAll(filters?: {
    actorId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
  }) {
    return prisma.auditLog.findMany({
      where: {
        actorId: filters?.actorId,
        action: filters?.action,
        entity: filters?.entity,
        entityId: filters?.entityId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // =====================================================
  // FIND BY ID
  // =====================================================

  async findById(id: string) {
    return prisma.auditLog.findUnique({
      where: {
        id,
      },
    });
  },

  // =====================================================
  // DELETE
  // =====================================================

  async delete(id: string) {
    return prisma.auditLog.delete({
      where: {
        id,
      },
    });
  },

  // =====================================================
  // DELETE OLD LOGS
  // =====================================================

  async deleteOlderThan(date: Date) {
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  },
};

