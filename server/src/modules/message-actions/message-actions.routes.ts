import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { editMessage, deleteForEveryone, deleteForMe, react, unreact } from "./message-actions.controller.js";

const router = Router();

router.patch("/:id", authenticate, editMessage);
router.delete("/:id/everyone", authenticate, deleteForEveryone);
router.delete("/:id/me", authenticate, deleteForMe);
router.post("/:id/reactions", authenticate, react);
router.delete("/:id/reactions", authenticate, unreact);

export default router;
