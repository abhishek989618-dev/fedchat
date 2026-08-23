import { Router } from "express";
import { siteSettingsService } from "./site-settings.service.js";

const router = Router();

const DEFAULTS: Record<string, unknown> = {
  "site.name": "FedChat",
  "site.tagline": "Private conversations, live.",
  "site.description": "Secure real-time conversations, groups and communities.",
  "site.supportEmail": "",
  "site.guestJoinEnabled": true,
  "site.registrationEnabled": true,
  "site.maintenanceMode": false,
  "site.primaryColor": "#168a57",
  "site.accentColor": "#1da968",
  "site.logoUrl": "",
  "site.faviconUrl": "",
  "site.language": "en",
  "site.alertLanguage": "en",
  "site.theme": "light",
};

router.get("/", async (_req, res) => {
  try {
    const settings = await siteSettingsService.getAll();
    const values: Record<string, unknown> = { ...DEFAULTS };
    for (const setting of settings) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, setting.key)) values[setting.key] = setting.value;
    }
    return res.json({ success: true, data: { settings: values } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load site settings" });
  }
});

export default router;
