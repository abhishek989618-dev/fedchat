import IORedisModule from "ioredis";

const Redis = (IORedisModule as any).default ?? IORedisModule;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (error: Error) => {
  console.error("Redis connection error:", error);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});
