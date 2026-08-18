import { messageActionsRepository } from "./message-actions.repository.js";

export const messageActionsService = {
  async edit(id: string, userId: string, content: string) {
    const message = await messageActionsRepository.getMessage(id);
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId) throw new Error("Only the sender can edit this message");
    if (!content.trim()) throw new Error("Content is required");

    return messageActionsRepository.updateMessage(id, { content: content.trim() });
  },

  async deleteForEveryone(id: string, userId: string) {
    const message = await messageActionsRepository.getMessage(id);
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId) throw new Error("Only the sender can delete this message for everyone");

    await messageActionsRepository.deleteMessage(id);
    return { id, deleted: true };
  },

  delivered(id: string, userId: string) {
    return messageActionsRepository.markDelivered(id, userId);
  },

  read(id: string, userId: string) {
    return messageActionsRepository.markRead(id, userId);
  },

  deleteForMe(id: string, userId: string) {
    return messageActionsRepository.markDeletedForUser(id, userId);
  },

  react(id: string, userId: string, reaction: string) {
    if (!reaction?.trim()) throw new Error("Reaction is required");
    return messageActionsRepository.reaction(id, userId, reaction.trim());
  },

  unreact(id: string, userId: string, reaction: string) {
    return messageActionsRepository.removeReaction(id, userId, reaction);
  },
};
