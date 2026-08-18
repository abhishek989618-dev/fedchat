import {prisma} from "../../config/database.js";

export const messageActionsRepository = {
  getMessage(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  updateMessage(id: string, data: { content?: string }) {
    return prisma.message.update({ where: { id }, data });
  },

  deleteMessage(id: string) {
    return prisma.message.delete({ where: { id } });
  },

  reaction(messageId: string, userId: string, reaction: string) {
    return prisma.messageReaction.upsert({
      where: { messageId_userId_reaction: { messageId, userId, reaction } },
      update: {},
      create: { messageId, userId, reaction },
    });
  },

  removeReaction(messageId: string, userId: string, reaction: string) {
    return prisma.messageReaction.delete({
      where: { messageId_userId_reaction: { messageId, userId, reaction } },
    });
  },

  markDelivered(messageId: string, userId: string) {
    return prisma.messageUserState.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { deliveredAt: new Date() },
      create: { messageId, userId, deliveredAt: new Date() },
    });
  },

  markRead(messageId: string, userId: string) {
    return prisma.messageUserState.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { readAt: new Date(), deliveredAt: new Date() },
      create: { messageId, userId, readAt: new Date(), deliveredAt: new Date() },
    });
  },

  markDeletedForUser(messageId: string, userId: string) {
    return prisma.messageUserState.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { deleted: true },
      create: { messageId, userId, deleted: true },
    });
  },
};
