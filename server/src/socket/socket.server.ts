import { Server as HttpServer } from "http";
import {
  Server as SocketIOServer,
  Socket,
} from "socket.io";

import { prisma } from "../config/database.js";

import { canJoinRoom } from "./socket.service.js";

import {
  setUserOnline,
  setUserOffline,
  refreshUserPresence,
  isUserOnline,
} from "./presence.service.js";

import { verifyAccessToken } from "../core/utils/jwt.js";

import { subscriptionService } from "../modules/subscriptions/subscription.service.js";

import { messagesService } from "../modules/messages/messages.service.js";

import { messageActionsService } from "../modules/message-actions/message-actions.service.js";
import { createUserNotification } from "../modules/notifications/notification.service.js";


// ============================================================
// TYPES
// ============================================================

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

interface MessageSendData {
  roomId: string;
  content: string;
  messageType?: string;
}

interface MessageEditData {
  roomId: string;
  messageId: string;
  content: string;
}

interface MessageDeleteData {
  roomId: string;
  messageId: string;
  deleteForEveryone?: boolean;
}

interface MessageReactionData {
  roomId: string;
  messageId: string;
  reaction: string;
}

interface TypingData {
  roomId: string;
}

interface MessageReceiptData {
  roomId: string;
  messageId: string;
}

interface CallbackResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

type Callback = (
  response: CallbackResponse
) => void;


// ============================================================
// SOCKET INSTANCE
// ============================================================

export let io: SocketIOServer;


// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_MESSAGE_TYPES = [
  "text",
  "image",
  "video",
  "audio",
  "file",
] as const;

const PRESENCE_REFRESH_INTERVAL = 30_000;


// ============================================================
// HELPERS
// ============================================================

function errorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}


/**
 * Get all members of a room.
 *
 * We query Prisma directly here rather than depending on
 * a `messagesService.getRoomMembers()` method that may not
 * exist in your current service.
 */
async function getRoomMemberIds(
  roomId: string
): Promise<string[]> {
  const members =
    await prisma.roomMember.findMany({
      where: {
        roomId,
      },
      select: {
        userId: true,
      },
    });

  return members.map(
    (member) => member.userId
  );
}


/**
 * Emit a conversation update to every member's
 * personal Socket.IO room.
 *
 * This is what makes the sidebar/chat list update
 * even when the user is NOT currently inside the room.
 */
async function emitConversationUpdate(
  roomId: string,
  message: unknown
): Promise<void> {
  try {
    const memberIds =
      await getRoomMemberIds(roomId);

    for (const memberId of memberIds) {
      if (memberId !== (message as any)?.senderId) {
        await prisma.roomUserSetting.upsert({
          where: { roomId_userId: { roomId, userId: memberId } },
          update: { unread: { increment: 1 } },
          create: { roomId, userId: memberId, unread: 1 },
        });
      }
      io.to(`user:${memberId}`).emit(
        "conversation:message",
        {
          roomId,
          message,
        }
      );
    }
  } catch (error) {
    console.error(
      "Failed to emit conversation update:",
      error
    );
  }
}


// ============================================================
// INITIALIZE SOCKET
// ============================================================

