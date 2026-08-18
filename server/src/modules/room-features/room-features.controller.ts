import type { Request, Response } from "express";
import { roomFeaturesService } from "./room-features.service.js";

function userId(req: Request) {
  if (!req.userId) throw new Error("Unauthorized");
  return req.userId;
}

export async function getRoomFeatures(req: Request<{ roomId: string }>, res: Response) {
  try {
    const data = await roomFeaturesService.get(req.params.roomId, userId(req));
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(401).json({ success: false, message: error instanceof Error ? error.message : "Unauthorized" });
  }
}

export async function pinRoom(req: Request<{ roomId: string }>, res: Response) {
  const data = await roomFeaturesService.pin(req.params.roomId, userId(req), req.body?.value !== false);
  return res.json({ success: true, data });
}

export async function muteRoom(req: Request<{ roomId: string }>, res: Response) {
  const data = await roomFeaturesService.mute(req.params.roomId, userId(req), req.body?.value !== false);
  return res.json({ success: true, data });
}

export async function markRoomRead(req: Request<{ roomId: string }>, res: Response) {
  const data = await roomFeaturesService.markRead(req.params.roomId, userId(req));
  return res.json({ success: true, data });
}
