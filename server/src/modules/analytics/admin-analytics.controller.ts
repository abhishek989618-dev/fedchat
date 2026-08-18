import type { Request, Response } from "express";
import { adminAnalyticsService } from "./admin-analytics.service.js";

export async function getDashboardAnalytics(_req: Request, res: Response) {
  try {
    const analytics = await adminAnalyticsService.dashboard();
    return res.json({ success: true, data: { analytics } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to load analytics",
    });
  }
}
