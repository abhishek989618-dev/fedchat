import { Router } from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../core/middleware/auth.middleware.js';
import { subscriptionService } from '../subscriptions/subscription.service.js';
import { createAccessToken, createRefreshToken } from '../../core/utils/jwt.js';
import { hashToken } from '../../core/utils/hash.js';
import { rawPool } from '../../config/raw-db.js';
import { createUserNotification } from '../notifications/notification.service.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

r.post('/groups/:roomId/invite', authenticate, async (req, res) => {
  try {
    await subscriptionService.ensurePaidFeature(req.userId!);
    const createdById = req.userId;
    if (!createdById) return res.status(400).json({ success: false, message: 'createdById is required' });
    const member = await rawPool.query('SELECT 1 FROM rooms WHERE id=$1 AND created_by_id=$2', [req.params.roomId, createdById]);
    if (!member.rowCount) return res.status(403).json({ success: false, message: 'Only the group owner can create a public invite' });
    const token = crypto.randomBytes(24).toString('hex');
    const q = await rawPool.query('INSERT INTO group_invites(room_id,token,created_by_id) VALUES($1,$2,$3) RETURNING *', [req.params.roomId, token, createdById]);
    res.status(201).json({ success: true, data: { invite: q.rows[0], joinPath: `/join/${token}` } });
  } catch (e) {
    res.status(400).json({ success: false, message: e instanceof Error ? e.message : 'Unable to create invite' });
  }
});

r.post('/join/:token', async (req, res) => {
  const client = await rawPool.connect();
  try {
    await client.query('BEGIN');

    const setting = await client.query('SELECT value FROM site_settings WHERE key=$1 LIMIT 1', ['site.guestJoinEnabled']);
    if (setting.rowCount) {
      const raw = setting.rows[0]?.value;
      const enabled = raw === true || raw === 'true' || raw?.value === true;
      if (!enabled) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Guest joining is currently disabled by the platform administrator.', code: 'GUEST_JOIN_DISABLED' });
      }
    }

    const invite = await client.query('SELECT * FROM group_invites WHERE token=$1 AND is_active=true AND (expires_at IS NULL OR expires_at>NOW())', [req.params.token]);
    if (!invite.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Invite is invalid or expired' });
    }

    const roomId = invite.rows[0].room_id;
    const room = await client.query('SELECT id, name, created_by_id FROM rooms WHERE id=$1', [roomId]);
    if (!room.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Group no longer exists' });
    }

    const ownerSub = await client.query(`SELECT p.max_members_per_group,p.max_guests_per_group
      FROM subscriptions s JOIN subscription_plans p ON p.id=s."planId"
      WHERE s."userId"=$1 AND s."isActive"=true AND s."startsAt"<=NOW() AND s."expiresAt">NOW()
      ORDER BY s."createdAt" DESC LIMIT 1`, [room.rows[0].created_by_id]);

    const maxMembers = ownerSub.rows[0]?.max_members_per_group;
    const maxGuests = ownerSub.rows[0]?.max_guests_per_group;

    if (typeof maxGuests === 'number') {
      const guestCount = await client.query('SELECT COUNT(*)::int AS n FROM guest_sessions WHERE room_id=$1 AND expires_at>NOW()', [roomId]);
      if (guestCount.rows[0].n >= maxGuests) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: "This group has reached its guest limit for the owner's plan.", code: 'GROUP_GUEST_LIMIT_REACHED' });
      }
    }

    if (typeof maxMembers === 'number') {
      const count = await client.query('SELECT COUNT(*)::int AS n FROM room_members WHERE room_id=$1', [roomId]);
      if (count.rows[0].n >= maxMembers) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: "This group has reached its member limit for the owner's plan.", code: 'GROUP_MEMBER_LIMIT_REACHED' });
      }
    }

    // A few older production installations were deployed without running the seed.
    // Create the guest role lazily so public invites never depend on seed state.
    const role = await client.query(`INSERT INTO roles(id,name,description,created_at,updated_at)
      VALUES(gen_random_uuid(),'guest','Temporary public group guest',NOW(),NOW())
      ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description
      RETURNING id`);
    const guestRoleId = role.rows[0].id;

    const username = `guest_${crypto.randomBytes(4).toString('hex')}`;
    const email = `${username}@guest.fedchat.local`;
    const plainPassword = crypto.randomBytes(10).toString('hex');
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const guestUserId = crypto.randomUUID();
    const user = await client.query(`INSERT INTO users(id,email,username,password_hash,first_name,last_name,role_id,created_at,updated_at)
      VALUES($1,$2,$3,$4,'Guest','User',$5,NOW(),NOW()) RETURNING id,username,email`, [guestUserId, email, username, passwordHash, guestRoleId]);
    const userId = user.rows[0].id;

    const sessionId = crypto.randomUUID();
    const refreshToken = createRefreshToken(userId, sessionId);
    await client.query("INSERT INTO user_sessions(id,user_id,refresh_token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '2 days')", [sessionId, userId, hashToken(refreshToken)]);
    const accessToken = createAccessToken(userId);

    await client.query('INSERT INTO room_members(room_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [roomId, userId]);
    await client.query("INSERT INTO guest_sessions(user_id,room_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '2 days') ON CONFLICT DO NOTHING", [userId, roomId]);
    await client.query('COMMIT');

    const existing = await rawPool.query('SELECT user_id FROM room_members WHERE room_id=$1 AND user_id<>$2', [roomId, userId]);
    await Promise.all(existing.rows.map((m: any) => createUserNotification(m.user_id, {
      title: 'Guest joined your group',
      message: `${username} joined using the public link.`,
      type: 'group_guest_join'
    }).catch(() => undefined)));

    return res.status(201).json({
      success: true,
      data: {
        guest: { id: userId, username, email, password: plainPassword, expiresAt: new Date(Date.now() + 2 * 86400000) },
        accessToken,
        refreshToken,
        roomId,
        roomName: room.rows[0].name,
      }
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Guest join failed:', e);
    return res.status(400).json({ success: false, message: e instanceof Error ? e.message : 'Unable to join group as guest' });
  } finally {
    client.release();
  }
});

