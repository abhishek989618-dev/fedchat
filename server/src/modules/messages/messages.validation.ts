import { z } from "zod";

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(5000, "Message content is too long"),

  messageType: z
    .string()
    .trim()
    .min(1)
    .default("text")
});

export const forwardMessageSchema = z.object({
  roomIds: z.array(z.string().uuid()).min(1).max(20),
});

export const updateMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(5000, "Message content is too long")
});