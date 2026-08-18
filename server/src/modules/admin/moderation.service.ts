import {prisma }from "../../config/database.js";

export const moderationService = {
  async banUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED" as never },
    });
  },

  async unbanUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" as never },
    });
  },

  async forceLogout(userId: string) {
    await prisma.userSessionRevocation.create({
      data: { userId },
    });

    return { userId, revokedAt: new Date() };
  },
};
