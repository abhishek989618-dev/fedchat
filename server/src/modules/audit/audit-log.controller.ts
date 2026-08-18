
import type {
  Request,
  Response,
} from "express";

import {
  auditLogService,
} from "./audit-log.service.js";

import {
  auditLogQuerySchema,
} from "./audit-log.validation.js";

// =====================================================
// GET ALL
// =====================================================

export async function getAuditLogs(
  req: Request,
  res: Response
) {
  try {
    const filters =
      auditLogQuerySchema.parse(
        req.query
      );

    const logs =
      await auditLogService.getLogs(
        filters
      );

    return res.status(200).json({
      success: true,

      data: {
        auditLogs: logs,
      },
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch audit logs",
    });
  }
}

// =====================================================
// GET ONE
// =====================================================

export async function getAuditLog(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const log =
      await auditLogService.getLog(
        req.params.id
      );

    return res.status(200).json({
      success: true,

      data: {
        auditLog: log,
      },
    });
  } catch (error) {
    console.error(
      "Get audit log error:",
      error
    );

    return res.status(404).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Audit log not found",
    });
  }
}

// =====================================================
// DELETE
// =====================================================

export async function deleteAuditLog(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    await auditLogService.deleteLog(
      req.params.id
    );

    return res.status(200).json({
      success: true,

      message:
        "Audit log deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete audit log error:",
      error
    );

    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to delete audit log",
    });
  }
}

