
import {
  auditLogRepository,
} from "./audit-log.repository.js";

export const auditLogService = {
  // =====================================================
  // CREATE LOG
  // =====================================================

  async createLog(data: {
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    if (!data.action?.trim()) {
      throw new Error(
        "Audit action is required"
      );
    }

    if (!data.entity?.trim()) {
      throw new Error(
        "Audit entity is required"
      );
    }

    return auditLogRepository.create({
      ...data,

      action: data.action.trim(),
      entity: data.entity.trim(),
    });
  },

  // =====================================================
  // GET ALL
  // =====================================================

  async getLogs(filters?: {
    actorId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
  }) {
    return auditLogRepository.findAll(
      filters
    );
  },

  // =====================================================
  // GET ONE
  // =====================================================

  async getLog(id: string) {
    const log =
      await auditLogRepository.findById(
        id
      );

    if (!log) {
      throw new Error(
        "Audit log not found"
      );
    }

    return log;
  },

  // =====================================================
  // DELETE
  // =====================================================

  async deleteLog(id: string) {
    const log =
      await auditLogRepository.findById(
        id
      );

    if (!log) {
      throw new Error(
        "Audit log not found"
      );
    }

    await auditLogRepository.delete(id);

    return true;
  },

  // =====================================================
  // CLEANUP
  // =====================================================

  async deleteLogsOlderThan(
    days: number
  ) {
    if (
      !Number.isInteger(days) ||
      days <= 0
    ) {
      throw new Error(
        "Days must be a positive integer"
      );
    }

    const date = new Date();

    date.setDate(
      date.getDate() - days
    );

    return auditLogRepository.deleteOlderThan(
      date
    );
  },
};
