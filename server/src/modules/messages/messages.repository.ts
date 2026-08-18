import { prisma } from "../../config/database.js";
import { rawPool } from "../../config/raw-db.js";

class MessagesRepository {
  async findRoomAccess(
    roomId: string,
    userId: string
  ) {
    return prisma.room.findFirst({
      where: {
        id: roomId,

        /*
         * The requesting user must actually
         * have access to the room.
         */
        members: {
          some: {
            userId
          }
        }
      },

      select: {
        id: true,
        isPrivate: true,
        createdById: true,

        members: {
          select: {
            userId: true
          }
        }
      }
    });
  }

  async findRoomMembers(
    roomId: string
  ) {
    return prisma.roomMember.findMany({
      where: {
        roomId
      },
      select: {
        userId: true
      }
    });
  }

  async createMessage(
    roomId: string,
    senderId: string,
    content: string,
    messageType: string = "text"
  ) {
    return prisma.$transaction(
      async (tx) => {
        /*
         * Create the message.
         */
        const message =
          await tx.message.create({
            data: {
              roomId,
              senderId,
              content,
              messageType
            },

            include: {
              sender: {
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

        /*
         * IMPORTANT:
         *
         * A new message means the conversation
         * was updated.
         *
         * RoomsRepository.findAll() already sorts
         * by updatedAt DESC, so this makes the
         * conversation move to the top.
         */
        await tx.room.update({
          where: {
            id: roomId
          },

          data: {
            updatedAt: new Date()
          }
        });

        return message;
      }
    );
  }

  async findMessagesByRoom(
    roomId: string
  ) {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } } }
    });
    const ids = messages.map((m) => m.id);
    const states = ids.length ? await rawPool.query(`SELECT "messageId" AS message_id, MAX("deliveredAt") AS delivered_at, MAX("readAt") AS read_at FROM message_user_states WHERE "messageId" = ANY($1::uuid[]) GROUP BY "messageId"`, [ids]) : { rows: [] as any[] };
    const stateMap = new Map(states.rows.map((r: any) => [String(r.message_id), r]));
    return messages.map((message) => {
      const state = stateMap.get(message.id);
      let media: any = undefined;
      try { const parsed = JSON.parse(message.content); if (parsed && parsed.mediaId) media = parsed; } catch {}
      return { ...message, media, deliveredAt: state?.delivered_at ?? null, readAt: state?.read_at ?? null };
    });
  }

  async findById(
    id: string
  ) {
    return prisma.message.findUnique({
      where: {
        id
      },

      include: {
        sender: {
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

  async updateMessage(
    id: string,
    content: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const message =
          await tx.message.update({
            where: {
              id
            },

            data: {
              content
            },

            include: {
              sender: {
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

        /*
         * Editing a message also updates the
         * conversation timestamp.
         */
        await tx.room.update({
          where: {
            id: message.roomId
          },

          data: {
            updatedAt: new Date()
          }
        });

        return message;
      }
    );
  }

  async deleteMessage(
    id: string
  ) {
    const message =
      await prisma.message.findUnique({
        where: {
          id
        },

        select: {
          roomId: true
        }
      });

    if (!message) {
      throw new Error(
        "Message not found"
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const deleted =
          await tx.message.delete({
            where: {
              id
            }
          });

        await tx.room.update({
          where: {
            id: message.roomId
          },

          data: {
            updatedAt: new Date()
          }
        });

        return deleted;
      }
    );
  }
}

export const messagesRepository =
  new MessagesRepository();