export function initializeSocket(
  httpServer: HttpServer
) {
  io = new SocketIOServer(
    httpServer,
    {
      cors: {
        origin: (origin, callback) => {
          const allowed = String(process.env.CLIENT_URL || "http://localhost:5173")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

          if (!origin || allowed.includes(origin) || /^https:\/\/[^.]+\.trycloudflare\.com$/i.test(origin)) {
            return callback(null, true);
          }

          return callback(new Error("Origin not allowed by Socket.IO CORS"));
        },
        credentials: true,
      },

      transports: [
        "polling",
        "websocket",
      ],
    }
  );


  // ==========================================================
  // SOCKET AUTHENTICATION
  // ==========================================================

  io.use(
    (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token;

        if (
          !token ||
          typeof token !== "string"
        ) {
          return next(
            new Error(
              "Authentication token is required"
            )
          );
        }

        const payload =
          verifyAccessToken(token);

        if (
          payload.type !== "access" ||
          !payload.sub
        ) {
          return next(
            new Error(
              "Invalid authentication token"
            )
          );
        }

        socket.data.userId =
          String(payload.sub);

        next();
      } catch (error) {
        console.error(
          "Socket authentication failed:",
          error
        );

        next(
          new Error("Unauthorized")
        );
      }
    }
  );


  // ==========================================================
  // CONNECTION
  // ==========================================================

  io.on(
    "connection",
    async (
      socket: AuthenticatedSocket
    ) => {
      const userId =
        socket.data.userId;

      if (!userId) {
        socket.disconnect(true);
        return;
      }


      // --------------------------------------------------------
      // PERSONAL USER ROOM
      // --------------------------------------------------------

      await socket.join(
        `user:${userId}`
      );


      // --------------------------------------------------------
      // ONLINE PRESENCE
      // --------------------------------------------------------

      try {
        await setUserOnline(
          userId
        );
      } catch (error) {
        console.error(
          "Failed to set user online:",
          error
        );
      }


      console.log(
        `Socket connected: ${socket.id}, user: ${userId}`
      );

      console.log(
        `User ${userId} is online`
      );


      // --------------------------------------------------------
      // PRESENCE HEARTBEAT
      // --------------------------------------------------------

      const presenceInterval =
        setInterval(
          async () => {
            try {
              await refreshUserPresence(
                userId
              );
            } catch (error) {
              console.error(
                "Failed to refresh presence:",
                error
              );
            }
          },
          PRESENCE_REFRESH_INTERVAL
        );


      // ========================================================
      // JOIN ROOM
      // ========================================================

      socket.on(
        "join_room",
        async (
          roomId: string,
          callback?: Callback
        ) => {
          try {
            if (
              !roomId ||
              typeof roomId !== "string"
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }

            await canJoinRoom(
              roomId,
              userId
            );

            await socket.join(
              roomId
            );

            callback?.({
              success: true,
              message:
                "Joined room successfully",
              data: {
                roomId,
              },
            });
          } catch (error) {
            console.error(
              "Join room error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to join room"
              ),
            });
          }
        }
      );


      // ========================================================
      // LEAVE ROOM
      // ========================================================

      socket.on(
        "leave_room",
        async (
          roomId: string,
          callback?: Callback
        ) => {
          try {
            if (
              !roomId ||
              typeof roomId !== "string"
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }

            await socket.leave(
              roomId
            );

            callback?.({
              success: true,
              message:
                "Left room successfully",
              data: {
                roomId,
              },
            });
          } catch (error) {
            console.error(
              "Leave room error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to leave room"
              ),
            });
          }
        }
      );


      // ========================================================
      // SEND MESSAGE
      // ========================================================

      socket.on(
        "message:send",
        async (
          data: MessageSendData,
          callback?: Callback
        ) => {
          try {
            if (!userId) {
              return callback?.({
                success: false,
                message:
                  "Unauthorized",
              });
            }

            if (!data) {
              return callback?.({
                success: false,
                message:
                  "Message data is required",
              });
            }

            const {
              roomId,
              content,
              messageType = "text",
            } = data;


            // --------------------------------------------------
            // VALIDATE ROOM ID
            // --------------------------------------------------

            if (
              !roomId ||
              typeof roomId !== "string"
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }


            // --------------------------------------------------
            // VALIDATE CONTENT
            // --------------------------------------------------

            if (
              typeof content !==
                "string" ||
              !content.trim()
            ) {
              return callback?.({
                success: false,
                message:
                  "Message content is required",
              });
            }


            // --------------------------------------------------
            // VALIDATE MESSAGE TYPE
            // --------------------------------------------------

            if (
              !ALLOWED_MESSAGE_TYPES.includes(
                messageType as
                  (typeof ALLOWED_MESSAGE_TYPES)[number]
              )
            ) {
              return callback?.({
                success: false,
                message:
                  "Invalid message type",
              });
            }


            // --------------------------------------------------
            // VERIFY ROOM ACCESS
            // --------------------------------------------------

            await canJoinRoom(
              roomId,
              userId
            );


            // --------------------------------------------------
            // SUBSCRIPTION CHECK
            // --------------------------------------------------

            await subscriptionService.ensureCanSend(
              userId
            );


            // --------------------------------------------------
            // MAKE SURE SOCKET IS IN ROOM
            // --------------------------------------------------

            if (
              !socket.rooms.has(
                roomId
              )
            ) {
              await socket.join(
                roomId
              );
            }


            // --------------------------------------------------
            // CREATE MESSAGE
            // --------------------------------------------------

            const message =
              await messagesService.createMessage(
                roomId,
                userId,
                content.trim(),
                messageType
              );


            // --------------------------------------------------
            // REALTIME MESSAGE
            //
            // Everyone currently viewing this room
            // receives the actual new message.
            // --------------------------------------------------

            io.to(roomId).emit(
              "message:new",
              message
            );

            const roomMembers = await getRoomMemberIds(roomId);
            const preview = message.messageType === "text" ? String(message.content).slice(0, 90) : `Sent a ${message.messageType} message`;
            await Promise.all(roomMembers.filter((id) => id !== userId).map((id) => createUserNotification(id, {
              title: `New message from ${message.sender?.firstName || message.sender?.username || "contact"}`,
              message: preview,
              type: "message_new",
            }).catch(() => undefined)));


            // --------------------------------------------------
            // SIDEBAR / CHAT LIST UPDATE
            //
            // Every room member receives this through
            // their personal user room.
            //
            // IMPORTANT:
            // This uses a DIFFERENT event name from
            // message:new, preventing duplicate messages.
            // --------------------------------------------------

            await emitConversationUpdate(
              roomId,
              message
            );


            // --------------------------------------------------
            // SEND SUCCESS TO SENDER
            // --------------------------------------------------

            callback?.({
              success: true,
              data: {
                message,
              },
            });
          } catch (error) {
            console.error(
              "message:send error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to send message"
              ),
            });
          }
        }
      );


      // ========================================================
      // EDIT MESSAGE
      // ========================================================

      socket.on(
        "message:edit",
        async (
          data: MessageEditData,
          callback?: Callback
        ) => {
          try {
            if (!userId) {
              return callback?.({
                success: false,
                message:
                  "Unauthorized",
              });
            }

            if (
              !data?.roomId
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }

            if (
              !data?.messageId
            ) {
              return callback?.({
                success: false,
                message:
                  "Message ID is required",
              });
            }

            if (
              typeof data.content !==
                "string" ||
              !data.content.trim()
            ) {
              return callback?.({
                success: false,
                message:
                  "Message content is required",
              });
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            if (
              !socket.rooms.has(
                data.roomId
              )
            ) {
              await socket.join(
                data.roomId
              );
            }


            const message =
              await messageActionsService.edit(
                data.messageId,
                userId,
                data.content.trim()
              );


            // --------------------------------------------------
            // Update currently open conversations
            // --------------------------------------------------

            io.to(
              data.roomId
            ).emit(
              "message:updated",
              message
            );


            // --------------------------------------------------
            // Update sidebar
            // --------------------------------------------------

            await emitConversationUpdate(
              data.roomId,
              message
            );


            callback?.({
              success: true,
              data: {
                message,
              },
            });
          } catch (error) {
            console.error(
              "message:edit error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to edit message"
              ),
            });
          }
        }
      );


      // ========================================================
      // DELETE MESSAGE
      // ========================================================

      socket.on(
        "message:delete",
        async (
          data: MessageDeleteData,
          callback?: Callback
        ) => {
          try {
            if (!userId) {
              return callback?.({
                success: false,
                message:
                  "Unauthorized",
              });
            }

            if (
              !data?.roomId
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }

            if (
              !data?.messageId
            ) {
              return callback?.({
                success: false,
                message:
                  "Message ID is required",
              });
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            if (
              !socket.rooms.has(
                data.roomId
              )
            ) {
              await socket.join(
                data.roomId
              );
            }


            // --------------------------------------------------
            // DELETE FOR ME
            // --------------------------------------------------

            if (
              data.deleteForEveryone ===
              false
            ) {
              await messageActionsService.deleteForMe(
                data.messageId,
                userId
              );

              socket.emit(
                "message:deleted_for_me",
                {
                  messageId:
                    data.messageId,
                }
              );

              return callback?.({
                success: true,
                message:
                  "Message deleted for you",
              });
            }


            // --------------------------------------------------
            // DELETE FOR EVERYONE
            // --------------------------------------------------

            const message =
              await messageActionsService.deleteForEveryone(
                data.messageId,
                userId
              );


            io.to(
              data.roomId
            ).emit(
              "message:deleted",
              {
                messageId:
                  data.messageId,
              }
            );


            // Sidebar update
            await emitConversationUpdate(
              data.roomId,
              message
            );


            callback?.({
              success: true,
              data: {
                message,
              },
            });
          } catch (error) {
            console.error(
              "message:delete error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to delete message"
              ),
            });
          }
        }
      );


      // ========================================================
      // ADD REACTION
      // ========================================================

      socket.on(
        "message:reaction",
        async (
          data: MessageReactionData,
          callback?: Callback
        ) => {
          try {
            if (!userId) {
              return callback?.({
                success: false,
                message:
                  "Unauthorized",
              });
            }

            if (
              !data?.roomId
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID is required",
              });
            }

            if (
              !data?.messageId
            ) {
              return callback?.({
                success: false,
                message:
                  "Message ID is required",
              });
            }

            if (
              typeof data.reaction !==
                "string" ||
              !data.reaction.trim()
            ) {
              return callback?.({
                success: false,
                message:
                  "Reaction is required",
              });
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            if (
              !socket.rooms.has(
                data.roomId
              )
            ) {
              await socket.join(
                data.roomId
              );
            }


            const reaction =
              await messageActionsService.react(
                data.messageId,
                userId,
                data.reaction.trim()
              );


            io.to(
              data.roomId
            ).emit(
              "message:reaction",
              reaction
            );


            callback?.({
              success: true,
              data: {
                reaction,
              },
            });
          } catch (error) {
            console.error(
              "message:reaction error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to react to message"
              ),
            });
          }
        }
      );


      // ========================================================
      // REMOVE REACTION
      // ========================================================

      socket.on(
        "message:reaction:remove",
        async (
          data: MessageReactionData,
          callback?: Callback
        ) => {
          try {
            if (!userId) {
              return callback?.({
                success: false,
                message:
                  "Unauthorized",
              });
            }

            if (
              !data?.roomId ||
              !data?.messageId ||
              !data?.reaction
            ) {
              return callback?.({
                success: false,
                message:
                  "Room ID, message ID and reaction are required",
              });
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            await messageActionsService.unreact(
              data.messageId,
              userId,
              data.reaction
            );


            io.to(
              data.roomId
            ).emit(
              "message:reaction:removed",
              {
                messageId:
                  data.messageId,

                userId,

                reaction:
                  data.reaction,
              }
            );


            callback?.({
              success: true,
              message:
                "Reaction removed",
            });
          } catch (error) {
            console.error(
              "message:reaction:remove error:",
              error
            );

            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to remove reaction"
              ),
            });
          }
        }
      );


      // ========================================================
      // TYPING START
      // ========================================================

      socket.on(
        "typing:start",
        async (
          data: TypingData,
          callback?: Callback
        ) => {
          try {
            if (
              !data?.roomId
            ) {
              throw new Error(
                "Room ID is required"
              );
            }


            if (
              !socket.rooms.has(
                data.roomId
              )
            ) {
              throw new Error(
                "You have not joined this room"
              );
            }


            socket
              .to(data.roomId)
              .emit(
                "typing:start",
                {
                  userId,
                  roomId: data.roomId,
                }
              );


            callback?.({
              success: true,
            });
          } catch (error) {
            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to start typing indicator"
              ),
            });
          }
        }
      );


      // ========================================================
      // TYPING STOP
      // ========================================================

      socket.on(
        "typing:stop",
        async (
          data: TypingData,
          callback?: Callback
        ) => {
          try {
            if (
              !data?.roomId
            ) {
              throw new Error(
                "Room ID is required"
              );
            }


            if (
              !socket.rooms.has(
                data.roomId
              )
            ) {
              throw new Error(
                "You have not joined this room"
              );
            }


            socket
              .to(data.roomId)
              .emit(
                "typing:stop",
                {
                  userId,
                  roomId: data.roomId,
                }
              );


            callback?.({
              success: true,
            });
          } catch (error) {
            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to stop typing indicator"
              ),
            });
          }
        }
      );


      // ========================================================
      // MESSAGE DELIVERED
      // ========================================================

      socket.on(
        "message:delivered",
        async (
          data: MessageReceiptData,
          callback?: Callback
        ) => {
          try {
            if (
              !data?.roomId ||
              !data?.messageId
            ) {
              throw new Error(
                "Room ID and message ID are required"
              );
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            const state =
              await messageActionsService.delivered(
                data.messageId,
                userId
              );


            io.to(
              data.roomId
            ).emit(
              "message:delivered",
              {
                messageId:
                  data.messageId,

                userId,

                deliveredAt:
                  state.deliveredAt,
              }
            );


            callback?.({
              success: true,
              data: {
                state,
              },
            });
          } catch (error) {
            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to mark message delivered"
              ),
            });
          }
        }
      );


      // ========================================================
      // MESSAGE READ
      // ========================================================

      socket.on(
        "message:read",
        async (
          data: MessageReceiptData,
          callback?: Callback
        ) => {
          try {
            if (
              !data?.roomId ||
              !data?.messageId
            ) {
              throw new Error(
                "Room ID and message ID are required"
              );
            }


            await canJoinRoom(
              data.roomId,
              userId
            );


            const state =
              await messageActionsService.read(
                data.messageId,
                userId
              );

            await prisma.roomUserSetting.upsert({
              where: { roomId_userId: { roomId: data.roomId, userId } },
              update: { unread: 0 },
              create: { roomId: data.roomId, userId, unread: 0 },
            });


            io.to(
              data.roomId
            ).emit(
              "message:read",
              {
                messageId:
                  data.messageId,

                userId,

                readAt:
                  state.readAt,
              }
            );


            callback?.({
              success: true,
              data: {
                state,
              },
            });
          } catch (error) {
            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to mark message read"
              ),
            });
          }
        }
      );


      // ========================================================
      // PRESENCE CHECK
      // ========================================================

      socket.on(
        "presence:check",
        async (
          targetUserId: string,
          callback?: Callback
        ) => {
          try {
            if (
              !targetUserId ||
              typeof targetUserId !==
                "string"
            ) {
              throw new Error(
                "User ID is required"
              );
            }


            const online =
              await isUserOnline(
                targetUserId
              );


            callback?.({
              success: true,
              data: {
                userId:
                  targetUserId,

                online,
              },
            });
          } catch (error) {
            callback?.({
              success: false,
              message: errorMessage(
                error,
                "Unable to check presence"
              ),
            });
          }
        }
      );


      // ========================================================
      // DISCONNECT
      // ========================================================

      socket.on(
        "disconnect",
        async () => {
          clearInterval(
            presenceInterval
          );


          try {
            await setUserOffline(
              userId
            );

            console.log(
              `User ${userId} is offline`
            );
          } catch (error) {
            console.error(
              "Failed to set user offline:",
              error
            );
          }


          console.log(
            `Socket disconnected: ${socket.id}, user: ${userId}`
          );
        }
      );
    }
  );


  return io;
}