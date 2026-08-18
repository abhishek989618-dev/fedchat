import type {
  Request,
  Response
} from "express";

import {
  createMessageSchema,
  updateMessageSchema,
  forwardMessageSchema
} from "./messages.validation.js";

import {
  messagesService
} from "./messages.service.js";

export async function createMessage(
  req: Request<{ roomId: string }>,
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
      createMessageSchema.parse(
        req.body
      );

    const message =
      await messagesService.createMessage(
        req.params.roomId,
        req.userId,
        input.content,
        input.messageType
      );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message
      }
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to send message";

    const status =
      message === "Room not found"
        ? 404
        : message.includes("not a member")
          ? 403
          : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
}

export async function getMessages(
  req: Request<{ roomId: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const messages =
      await messagesService.getMessages(
        req.params.roomId,
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        messages
      }
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch messages";

    const status =
      message === "Room not found"
        ? 404
        : message.includes("not a member")
          ? 403
          : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
}

export async function updateMessage(
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
      updateMessageSchema.parse(
        req.body
      );

    const message =
      await messagesService.updateMessage(
        req.params.id,
        req.userId,
        input.content
      );

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: {
        message
      }
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update message";

    const status =
      message === "Message not found"
        ? 404
        : message.includes("only update")
          ? 403
          : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
}

export async function deleteMessage(
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

    await messagesService.deleteMessage(
      req.params.id,
      req.userId
    );

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete message";

    const status =
      message === "Message not found"
        ? 404
        : message.includes("only delete")
          ? 403
          : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
}

export async function forwardMessage(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const input = forwardMessageSchema.parse(req.body);
    const messages = await messagesService.forwardMessage(req.params.id, req.userId, input.roomIds);
    return res.status(201).json({ success: true, data: { messages } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to forward message";
    const status = message === "Message not found" ? 404 : message.includes("not a member") ? 403 : 400;
    return res.status(status).json({ success: false, message });
  }
}
