
import "dotenv/config";
import path from "node:path";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { prisma } from "./config/database.js";
import { redis } from "./config/redis.js";
import { closeRawPool } from "./config/raw-db.js";
import apiRouter from "./routes.js";
import { apiRateLimiter } from "./core/middleware/rate-limit.js";

import {
  initializeSocket,
  io,
} from "./socket/socket.server.js";

import {
  requestId,
  noStoreForPrivateApi,
  securityHeaders,
} from "./core/middleware/production-hardening.js";

const app = express();

// FedChat may sit behind Cloudflare, Railway, a reverse proxy, or a local tunnel.
// Trust the first proxy hop so Express and express-rate-limit use the real client IP
// instead of treating X-Forwarded-For as a spoofed header.
app.set('trust proxy', 1);

const PORT =
  Number(process.env.PORT) || 4000;

// =====================================================
// SECURITY
// =====================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// =====================================================
// BODY PARSING
// =====================================================

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

// =====================================================
// PRODUCTION HARDENING
// =====================================================

app.use(requestId);
app.use(noStoreForPrivateApi);
app.use(securityHeaders);

// =====================================================
// LOGGING
// =====================================================

app.use(morgan("dev"));
app.use("/api/v1", apiRateLimiter);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      await redis.ping();

      return res.status(200).json({
        success: true,
        message:
          "FedChat API is running",
        database: "connected",
        redis: "connected",
        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Health check failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Service connection failed",
      });
    }
  }
);

app.use("/api/v1", apiRouter);

// =====================================================
// START HTTP SERVER
// =====================================================

const server = app.listen(
  PORT,
  () => {
    console.log(
      `FedChat API running on http://localhost:${PORT}`
    );
  }
);

// =====================================================
// SOCKET.IO
// =====================================================

initializeSocket(server);

// Expire temporary guest accounts/sessions. The database remains the source
// of truth, so this also covers guests that never reconnect through Socket.IO.
const guestCleanup = setInterval(async () => {
  try {
    const { rawPool } = await import("./config/raw-db.js");
    await rawPool.query(`UPDATE users SET status='SUSPENDED', updated_at=NOW() WHERE id IN (SELECT user_id FROM guest_sessions WHERE expires_at <= NOW()) AND role_id = (SELECT id FROM roles WHERE name='guest')`);
    await rawPool.query(`DELETE FROM guest_sessions WHERE expires_at <= NOW()`);
  } catch (error) {
    console.error("Guest cleanup failed:", error);
  }
}, 60_000);

// Deactivate subscriptions past their expiry date so plan-gated features
// (groups, communities, guest limits) stop applying immediately, instead of
// only at the next time the user happens to trigger a subscription lookup.
const statusCleanup = setInterval(async () => {
  try {
    const { cleanupExpiredStatuses } = await import("./modules/status/status.routes.js");
    await cleanupExpiredStatuses();
  } catch (error) {
    console.error("Status cleanup failed:", error);
  }
}, 60 * 60_000);

const subscriptionExpiryCheck = setInterval(async () => {
  try {
    const { subscriptionService } = await import("./modules/subscriptions/subscription.service.js");
    await subscriptionService.deactivateExpiredSubscriptions();
  } catch (error) {
    console.error("Subscription expiry check failed:", error);
  }
}, 5 * 60_000);

// Remove media assets past their retention window (30 days by default).
// This was previously defined but never scheduled anywhere.
const mediaCleanup = setInterval(async () => {
  try {
    const { mediaService } = await import("./modules/media/media.service.js");
    await mediaService.cleanupExpired();
  } catch (error) {
    console.error("Media cleanup failed:", error);
  }
}, 60 * 60_000);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================


async function shutdown(
  signal?: string
) {
  console.log(
    `Shutting down${
      signal ? ` (${signal})` : ""
    }...`
  );

  try {
    // ==========================================
    // STOP NEW HTTP CONNECTIONS
    // ==========================================

    await new Promise<void>(
      (resolve) => {
        server.close(() => {
          resolve();
        });
      }
    );

    // ==========================================
    // CLOSE SOCKET.IO
    // ==========================================

    if (io) {
      await new Promise<void>(
        (resolve) => {
          io.close(() => {
            resolve();
          });
        }
      );
    }

    // ==========================================
    // CLOSE REDIS
    // ==========================================

    try {
      await redis.quit();
    } catch (error) {
      console.error(
        "Redis shutdown error:",
        error
      );
    }

    clearInterval(guestCleanup);
    clearInterval(subscriptionExpiryCheck);
    clearInterval(mediaCleanup);

    // ==========================================
    // CLOSE RAW FEATURE POOL
    // ==========================================

    await closeRawPool();

    // ==========================================
    // CLOSE PRISMA
    // ==========================================

    await prisma.$disconnect();

    console.log(
      "FedChat shutdown complete."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Shutdown error:",
      error
    );

    process.exit(1);
  }
}


process.on(
  "SIGINT",
  () => {
    void shutdown("SIGINT");
  }
);

process.on(
  "SIGTERM",
  () => {
    void shutdown("SIGTERM");
  }
);