r.post('/groups/:roomId/import', authenticate, upload.single('file'), async (req, res) => {
  try {
    await subscriptionService.ensurePaidFeature(req.userId!);
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });
    const isMember = await rawPool.query('SELECT 1 FROM room_members WHERE room_id=$1 AND user_id=$2', [req.params.roomId, req.userId]);
    if (!isMember.rowCount) return res.status(403).json({ success: false, message: 'Only a group member can import contacts' });
    const room = await rawPool.query('SELECT created_by_id FROM rooms WHERE id=$1', [req.params.roomId]);
    const ownerSub = await rawPool.query(`SELECT p.max_members_per_group FROM subscriptions s JOIN subscription_plans p ON p.id=s."planId"
      WHERE s."userId"=$1 AND s."isActive"=true AND s."startsAt"<=NOW() AND s."expiresAt">NOW()
      ORDER BY s."createdAt" DESC LIMIT 1`, [room.rows[0]?.created_by_id]);
    const maxMembers = ownerSub.rows[0]?.max_members_per_group;
    const lines = req.file.buffer.toString('utf8').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const rows = lines[0]?.toLowerCase().includes('email') ? lines.slice(1) : lines;
    const created: any[] = [];
    let skippedForLimit = 0;
    for (const line of rows) {
      if (typeof maxMembers === 'number') {
        const count = await rawPool.query('SELECT COUNT(*)::int AS n FROM room_members WHERE room_id=$1', [req.params.roomId]);
        if (count.rows[0].n >= maxMembers) { skippedForLimit = rows.length - created.length; break; }
      }
      const [emailRaw, firstNameRaw, lastNameRaw] = line.split(',').map(x => x.trim());
      const email = emailRaw?.toLowerCase();
      if (!email) continue;
      const existing = await rawPool.query('SELECT id,username FROM users WHERE email=$1', [email]);
      let user = existing.rows[0];
      if (!user) {
        const role = await rawPool.query(`INSERT INTO roles(id,name,description,created_at,updated_at) VALUES(gen_random_uuid(),'guest','Temporary public group guest',NOW(),NOW()) ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description RETURNING id`);
        const username = `guest_${crypto.randomBytes(4).toString('hex')}`;
        const password = crypto.randomBytes(10).toString('hex');
        const hash = await bcrypt.hash(password, 10);
        const guestUserId = crypto.randomUUID();
        const q = await rawPool.query(`INSERT INTO users(id,email,username,password_hash,first_name,last_name,role_id,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING id,username`, [guestUserId, email, username, hash, firstNameRaw || 'Guest', lastNameRaw || 'User', role.rows[0].id]);
        user = { ...q.rows[0], temporaryPassword: password };
        await rawPool.query(`INSERT INTO guest_sessions(user_id,room_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '2 days') ON CONFLICT DO NOTHING`, [user.id, req.params.roomId]);
      }
      await rawPool.query('INSERT INTO room_members(room_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.params.roomId, user.id]);
      created.push(user);
    }
    res.status(201).json({ success: true, data: { count: created.length, guests: created, skippedForLimit } });
  } catch (e) {
    res.status(400).json({ success: false, message: e instanceof Error ? e.message : 'Unable to import guests' });
  }
});

export default r;
