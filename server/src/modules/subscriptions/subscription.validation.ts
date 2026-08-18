
import { z } from "zod";

const accessLevelSchema = z.enum([
  "FULL",
  "READONLY",
  "LOCKED",
]);

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(100),

  description: z
    .string()
    .max(500)
    .optional(),

  price: z
    .number()
    .min(0, "Price cannot be negative"),

  durationDays: z
    .number()
    .int()
    .positive("Duration must be greater than 0"),

  accessLevel: accessLevelSchema,

  maxGroups: z.number().int().positive().nullable().optional(),
  maxMembersPerGroup: z.number().int().positive().nullable().optional(),
  maxCommunities: z.number().int().positive().nullable().optional(),
  maxGuestsPerGroup: z.number().int().positive().nullable().optional(),
});

export const updatePlanSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  description: z
    .string()
    .max(500)
    .optional(),

  price: z
    .number()
    .min(0)
    .optional(),

  durationDays: z
    .number()
    .int()
    .positive()
    .optional(),

  accessLevel: accessLevelSchema.optional(),

  isActive: z
    .boolean()
    .optional(),

  maxGroups: z.number().int().positive().nullable().optional(),
  maxMembersPerGroup: z.number().int().positive().nullable().optional(),
  maxCommunities: z.number().int().positive().nullable().optional(),
  maxGuestsPerGroup: z.number().int().positive().nullable().optional(),
});

export const subscribeSchema = z.object({
  planId: z
    .string()
    .uuid("Invalid subscription plan ID"),
});

