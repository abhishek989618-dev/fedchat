
import type {
  Request,
  Response
} from "express";

import {
  createUserNotification,
  getUserNotifications,
  getNotification,
  readNotification,
  readAllNotifications,
  removeNotification
} from "./notification.service.js";

import {
  createNotificationSchema,
  notificationIdSchema
} from "./notification.validation.js";

export async function createNotification(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const data =
      createNotificationSchema.parse(
        req.body
      );

    const notification =
      await createUserNotification(
        userId,
        data
      );

    return res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create notification"
    });
  }
}

export async function getNotifications(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const notifications =
      await getUserNotifications(
        userId
      );

    return res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get notifications"
    });
  }
}

export async function getNotificationById(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const {
      notificationId
    } =
      notificationIdSchema.parse(
        req.params
      );

    const notification =
      await getNotification(
        notificationId,
        userId
      );

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(
      "Get notification error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Notification not found"
    });
  }
}

export async function markNotificationRead(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const {
      notificationId
    } =
      notificationIdSchema.parse(
        req.params
      );

    await readNotification(
      notificationId,
      userId
    );

    return res.json({
      success: true,
      message:
        "Notification marked as read"
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Notification not found"
    });
  }
}

export async function markAllNotificationsRead(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result =
      await readAllNotifications(
        userId
      );

    return res.json({
      success: true,
      message:
        "All notifications marked as read",
      count: result.count
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update notifications"
    });
  }
}

export async function deleteNotification(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const {
      notificationId
    } =
      notificationIdSchema.parse(
        req.params
      );

    await removeNotification(
      notificationId,
      userId
    );

    return res.json({
      success: true,
      message:
        "Notification deleted"
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Notification not found"
    });
  }
}

