import type { Request, Response } from "express";
import { mediaBackupService } from "./media.backup.js";

export async function createBackup(req: Request, res: Response) {
  try {
    const result = await mediaBackupService.createBackup();
    return res.status(201).json({ success: true, message: "Media backup created", data: { backup: result } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Backup failed" });
  }
}

export async function listBackups(_req: Request, res: Response) {
  try {
    const backups = await mediaBackupService.listBackups();
    return res.json({ success: true, data: { backups } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to list backups" });
  }
}

export async function downloadBackup(req: Request<{ filename: string }>, res: Response) {
  try {
    const exists = await mediaBackupService.backupExists(req.params.filename);
    if (!exists) return res.status(404).json({ success: false, message: "Backup not found" });
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
    mediaBackupService.streamBackup(req.params.filename).pipe(res);
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Invalid backup file" });
  }
}

export async function wipeMedia(req: Request, res: Response) {
  try {
    const backupFile = typeof req.body?.backupFile === "string" ? req.body.backupFile : "";
    if (!backupFile) {
      return res.status(400).json({ success: false, message: "backupFile is required — create a backup first and pass its filename to confirm." });
    }
    const result = await mediaBackupService.wipeAllMedia(backupFile);
    return res.json({ success: true, message: `Wiped ${result.wiped} media file(s) after verified backup`, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Wipe failed" });
  }
}
