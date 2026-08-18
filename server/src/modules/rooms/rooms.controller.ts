import type {
  Request,
  Response
} from "express";

import {
  createRoomSchema,
  createDirectRoomSchema,
  updateRoomSchema,
  addMemberSchema
} from "./rooms.validation.js";

import { RoomsRepository } from "./rooms.repository.js";
import { RoomsService } from "./rooms.service.js";

const roomsService =
  new RoomsService(
    new RoomsRepository()
  );


export async function getRooms(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const rooms = await roomsService.getRooms(req.userId);

    return res.status(200).json({
      success: true,
      data: {
        rooms
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rooms"
    });
  }
}


export async function getRoom(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}

const room =
  await roomsService.getRoom(
    req.params.id,
    req.userId
  );

    return res.status(200).json({
      success: true,
      data: {
        room
      }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Room not found"
    });
  }
}

export async function createRoom(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const input =
      createRoomSchema.parse(
        req.body
      );

    const room =
      await roomsService.createRoom(
        req.userId,
        input
      );

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: {
        room
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create room"
    });
  }
}

export async function updateRoom(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const input =
      updateRoomSchema.parse(
        req.body
      );

    const room =
      await roomsService.updateRoom(
        req.params.id,
        req.userId,
        input
      );

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: {
        room
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update room"
    });
  }
}

export async function leaveRoom(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    await roomsService.leaveRoom(req.params.id, req.userId);
    return res.status(200).json({ success: true, message: 'Conversation removed from your chat list' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Unable to remove conversation' });
  }
}


export async function deleteRoom(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await roomsService.deleteRoom(
      req.params.id,
      req.userId
    );

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete room"
    });
  }
}

export async function addMember(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const input =
      addMemberSchema.parse(
        req.body
      );

    const result =
      await roomsService.addMember(
        req.params.id,
        req.userId,
        input.userId
      );

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: {
        member: result
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to add member"
    });
  }
}

export async function removeMember(
  req: Request< { id: string; userId: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await roomsService.removeMember(
      req.params.id,
      req.userId,
      req.params.userId
    );

    return res.status(200).json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove member"
    });
  }
}

export async function createDirectRoom(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const input =
      createDirectRoomSchema.parse(
        req.body
      );

    const room =
      await roomsService.createDirectRoom(
        req.userId,
        input.userId
      );

    return res.status(201).json({
      success: true,
      message: "Conversation ready",
      data: {
        room
      }
    });
  } catch (error) {
    console.error(
      "Create direct room error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create conversation"
    });
  }
}