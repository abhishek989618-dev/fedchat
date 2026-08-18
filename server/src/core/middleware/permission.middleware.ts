import type {
  Request,
  Response,
  NextFunction
} from "express";

import { prisma } from "../../config/database.js";

export function requirePermission(
  permissionName: string
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.userId
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      const hasPermission =
        user.role.permissions.some(
          (rolePermission) =>
            rolePermission.permission.name ===
            permissionName
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Permission denied"
        });
      }

      next();
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Authorization check failed"
      });
    }
  };
}