import { Router } from "express";
import multer from "multer";
import { rawPool } from "../../config/raw-db.js";

import {
  getMe,
  getUserById,
  updateMe,
  changePassword,
  deleteMe,
  searchUsers,
  uploadProfileMedia
} from "./users.controller.js";

import {
  authenticate
} from "../../core/middleware/auth.middleware.js";
import {
  requirePermission
} from "../../core/middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

const profileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.get(
  "/search",
  searchUsers
);

router.get(
  "/me",
  getMe
);

router.post(
  "/me/profile-media",
  profileUpload.single("file"),
  uploadProfileMedia
);

router.patch(
  "/me",
  updateMe
);

router.patch(
  "/me/password",
  changePassword
);

router.delete(
  "/me",
  deleteMe
);

router.get("/me/preferences", async (req, res) => {
  try {
    const result = await rawPool.query(
      `SELECT theme, language FROM user_preferences WHERE user_id=$1 LIMIT 1`,
      [req.userId],
    );
    return res.json({ success: true, data: { preferences: result.rows[0] || { theme: null, language: "en" } } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load preferences" });
  }
});

router.patch("/me/preferences", async (req, res) => {
  const theme = req.body?.theme === "dark" ? "dark" : "light";
  const language = typeof req.body?.language === "string" && req.body.language.trim() ? req.body.language.trim().slice(0, 10) : "en";
  try {
    await rawPool.query(
      `INSERT INTO user_preferences (user_id, theme, language) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET theme=EXCLUDED.theme, language=EXCLUDED.language, updated_at=NOW()`,
      [req.userId, theme, language],
    );
    return res.json({ success: true, data: { preferences: { theme, language } } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to save preferences" });
  }
});

router.get(
  "/:id",
  requirePermission("users.read"),
  getUserById
);

export default router;