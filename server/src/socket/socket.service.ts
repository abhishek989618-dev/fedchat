
import { prisma } from "../config/database.js";

export async function canJoinRoom(
  roomId: string,
  userId: string
) {
  const room =
    await prisma.room.findUnique({
      where: {
        id: roomId
      },
      select: {
        id: true,
        isPrivate: true,
        members: {
          where: {
            userId
          },
          select: {
            userId: true
          }
        }
      }
    });

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  // Public room
  if (!room.isPrivate) {
    return true;
  }

  // Private room
  if (room.members.length === 0) {
    throw new Error(
      "You are not a member of this private room"
    );
  }

  return true;
}

