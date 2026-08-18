import type { Request, Response } from "express";
import { moderationService } from "./moderation.service.js";

export async function banUser(req: Request<{ id: string }>, res: Response) {
  try {
    const user = await moderationService.banUser(req.params.id);
    return res.json({ success: true, message: "User banned successfully", data: { user } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to ban user",
    });
  }
}

export async function unbanUser(req: Request<{ id: string }>, res: Response) {
  try {
    const user = await moderationService.unbanUser(req.params.id);
    return res.json({ success: true, message: "User unbanned successfully", data: { user } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to unban user",
    });
  }
}

export async function forceLogout(req: Request<{ id: string }>, res: Response) {
  try {
    const result = await moderationService.forceLogout(req.params.id);
    return res.json({ success: true, message: "User sessions revoked", data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to force logout",
    });
  }
}
