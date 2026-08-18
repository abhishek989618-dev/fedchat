import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../../config/redis.js";

function createRedisStore(prefix: string) {
  return new RedisStore({
    prefix,
    sendCommand: async (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as Promise<any>,
  });
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("fedchat:rl:api:v2:"),
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Authentication is deliberately limited by IP + submitted email instead of
// putting every /auth endpoint behind one shared bucket. Successful logins do
// not consume the failure budget, and refresh/me/logout never hit this limiter.
export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "anonymous";
    return `${ipKeyGenerator(req.ip ?? "unknown")}:${email}`;
  },
  store: createRedisStore("fedchat:rl:auth:v2:"),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many failed authentication attempts. Please wait a few minutes and try again.",
    });
  },
});
