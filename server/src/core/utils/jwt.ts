import jwt from "jsonwebtoken";

const rawAccessSecret = process.env.JWT_ACCESS_SECRET;
const rawRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!rawAccessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

if (!rawRefreshSecret) {
  throw new Error("JWT_REFRESH_SECRET is not defined");
}

const accessSecret: string = rawAccessSecret;
const refreshSecret: string = rawRefreshSecret;

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  type: "access";
}

export interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
}

export function createAccessToken(userId: string) {
  return jwt.sign(
    {
      sub: userId,
      type: "access"
    },
    accessSecret,
    {
      expiresIn: "15m"
    }
  );
}

export function createRefreshToken(
  userId: string,
  sessionId: string
) {
  return jwt.sign(
    {
      sub: userId,
      sessionId,
      type: "refresh"
    },
    refreshSecret,
    {
      expiresIn: "7d"
    }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
}