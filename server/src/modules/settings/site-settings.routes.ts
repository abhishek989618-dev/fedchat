import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";
import { getSettings, getSetting, setSetting, deleteSetting } from "./site-settings.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("admin.settings.read"), getSettings);
router.get("/:key", authenticate, requirePermission("admin.settings.read"), getSetting);
router.put("/:key", authenticate, requirePermission("admin.settings.manage"), setSetting);
router.delete("/:key", authenticate, requirePermission("admin.settings.manage"), deleteSetting);

export default router;
