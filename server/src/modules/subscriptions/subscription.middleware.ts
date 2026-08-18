
import type { Request, Response, NextFunction } from "express";

import { subscriptionService } from "./subscription.service.js";

export async function requireSubscriptionRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await subscriptionService.ensureCanRead(
      req.userId
    );

    next();
  } catch (error) {
    console.error(error);

    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Chat access denied",
    });
  }
}

export async function requireSubscriptionSend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await subscriptionService.ensureCanSend(
      req.userId
    );

    next();
  } catch (error) {
    console.error(error);

    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Message sending is not allowed",
    });
  }
}

