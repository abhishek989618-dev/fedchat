import {prisma }from "../../config/database.js";

export const adminAnalyticsRepository = {
  async counts() {
    const [users, rooms, messages, subscriptions, pendingPayments] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.message.count(),
      prisma.subscription.count(),
      prisma.paymentRequest.count({ where: { status: "PENDING" as never } }),
    ]);

    return { users, rooms, messages, subscriptions, pendingPayments };
  },

  async activeUsersSince(since: Date) {
    return prisma.user.count({
      where: { updatedAt: { gte: since } },
    });
  },
};
