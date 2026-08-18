import { z } from "zod";

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100),

  description: z
    .string()
    .max(500)
    .optional(),

  isPrivate: z
    .boolean()
    .optional()
    .default(false),

  type: z
    .enum(["DIRECT", "GROUP"])
    .optional()
    .default("DIRECT"),
});

export const createDirectRoomSchema = z.object({
  userId: z.string().uuid(),
});

export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  description: z
    .string()
    .max(500)
    .nullable()
    .optional(),

  isPrivate: z
    .boolean()
    .optional(),
  avatar: z.string().max(1000).nullable().optional(),
  bannerUrl: z.string().max(1000).nullable().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateRoomInput =
  z.infer<typeof createRoomSchema>;

export type CreateDirectRoomInput =
  z.infer<typeof createDirectRoomSchema>;

export type UpdateRoomInput =
  z.infer<typeof updateRoomSchema>;

export type AddMemberInput =
  z.infer<typeof addMemberSchema>;