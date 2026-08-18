
import type {
  Request,
  Response,
} from "express";

import { adminService } from "./admin.service.js";

import { io } from "../../socket/socket.server.js";

// =====================================================
// USERS
// =====================================================

export async function getUsers(
  _req: Request,
  res: Response
) {
  try {
    const users =
      await adminService.getUsers();

    return res.status(200).json({
      success: true,
      data: {
        users,
      },
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