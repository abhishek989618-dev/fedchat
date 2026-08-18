
import { redis } from "../config/redis.js";

const PRESENCE_PREFIX =
  "fedchat:presence:";

const PRESENCE_TTL = 60;

function presenceKey(
  userId: string
) {
  return `${PRESENCE_PREFIX}${userId}`;
}

export async function setUserOnline(
  userId: string
) {
  await redis.set(
    presenceKey(userId),
    "online",
    "EX",
    PRESENCE_TTL
  );
}

export async function refreshUserPresence(
  userId: string
) {
  await redis.expire(
    presenceKey(userId),
    PRESENCE_TTL
  );
}

export async function setUserOffline(
  userId: string
) {
  await redis.del(
    presenceKey(userId)
  );
}

export async function isUserOnline(
  userId: string
) {
  const status =
    await redis.get(
      presenceKey(userId)
    );

  return status === "online";
}

