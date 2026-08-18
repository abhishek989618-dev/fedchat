import { Router } from "express";

import {
  register,
  login,
  refresh,
  logout,
  me
} from "./auth.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { authRateLimiter } from "../../core/middleware/rate-limit.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  register
);

router.post(
  "/login",
  authRateLimiter,
  login
);

router.post(
  "/refresh",
  refresh
);

router.post(
  "/logout",
  logout
);

router.get(
  "/me",
  authenticate,
  me
);

export default router;