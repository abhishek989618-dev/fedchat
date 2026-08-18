  import { RoomsRepository } from "./rooms.repository.js";

  import type {
    CreateRoomInput,
    UpdateRoomInput
  } from "./rooms.validation.js";

  export class RoomsService {
    constructor(
      private readonly repository: RoomsRepository
    ) {}

  async getRoom(
    id: string,
    userId: string
  ) {
    const room =
      await this.repository.findById(id);
      

    if (!room) {
      throw new Error("Room not found");
    }

    // Public rooms can be viewed by users
    // who have rooms.read permission.
    if (!room.isPrivate) {
      return room;
    }

    // Private rooms require membership.
    const member =
      await this.repository.findMember(
        id,
        userId
      );

    if (!member) {
      throw new Error(
        "You are not a member of this private room"
      );
    }

    return room;
  }
  async getRooms(userId?: string) {
    return this.repository.findAll(userId);
  }

    async createRoom(
      userId: string,
      input: CreateRoomInput
    ) {
      const room =
        await this.repository.create({
          name: input.name,
          description: input.description,
          type: input.type,
          isPrivate: input.isPrivate ?? false,
          createdById: userId
        });

      // Creator automatically becomes a member.
      await this.repository.addMember(
        room.id,
        userId
      );

      return this.repository.findById(
        room.id
      );
    }

    async updateRoom(
      id: string,
      userId: string,
      input: UpdateRoomInput
    ) {
      const room =
        await this.repository.findById(id);

      if (!room) {
        throw new Error("Room not found");
      }

      if (room.createdById !== userId) {
        throw new Error(
          "Only the room creator can update this room"
        );
      }

      return this.repository.update(
        id,
        input
      );
    }

    async leaveRoom(id: string, userId: string) {
      const room = await this.repository.findById(id);
      if (!room) throw new Error('Room not found');
      const member = await this.repository.findMember(id, userId);
      if (!member) throw new Error('You are not a member of this conversation');
      if (room.type === 'GROUP' && room.createdById === userId) {
        throw new Error('Group creator must transfer ownership or delete the group');
      }
      await this.repository.removeSelfFromRoom(id, userId);
      return true;
    }

    async deleteRoom(
      id: string,
      userId: string
    ) {
      const room =
        await this.repository.findById(id);

      if (!room) {
        throw new Error("Room not found");
      }

      if (room.createdById !== userId) {
        throw new Error(
          "Only the room creator can delete this room"
        );
      }

      await this.repository.delete(id);

      return true;
    }

      async addMember(
    roomId: string,
    requestingUserId: string,
    targetUserId: string
  ) {
    await this.ensureRoomCreator(
      roomId,
      requestingUserId
    );

    const user =
      await this.repository.findUserById(
        targetUserId
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    const existing =
      await this.repository.findMember(
        roomId,
        targetUserId
      );

    if (existing) {
      throw new Error(
        "User is already a member of this room"
      );
    }

    return this.repository.addMember(
      roomId,
      targetUserId
    );
  }

  async removeMember(
    roomId: string,
    requestingUserId: string,
    targetUserId: string
  ) {
    await this.ensureRoomCreator(
      roomId,
      requestingUserId
    );

    if (
      requestingUserId ===
      targetUserId
    ) {
      throw new Error(
        "Room creator cannot remove themselves"
      );
    }
    

    const existing =
      await this.repository.findMember(
        roomId,
        targetUserId
      );

    if (!existing) {
      throw new Error(
        "User is not a member of this room"
      );
    }

    await this.repository.removeMember(
      roomId,
      targetUserId
    );

    return true;
  }


    async ensureRoomCreator(
    roomId: string,
    userId: string
  ) {
    const room =
      await this.repository.findById(
        roomId
      );

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.createdById !== userId) {
      throw new Error(
        "Only the room creator can manage members"
      );
    }

    return room;
  }

  async createDirectRoom(
  userId: string,
  targetUserId: string
) {
  if (userId === targetUserId) {
    throw new Error(
      "You cannot create a conversation with yourself"
    );
  }

  const targetUser =
    await this.repository.findUserById(
      targetUserId
    );

  if (!targetUser) {
    throw new Error("User not found");
  }

  /*
   * If a direct room already exists,
   * return the existing room instead of
   * creating duplicate conversations.
   */
  const existing =
    await this.repository.findDirectRoom(
      userId,
      targetUserId
    );

  if (existing) {
    return existing;
  }

  const name =
    `${targetUser.firstName} ${targetUser.lastName}`.trim() ||
    targetUser.username;

  return this.repository.createDirectRoom(
    userId,
    targetUserId,
    name
  );
}
  }