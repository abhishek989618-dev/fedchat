import type { Request, Response } from "express";
import { createReadStream } from "node:fs";
import { mediaService } from "./media.service.js";

export async function getMedia(req: Request, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const mediaId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const media = await mediaService.findAccessible(mediaId, req.userId);
    if (!media) {
      // Same response whether the asset is missing or the caller lacks
      // access, so this endpoint can't be used to enumerate other users'
      // media IDs.
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    res.setHeader("Content-Type", media.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(media.originalName)}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    const stream = createReadStream(media.path);
    stream.on("error", () => {
      if (!res.headersSent) res.status(404).json({ success: false, message: "Media not found" });
    });
    stream.pipe(res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to load media",
    });
  }
}

export async function uploadMedia(req: Request, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ success: false, message: "File is required" });

    const media = await mediaService.save(req.userId, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });

    return res.status(201).json({ success: true, data: { media } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Media upload failed",
    });
  }
}