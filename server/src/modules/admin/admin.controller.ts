
import type {
  Request,
  Response,
} from "express";

import { adminService } from "./admin.service.js";
import { createPlanSchema, updatePlanSchema } from "../subscriptions/subscription.validation.js";

import { io } from "../../socket/socket.server.js";

// =====================================================
// USERS
// =====================================================

export async function getUsers(
  req: Request,
  res: Response
) {
  try {
    const rawPage = Number.parseInt(String(req.query.page ?? "1"), 10);
    const rawPageSize = Number.parseInt(String(req.query.pageSize ?? "10"), 10);
    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const pageSize = Number.isFinite(rawPageSize)
      ? Math.min(100, Math.max(5, rawPageSize))
      : 10;

    const result = await adminService.getUsers({ page, pageSize });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch users",
    });
  }
}

export async function getUser(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const user =
      await adminService.getUser(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "User not found",
    });
  }
}

export async function updateUserStatus(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { status } =
      req.body as {
        status?: string;
      };

    if (!status) {
      return res.status(400).json({
        success: false,
        message:
          "Status is required",
      });
    }

    const user =
      await adminService.updateUserStatus(
        req.params.id,
        status
      );

    return res.status(200).json({
      success: true,
      message:
        "User status updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update user status",
    });
  }
}



export async function forceLogoutUser(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Revoke the user's sessions/tokens first
    await adminService.forceLogoutUser(
      userId
    );

    // Notify all currently connected sockets
    io.to(`user:${userId}`).emit(
      "admin:force-logout",
      { userId }
    );

    return res.status(200).json({
      success: true,
      message:
        "User has been force logged out successfully",
    });
  } catch (error) {
    console.error(
      "Force logout error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to force logout user",
    });
  }
}

// =====================================================
// PLAN MANAGEMENT
// =====================================================

export async function getPlans(
  _req: Request,
  res: Response
) {
  try {
    const plans = await adminService.getPlansForAdmin();
    return res.status(200).json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error("Admin get plans error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch plans",
    });
  }
}

export async function createAdminPlan(
  req: Request,
  res: Response
) {
  try {
    const input = createPlanSchema.parse(req.body);
    const plan = await adminService.createPlan(input);
    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: { plan },
    });
  } catch (error) {
    console.error("Admin create plan error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create plan",
    });
  }
}

export async function updateAdminPlan(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input = updatePlanSchema.parse(req.body);
    const plan = await adminService.updatePlan(req.params.id, input);
    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: { plan },
    });
  } catch (error) {
    console.error("Admin update plan error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update plan",
    });
  }
}
