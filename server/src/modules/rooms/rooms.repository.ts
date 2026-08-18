import { prisma } from "../../config/database.js";

export class RoomsRepository {
  async findAll(userId?: string) {
  const rooms = await prisma.room.findMany({
    where: userId
      ? {
          members: {
            some: {
              userId
            }
          }
        }
      : undefined,

    orderBy: {
      updatedAt: "desc"
    },

    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },

      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              status: true
            }
          }
        }
      },

      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          content: true,
          senderId: true,
          messageType: true,
          createdAt: true
        }
      },

      _count: {
        select: {
          members: true,
          messages: true
        }
      }
    }
  });

  if (!userId) return rooms;

  const settings = await prisma.roomUserSetting.findMany({
    where: { userId },
    select: { roomId: true, unread: true, isPinned: true, isMuted: true },
  });
  const settingsByRoom = new Map(settings.map((item) => [item.roomId, item]));
  return rooms.map((room) => ({
    ...room,
    unread: settingsByRoom.get(room.id)?.unread ?? 0,
    pinned: settingsByRoom.get(room.id)?.isPinned ?? false,
    muted: settingsByRoom.get(room.id)?.isMuted ?? false,
  }));
}

  async findById(id: string) {
    return prisma.room.findUnique({
      where: {
        id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true
              }
            }
          }
        }
      }
    });
  }
  

  async create(data: {
    name: string;
    description?: string;
    isPrivate: boolean;
    type?: "DIRECT" | "GROUP";
    createdById: string;
  }) {
    return prisma.room.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      isPrivate?: boolean;
      avatar?: string | null;
      bannerUrl?: string | null;
    }
  ) {
    return prisma.room.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return prisma.room.delete({
      where: {
        id
      }
    });
  }

  async findMember(
  roomId: string,
  userId: string
) {
  return prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId
      }
    }
  });
}

  async addMember(
    roomId: string,
    userId: string
  ) {
    return prisma.roomMember.create({
      data: {
        roomId,
        userId
      }
    });
  }

  async removeMember(
    roomId: string,
    userId: string
  ) {
    return prisma.roomMember.delete({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });
  }

  async removeSelfFromRoom(roomId: string, userId: string) {
    return prisma.roomMember.deleteMany({ where: { roomId, userId } });
  }

  async findUserById(
  userId: string
) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      status: true
    }
  });
}

async findDirectRoom(
  userId: string,
  otherUserId: string
) {
  return prisma.room.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        {
          members: {
            some: {
              userId,
            },
          },
        },
        {
          members: {
            some: {
              userId: otherUserId,
            },
          },
        },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

async createDirectRoom(
  userId: string,
  otherUserId: string,
  name: string
) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.create({
      data: {
        name,
        type: "DIRECT",
        isPrivate: true,
        createdById: userId,
      },
    });

    await tx.roomMember.createMany({
      data: [
        {
          roomId: room.id,
          userId,
        },
        {
          roomId: room.id,
          userId: otherUserId,
        },
      ],
    });

    return tx.room.findUnique({
      where: {
        id: room.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });
  });
}
}