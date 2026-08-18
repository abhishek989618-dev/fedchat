
import { io } from "./socket.server.js";

export function emitNotification(
 userId: string,
  notification: unknown
) {
  io
    .to(`user:${userId}`)
    .emit(
      "notification:new",
      notification
    );
}
