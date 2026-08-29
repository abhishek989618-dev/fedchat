import { Router } from "express";
import { rawPool } from "../../config/raw-db.js";

const router = Router();

function parseBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    return value.toLowerCase() === "true";
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "boolean"
  ) {
    return Boolean(
      (value as { value: boolean }).value
    );
  }

  return fallback;
}

/**
 * Public directory of discoverable groups.
 *
 * A group is listed only when:
 * - it is a GROUP room;
 * - it is not private;
 * - its owner has an active subscription;
 * - the owner's subscription has FULL access;
 * - the owner's plan is Pro/Professional;
 * - it has an active, non-expired public invite.
 *
 * No authentication middleware is used here because this endpoint
 * is intentionally consumed by the unauthenticated public landing page.
 */
router.get("/", async (_req, res) => {
  try {
    const setting = await rawPool.query(
      `
      SELECT value
      FROM site_settings
      WHERE key = $1
      LIMIT 1
      `,
      ["site.guestJoinEnabled"],
    )

    const guestJoinEnabled = parseBoolean(
      setting.rows[0]?.value,
      true,
    )

    if (!guestJoinEnabled) {
      return res.json({
        success: true,
        data: {
          guestJoinEnabled: false,
          groups: [],
        },
      })
    }

    const result = await rawPool.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.banner_url AS "bannerUrl",
        r.is_private AS "isPrivate",
        r.created_by_id AS "ownerId",

        COUNT(DISTINCT rm.user_id)::int AS "memberCount",

        p.name AS "planName",
        p."accessLevel" AS "accessLevel",

        gi.token,

        CASE
          WHEN gi.token IS NOT NULL
          THEN CONCAT('/join/', gi.token)
          ELSE NULL
        END AS "joinPath"

      FROM rooms r

      LEFT JOIN room_members rm
        ON rm.room_id = r.id

      LEFT JOIN LATERAL (
        SELECT
          s."planId",
          s."accessLevel"
        FROM subscriptions s
        WHERE
          s."userId" = r.created_by_id
          AND s."isActive" = true
          AND s."startsAt" <= NOW()
          AND s."expiresAt" > NOW()
        ORDER BY s."expiresAt" DESC
        LIMIT 1
      ) s
        ON true

      LEFT JOIN subscription_plans p
        ON p.id = s."planId"

      LEFT JOIN LATERAL (
        SELECT
          gi1.token
        FROM group_invites gi1
        WHERE
          gi1.room_id = r.id
          AND gi1.is_active = true
          AND (
            gi1.expires_at IS NULL
            OR gi1.expires_at > NOW()
          )
        ORDER BY gi1.created_at DESC
        LIMIT 1
      ) gi
        ON true

      WHERE
        r.type = 'GROUP'
        AND r.is_private = false

      GROUP BY
        r.id,
        r.name,
        r.description,
        r.avatar,
        r.banner_url,
        r.is_private,
        r.created_by_id,
        p.name,
        p."accessLevel",
        gi.token

      ORDER BY r.created_at DESC
    `)

    return res.json({
      success: true,
      data: {
        guestJoinEnabled: true,

        groups: result.rows.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          avatar: group.avatar,
          bannerUrl: group.bannerUrl,
          memberCount: Number(
            group.memberCount || 0,
          ),
          isPublic: !group.isPrivate,
          accessLevel:
            group.accessLevel || null,
          planName:
            group.planName || null,
          joinPath:
            group.joinPath || null,
          joinLink:
            group.joinPath || null,
        })),
      },
    })
  } catch (error) {
    console.error(
      "Public groups listing failed:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to load public groups",
    })
  }
})

export default router;