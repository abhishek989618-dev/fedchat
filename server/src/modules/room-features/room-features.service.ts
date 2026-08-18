import { roomFeaturesRepository } from "./room-features.repository.js";

export const roomFeaturesService = {
  get(roomId: string, userId: string) {
    return roomFeaturesRepository.get(roomId, userId);
  },

  pin(roomId: string, userId: string, value = true) {
    return roomFeaturesRepository.upsert(roomId, userId, { isPinned: value });
  },

  mute(roomId: string, userId: string, value = true) {
    return roomFeaturesRepository.upsert(roomId, userId, { isMuted: value });
  },

  markRead(roomId: string, userId: string) {
    return roomFeaturesRepository.resetUnread(roomId, userId);
  },
};
