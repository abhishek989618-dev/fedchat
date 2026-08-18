
import crypto from "node:crypto";
import type {
  Request,
  Response,
  NextFunction,
} from "express";

// =====================================================
// REQUEST ID
// =====================================================

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const id =
    req.header("x-request-id") ??
    crypto.randomUUID();

  res.setHeader(
    "x-request-id",
    id
  );

  next();
}

// =====================================================
// PRIVATE API CACHE CONTROL
// =====================================================

export function noStoreForPrivateApi(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.path.startsWith("/api/")) {
    res.setHeader(
      "Cache-Control",
      "no-store"
    );
  }

  next();
}

// =====================================================
// BASIC SECURITY HEADERS
// =====================================================

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "X-XSS-Protection",
    "0"
  );

  next();
}

