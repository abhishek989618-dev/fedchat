import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../../config/database.js";
import { rawPool } from "../../config/raw-db.js";

const MAX_BYTES = Number(process.env.MEDIA_MAX_BYTES ?? 25 * 1024 * 1024);
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/webm",
  "application/pdf", "text/plain", "application/zip",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const mediaService = {
  async save(userId: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (!ALLOWED.has(file.mimetype)) throw new Error("Unsupported media type");
    if (file.size > MAX_BYTES) throw new Error("Media file is too large");
    const dir = path.resolve(process.env.MEDIA_DIR ?? "uploads/media");
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(file.originalname).slice(0, 12);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const target = path.join(dir, storedName);
    await fs.writeFile(target, file.buffer);
    return prisma.mediaAsset.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName,
        path: target,
        mimeType: file.mimetype,
        size: file.size,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  },

  async findAccessible(mediaId: string, requestingUserId: string) {
    const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
    if (!media) return null;
    try {
      await fs.access(media.path);
    } catch {
      return null;
    }
    if (media.userId === requestingUserId) return media;

    const roomAccess = await rawPool.query(
      `SELECT 1
         FROM messages m
         JOIN room_members rm ON rm.room_id=m.room_id AND rm.user_id=$2
        WHERE m.content LIKE $1
        LIMIT 1`,
      [`%${mediaId}%`, requestingUserId],
    );
    if (roomAccess.rowCount) return media;

    // Status media is private as well, but authorized viewers must be able to
    // fetch it with the same authenticated media endpoint.
    const statusAccess = await rawPool.query(
      `SELECT 1
         FROM statuses s
        WHERE (s.media_url = $1 OR s.media_url LIKE $2)
          AND s.expires_at > NOW()
          AND (
            s.user_id=$3
            OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id=$3 AND c.contact_id=s.user_id)
            OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id=s.user_id AND c.contact_id=$3)
          )
        LIMIT 1`,
      [`/api/v1/media/${mediaId}`, `%${mediaId}%`, requestingUserId],
    );
    if (statusAccess.rowCount) return media;

    return null;
  },

  async cleanupExpired() {
    const expired = await prisma.mediaAsset.findMany({ where: { expiresAt: { lt: new Date() } }, select: { id: true, path: true } });
    for (const item of expired) await fs.rm(item.path, { force: true }).catch(() => undefined);
    if (expired.length) await prisma.mediaAsset.deleteMany({ where: { id: { in: expired.map((x) => x.id) } } });
    return expired.length;
  },
};
