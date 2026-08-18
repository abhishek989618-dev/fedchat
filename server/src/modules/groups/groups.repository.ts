import {prisma} from "../../config/database.js";

const memberSelect = {
  createdBy: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
  _count: { select: { members: true } },
} as const;

export const groupsRepository = {
  createRoom(data: { name: string; description?: string; createdById: string; isPrivate?: boolean; avatar?: string | null; bannerUrl?: string | null }) {
    return prisma.room.create({
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar ?? null,
        bannerUrl: data.bannerUrl ?? null,
        createdById: data.createdById,
        type: "GROUP",
        isPrivate: data.isPrivate ?? false,
        members: { create: { userId: data.createdById } },
      },
      include: { members: true, ...memberSelect },
    });
  },

  findMyGroups(userId: string) {
    return prisma.room.findMany({
      where: { type: "GROUP", members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: memberSelect,
    });
  },

  countOwned(createdById: string) {
    return prisma.room.count({ where: { type: "GROUP", createdById } });
  },

  countMembers(roomId: string) {
    return prisma.roomMember.count({ where: { roomId } });
  },

  addMember(roomId: string, userId: string) {
    return prisma.roomMember.create({ data: { roomId, userId } });
  },

  removeMember(roomId: string, userId: string) {
    return prisma.roomMember.delete({ where: { roomId_userId: { roomId, userId } } });
  },

  findById(roomId: string) {
    return prisma.room.findUnique({ where: { id: roomId }, include: { createdBy: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } }, _count: { select: { members: true } } } });
  },

  update(roomId: string, data: { name?: string; description?: string | null; isPrivate?: boolean; avatar?: string | null; bannerUrl?: string | null }) {
    return prisma.room.update({ where: { id: roomId }, data });
  },

  members(roomId: string) {
    return prisma.roomMember.findMany({ where: { roomId }, include: { user: true } });
  },
};
