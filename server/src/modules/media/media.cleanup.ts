import { mediaService } from "./media.service.js";

export async function cleanupExpiredMedia() {
  return mediaService.cleanupExpired();
}
