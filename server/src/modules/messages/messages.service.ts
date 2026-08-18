import { messagesRepository } from "./messages.repository.js";
import { rawPool } from "../../config/raw-db.js";

class MessagesService {
  private async ensureRoomAccess(
    roomId: string,
    userId: string
  ) {
    const room =
      await messagesRepository.findRoomAccess(
        roomId,
        userId
      );

    if (!room) {
      throw new Error(
        "Room not found"
      );
    }

    /*
     * Public room:
     * authenticated users with access
     * are allowed.
     */
    if (!room.isPrivate) {
      return room;
    }

    /*
     * Private room:
     * membership is already checked by
     * findRoomAccess().
     */
    if (
      !room.members.some(
        (member) =>
          member.userId === userId
      )
    ) {
      throw new Error(
        "You are not a member of this private room"
      );
    }

    return room;
  }

  async createMessage(
    roomId: string,
    senderId: string,
    content: string,
    messageType: string
  ) {
    await this.ensureRoomAccess(
      roomId,
      senderId
    );

    const guest = await rawPool.query(
      `SELECT 1 FROM guest_sessions WHERE user_id=$1 AND room_id=$2 AND expires_at>NOW() LIMIT 1`,
      [senderId, roomId],
    );
    if (guest.rowCount) throw new Error("Guest accounts are read-only and cannot send messages");

    return messagesRepository.createMessage(
      roomId,
      senderId,
      content,
      messageType
    );
  }

  async getMessages(
    roomId: string,
    userId: string
  ) {
    await this.ensureRoomAccess(
      roomId,
      userId
    );

    return messagesRepository.findMessagesByRoom(
      roomId
    );
  }

  async getRoomMembers(
    roomId: string,
    userId: string
  ) {
    const room =
      await this.ensureRoomAccess(
        roomId,
        userId
      );

    return room.members.map(
      (member) =>
        member.userId
    );
  }

  async updateMessage(
    id: string,
    userId: string,
    content: string
  ) {
    const message =
      await messagesRepository.findById(
        id
      );

    if (!message) {
      throw new Error(
        "Message not found"
      );
    }

    if (
      message.sender.id !== userId
    ) {
      throw new Error(
        "You can only update your own messages"
      );
    }

    return messagesRepository.updateMessage(
      id,
      content
    );
  }

  async forwardMessage(
    messageId: string,
    senderId: string,
    targetRoomIds: string[],
  ) {
    const original = await messagesRepository.findById(messageId);
    if (!original) throw new Error("Message not found");

    await this.ensureRoomAccess(original.roomId, senderId);
    const guest = await rawPool.query(
      `SELECT 1 FROM guest_sessions WHERE user_id=$1 AND room_id=$2 AND expires_at>NOW() LIMIT 1`,
      [senderId, original.roomId],
    );
    if (guest.rowCount) throw new Error("Guest accounts are read-only and cannot forward messages");

    const uniqueRooms = [...new Set(targetRoomIds)].filter(Boolean);
    if (!uniqueRooms.length) throw new Error("Choose at least one conversation");

    const created = [];
    for (const roomId of uniqueRooms) {
      await this.ensureRoomAccess(roomId, senderId);
      let forwardedContent: Record<string, unknown> = {
        text: original.content,
      };
      try {
        const parsed = JSON.parse(original.content);
        if (parsed && typeof parsed === "object") {
          forwardedContent = { ...(parsed as Record<string, unknown>) };
        }
      } catch {
        // Plain-text messages keep their content as `text`.
      }

      const forwardedText =
        typeof forwardedContent.text === "string"
          ? forwardedContent.text
          : typeof forwardedContent.caption === "string"
            ? forwardedContent.caption
            : original.messageType === "image"
              ? "Image"
              : original.messageType === "video"
                ? "Video"
                : original.messageType === "audio"
                  ? "Voice note"
                  : original.messageType === "file" || original.messageType === "document"
                    ? "Attachment"
                    : "Message";

      const content = JSON.stringify({
        ...forwardedContent,
        text: forwardedText,
        forwardedFrom: {
          id: original.id,
          text: forwardedText,
          senderName: `${original.sender?.firstName ?? ""} ${original.sender?.lastName ?? ""}`.trim() || original.sender?.username,
          kind: original.messageType,
        },
      });
      const message = await messagesRepository.createMessage(
        roomId,
        senderId,
        content,
        original.messageType,
      );
      created.push(message);
    }
    return created;
  }

  async deleteMessage(
    id: string,
    userId: string
  ) {
    const message =
      await messagesRepository.findById(
        id
      );

    if (!message) {
      throw new Error(
        "Message not found"
      );
    }

    if (
      message.sender.id !== userId
    ) {
      throw new Error(
        "You can only delete your own messages"
      );
    }

    await messagesRepository.deleteMessage(
      id
    );

    return true;
  }
}

export const messagesService =
  new MessagesService();