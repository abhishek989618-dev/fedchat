
import { prisma } from "../../config/database.js";

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? "general"
    }
  });
}

export async function findNotificationsByUserId(
  userId: string
) {
  return prisma.notification.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function findNotificationById(
  notificationId: string,
  userId: string
) {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      isRead: true
    }
  });
}

export async function markAllNotificationsAsRead(
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}

export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId
    }
  });
}

