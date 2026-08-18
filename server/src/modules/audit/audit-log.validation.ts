
import { z } from "zod";

export const auditLogQuerySchema = z.object({
  actorId: z.string().uuid().optional(),

  action: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  entity: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  entityId: z
    .string()
    .uuid()
    .optional(),
});

export const auditLogIdSchema = z.object({
  id: z.string().uuid(),
});
