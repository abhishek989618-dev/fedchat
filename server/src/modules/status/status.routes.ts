import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { rawPool } from "../../config/raw-db.js";

const r = Router();
r.use(authenticate);

const MAX_TEXT = 700;
const ALLOWED_MEDIA = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

async function canSeeStatus(statusId: string, viewerId: string) {
  const q = await rawPool.query(
    `SELECT 1
       FROM statuses s
      WHERE s.id=$1
        AND s.expires_at>NOW()
        AND (
          s.user_id=$2
          OR EXISTS (
            SELECT 1 FROM contacts c
             WHERE c.user_id=$2 AND c.contact_id=s.user_id
          )
          OR EXISTS (
            SELECT 1 FROM contacts c
             WHERE c.user_id=s.user_id AND c.contact_id=$2
          )
        )
      LIMIT 1`,
    [statusId, viewerId]
  );
  return Boolean(q.rowCount);
}

r.get('/', async (req, res) => {
  try {
    const q = await rawPool.query(
      `SELECT s.*,u.username,u.first_name,u.last_name,u.avatar,
              (SELECT COUNT(*)::int FROM status_views v WHERE v.status_id=s.id) AS view_count
         FROM statuses s
         JOIN users u ON u.id=s.user_id
        WHERE s.expires_at>NOW()
          AND (
            s.user_id=$1
            OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id=$1 AND c.contact_id=s.user_id)
            OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id=s.user_id AND c.contact_id=$1)
          )
        ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: { statuses: q.rows } });
  } catch (e) {
    res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Unable to load status updates" });
  }
});

r.post('/', async (req, res) => {
  try {
    const { content = "", mediaUrl = null, mediaType = null, expiresHours = 24 } = req.body || {};
    const cleanContent = typeof content === "string" ? content.trim().slice(0, MAX_TEXT) : "";
    const hours = Number(expiresHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) {
      return res.status(400).json({ success: false, message: "Status expiry must be between 1 and 24 hours" });
    }
    if (!cleanContent && !mediaUrl) {
      return res.status(400).json({ success: false, message: "Status content or media is required" });
    }
    if (mediaType && !ALLOWED_MEDIA.has(mediaType)) {
      return res.status(400).json({ success: false, message: "Unsupported status media type" });
    }
    const q = await rawPool.query(
      `INSERT INTO statuses(user_id,content,media_url,media_type,expires_at)
       VALUES($1,$2,$3,$4,NOW()+($5 || ' hours')::interval)
       RETURNING *`,
      [req.userId, cleanContent, typeof mediaUrl === "string" ? mediaUrl : null, mediaType || null, hours]
    );
    res.status(201).json({ success: true, data: { status: q.rows[0] } });
  } catch (e) {
    res.status(400).json({ success: false, message: e instanceof Error ? e.message : "Unable to create status" });
  }
});

r.post('/:id/view', async (req, res) => {
  try {
    if (!(await canSeeStatus(req.params.id, req.userId!))) {
      return res.status(404).json({ success: false, message: "Status not found" });
    }
    await rawPool.query(
      `INSERT INTO status_views(status_id,viewer_id)
       VALUES($1,$2)
       ON CONFLICT(status_id,viewer_id) DO UPDATE SET viewed_at=NOW()`,
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e instanceof Error ? e.message : "Unable to record status view" });
  }
});

r.get('/:id/views', async (req, res) => {
  try {
    const owns = await rawPool.query(`SELECT 1 FROM statuses WHERE id=$1 AND user_id=$2`, [req.params.id, req.userId]);
    if (!owns.rowCount) return res.status(403).json({ success: false, message: "Only the status owner can view this" });
    const q = await rawPool.query(
      `SELECT v.*,u.username,u.first_name,u.last_name,u.avatar
         FROM status_views v
         JOIN users u ON u.id=v.viewer_id
        WHERE v.status_id=$1
        ORDER BY v.viewed_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: { views: q.rows } });
  } catch (e) {
    res.status(500).json({ success: false, message: e instanceof Error ? e.message : "Unable to load viewers" });
  }
});

r.delete('/:id', async (req, res) => {
  try {
    const q = await rawPool.query(`DELETE FROM statuses WHERE id=$1 AND user_id=$2 RETURNING id`, [req.params.id, req.userId]);
    if (!q.rowCount) return res.status(404).json({ success: false, message: "Status not found" });
    await rawPool.query(`DELETE FROM status_views WHERE status_id=$1`, [req.params.id]).catch(() => undefined);
    res.json({ success: true, message: "Status deleted" });
  } catch (e) {
    res.status(400).json({ success: false, message: e instanceof Error ? e.message : "Unable to delete status" });
  }
});

export default r;

export async function cleanupExpiredStatuses() {
  const q = await rawPool.query(`DELETE FROM statuses WHERE expires_at<=NOW() RETURNING id`);
  if (q.rowCount) await rawPool.query(`DELETE FROM status_views WHERE status_id = ANY($1::uuid[])`, [q.rows.map((r) => r.id)]).catch(() => undefined);
  return q.rowCount ?? 0;
}
