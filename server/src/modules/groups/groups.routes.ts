import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { createGroup, listGroups, addGroupMember, removeGroupMember, getGroupMembers, updateGroup, uploadGroupMedia } from "./groups.controller.js";

const router = Router();

router.get("/", authenticate, listGroups);
const groupUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", authenticate, createGroup);
router.patch("/:id", authenticate, updateGroup);
router.post("/:id/profile-media", authenticate, groupUpload.single("file"), uploadGroupMedia);
router.get("/:id/members", authenticate, getGroupMembers);
router.post("/:id/members", authenticate, addGroupMember);
router.delete("/:id/members/:userId", authenticate, removeGroupMember);

export default router;
