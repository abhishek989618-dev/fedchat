import {prisma} from "../../config/database.js";

export const roomFeaturesRepository = {
  get(roomId: string, userId: string) {
    return prisma.roomUserSetting.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  },

  upsert(roomId: string, userId: string, data: { isPinned?: boolean; isMuted?: boolean; unread?: number }) {
    return prisma.roomUserSetting.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: data,
      create: { roomId, userId, ...data },
    });
  },

  resetUnread(roomId: string, userId: string) {
    return this.upsert(roomId, userId, { unread: 0 });
  },
};
