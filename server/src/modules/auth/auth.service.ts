import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AuthRepository } from "./auth.repository.js";

import type {
  LoginInput,
  RegisterInput
} from "./auth.validation.js";

import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from "../../core/utils/jwt.js";

import { hashToken } from "../../core/utils/hash.js";
import { normalizePhone } from "../../core/utils/phone.js";
import { rawPool } from "../../config/raw-db.js";
// Used to keep bcrypt.compare timing constant when no user is
// found, so response time can't be used to enumerate registered
// emails. This is just a fixed, valid bcrypt hash of a random
// value — it is never a real user's password hash.
const DUMMY_PASSWORD_HASH =
  "$2a$12$CwTycUXWue0Thq9StjUM0uJ8T.ShOJoi8FqhIzOFqhwG6cWEjr3PW";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async register(input: RegisterInput) {
    const setting = await rawPool.query(`SELECT value FROM site_settings WHERE key=$1 LIMIT 1`, ["site.registrationEnabled"]);
    if (setting.rowCount) {
      const raw = setting.rows[0]?.value;
      const enabled = raw === true || raw === "true" || raw?.value === true;
      if (!enabled) throw new Error("New account registration is currently disabled");
    }
    const existingEmail = await this.repository.findUserByEmail(input.email);

    if (existingEmail) {
      throw new Error("Email is already registered");
    }

    const existingUsername = await this.repository.findUserByUsername(
      input.username
    );

    if (existingUsername) {
      throw new Error("Username is already taken");
    }

    const userRole = await this.repository.findRoleByName("user");

    if (!userRole) {
      throw new Error("Default user role does not exist");
    }
    
const normalizedPhone = normalizePhone(input.phone);

if (!normalizedPhone) {
  throw new Error("Invalid phone number");
}

const passwordHash = await bcrypt.hash(input.password, 12);
const user = await this.repository.createUser({
  email: input.email,
  username: input.username,
  passwordHash,
  firstName: input.firstName,
  lastName: input.lastName,
  phone: normalizedPhone, // now narrowed to string
  roleId: userRole.id
});

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      role: user.role.name
    };
  }

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(input.email);

    // Always run bcrypt.compare, even when no user was found, using
    // a fixed dummy hash in that case. This keeps response time the
    // same for "no such email" and "wrong password", so timing can't
    // be used to enumerate which emails are registered.
    const passwordValid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH
    );

    if (!user || !passwordValid) {
      throw new Error("Invalid email or password");
    }

    // Only reveal anything about account state AFTER the password
    // has been confirmed correct.
    if (user.status !== "ACTIVE") {
      throw new Error("Your account is not active");
    }

    const sessionId = crypto.randomUUID();

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id, sessionId);
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.repository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      expiresAt
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        bannerUrl: user.bannerUrl,
        bio: user.bio,
        role: user.role.name
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken: string) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }

    const session = await this.repository.findSessionById(payload.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.revokedAt) {
      throw new Error("Session has been revoked");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new Error("Session has expired");
    }

    const tokenHash = hashToken(refreshToken);

    if (tokenHash !== session.refreshTokenHash) {
      throw new Error("Invalid refresh token");
    }

    const newSessionId = crypto.randomUUID();

    const newAccessToken = createAccessToken(session.userId);
    const newRefreshToken = createRefreshToken(session.userId, newSessionId);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    // Guest sessions are capped to their original expiry (2 days from
    // creation) and must never be extended by refreshing — otherwise a
    // guest could keep sliding their access forward indefinitely, which
    // defeats the whole point of a temporary account.
    const isGuest = session.user?.role?.name === "guest";
    const newExpiresAt = isGuest
      ? session.expiresAt
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    /*
     * Revoke the old session.
     */
    await this.repository.revokeSession(session.id);

    /*
     * Create new session.
     */
    await this.repository.createSession({
      id: newSessionId,
      userId: session.userId,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken: string) {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new Error("Invalid refresh token");
    }

    const session = await this.repository.findSessionById(payload.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.revokedAt) {
      await this.repository.revokeSession(session.id);
    }

    return true;
  }

  // Create /auth/me
  async getCurrentUser(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      role: user.role.name,
      permissions: user.role.permissions.map((item) => item.permission.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}