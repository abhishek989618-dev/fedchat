import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase().trim()),

  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can contain only letters, numbers and underscores"
    ),

  password: z
    .string()
    .min(8)
    .max(100),

  firstName: z
    .string()
    .min(1)
    .max(50),

  lastName: z
    .string()
    .min(1)
    .max(50),

  phone: z 
  .string() 
  .trim() 
  .min(7) 
  .max(20)
  .optional(),
    
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1).max(100).transform((value) => value.trim()),
  password: z.string().min(1)
});

export type LoginInput =
  z.infer<typeof loginSchema>;


export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
});

export type RefreshTokenInput =
  z.infer<typeof refreshTokenSchema>;