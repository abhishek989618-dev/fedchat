import type { Request, Response } from "express";
import { messageActionsService } from "./message-actions.service.js";

export async function editMessage(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const message = await messageActionsService.edit(req.params.id, req.userId, req.body?.content ?? "");
    return res.json({ success: true, message: "Message edited", data: { message } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to edit message" });
  }
}

export async function deleteForEveryone(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const message = await messageActionsService.deleteForEveryone(req.params.id, req.userId);
    return res.json({ success: true, message: "Message deleted for everyone", data: { message } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete message" });
  }
}

export async function deleteForMe(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    await messageActionsService.deleteForMe(req.params.id, req.userId);
    return res.json({ success: true, message: "Message deleted for you" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete message" });
  }
}

export async function react(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await messageActionsService.react(req.params.id, req.userId, req.body?.reaction ?? "");
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to react" });
  }
}

export async function unreact(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    await messageActionsService.unreact(req.params.id, req.userId, req.body?.reaction ?? "");
    return res.json({ success: true, message: "Reaction removed" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to remove reaction" });
  }
}
