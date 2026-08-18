import { Router } from "express";
import multer from "multer";

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

router.get(
  "/:id",
  requirePermission("users.read"),
  getUserById
);

export default router;