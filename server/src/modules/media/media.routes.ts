import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";
import { uploadMedia, getMedia } from "./media.controller.js";
import { createBackup, listBackups, downloadBackup, wipeMedia } from "./media.admin.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MEDIA_MAX_BYTES ?? 25 * 1024 * 1024) },
});

router.post("/", authenticate, upload.single("file"), uploadMedia);

// Admin-only storage management (spec section 20/35 — backup then wipe).
router.post("/admin/backup", authenticate, requirePermission("admin.settings.manage"), createBackup);
router.get("/admin/backups", authenticate, requirePermission("admin.settings.manage"), listBackups);
router.get("/admin/backups/:filename/download", authenticate, requirePermission("admin.settings.manage"), downloadBackup);
router.post("/admin/wipe", authenticate, requirePermission("admin.settings.manage"), wipeMedia);
router.get("/:id", authenticate, getMedia);

export default router;
