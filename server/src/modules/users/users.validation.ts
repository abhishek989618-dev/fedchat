import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(50)
    .optional(),

  lastName: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  
  phone: z 
  .string() 
  .trim() 
  .min(7) 
  .max(20) 
  .optional(),

  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can contain only letters, numbers and underscores"
    )
    .optional(),

  avatar: z
    .string()
    .nullable()
    .optional(),

  bannerUrl: z
    .string()
    .nullable()
    .optional(),

  bio: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1),

  newPassword: z
    .string()
    .min(8)
    .max(100)
});

export type UpdateProfileInput =
  z.infer<typeof updateProfileSchema>;

export type ChangePasswordInput =
  z.infer<typeof changePasswordSchema>;