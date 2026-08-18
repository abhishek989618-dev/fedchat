import type { Request, Response } from "express";
import { siteSettingsService } from "./site-settings.service.js";

export async function getSettings(_req: Request, res: Response) {
  const settings = await siteSettingsService.getAll();
  return res.json({ success: true, data: { settings } });
}

export async function getSetting(req: Request<{ key: string }>, res: Response) {
  const setting = await siteSettingsService.get(req.params.key);
  return res.json({ success: true, data: { setting } });
}

export async function setSetting(req: Request<{ key: string }>, res: Response) {
  try {
    const setting = await siteSettingsService.set(req.params.key, req.body?.value);
    return res.json({ success: true, message: "Setting saved", data: { setting } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to save setting",
    });
  }
}

export async function deleteSetting(req: Request<{ key: string }>, res: Response) {
  try {
    await siteSettingsService.remove(req.params.key);
    return res.json({ success: true, message: "Setting deleted" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete setting",
    });
  }
}
