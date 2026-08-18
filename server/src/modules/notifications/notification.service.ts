
import {
  createNotification,
  findNotificationsByUserId,
  findNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "./notification.repository.js";

import {
  emitNotification
} from "../../socket/notification.socket.js";

export async function createUserNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type?: string;
  }
) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  if (
    !data.title ||
    data.title.trim().length === 0
  ) {
    throw new Error(
      "Notification title is required"
    );
  }

  if (
    !data.message ||
    data.message.trim().length === 0
  ) {
    throw new Error(
      "Notification message is required"
    );
  }

  const notification =
    await createNotification({
      userId,
      title: data.title.trim(),
      message: data.message.trim(),
      type:
        data.type?.trim() ||
        "general"
    });

  // Emit the notification only after
  // successfully saving it to PostgreSQL.
  emitNotification(
    userId,
    notification
  );

  return notification;
}

export async function getUserNotifications(
  userId: string
) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  return findNotificationsByUserId(
    userId
  );
}

export async function getNotification(
  notificationId: string,
  userId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required"
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const notification =
    await findNotificationById(
      notificationId,
      userId
    );

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  return notification;
}

export async function readNotification(
  notificationId: string,
  userId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required"
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const result =
    await markNotificationAsRead(
      notificationId,
      userId
    );

  if (result.count === 0) {
    throw new Error(
      "Notification not found"
    );
  }

  return {
    success: true
  };
}

export async function readAllNotifications(
  userId: string
) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const result =
    await markAllNotificationsAsRead(
      userId
    );

  return {
    success: true,
    count: result.count
  };
}

export async function removeNotification(
  notificationId: string,
  userId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required"
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const result =
    await deleteNotification(
      notificationId,
      userId
    );

  if (result.count === 0) {
    throw new Error(
      "Notification not found"
    );
  }

  return {
    success: true
  };
}

