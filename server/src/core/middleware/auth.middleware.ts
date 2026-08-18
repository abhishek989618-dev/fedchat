import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  verifyAccessToken
} from "../utils/jwt.js";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });
    }

    const [scheme, token] =
      authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header"
      });
    }

    const payload =
      verifyAccessToken(token);

    if (
      payload.type !== "access" ||
      !payload.sub
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token"
      });
    }

    req.userId = payload.sub;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token"
    });
  }
}