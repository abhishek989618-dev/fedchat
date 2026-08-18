import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Role name can contain only letters, numbers, underscores and hyphens"
    ),

  description: z
    .string()
    .max(255)
    .optional()
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Role name can contain only letters, numbers, underscores and hyphens"
    )
    .optional(),

  description: z
    .string()
    .max(255)
    .nullable()
    .optional()
});

export const assignPermissionSchema = z.object({
  permissionId: z
    .string()
    .uuid()
});

export type CreateRoleInput =
  z.infer<typeof createRoleSchema>;

export type UpdateRoleInput =
  z.infer<typeof updateRoleSchema>;

export type AssignPermissionInput =
  z.infer<typeof assignPermissionSchema>;