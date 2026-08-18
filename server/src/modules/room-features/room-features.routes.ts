import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { roomFeaturesService } from "./room-features.service.js";
import { getRoomFeatures, pinRoom, muteRoom, markRoomRead } from "./room-features.controller.js";

const router = Router();

router.get("/:roomId", authenticate, getRoomFeatures);
router.patch("/:roomId/pin", authenticate, pinRoom);
router.patch("/:roomId/mute", authenticate, muteRoom);
router.post("/:roomId/read", authenticate, markRoomRead);

export default router;
