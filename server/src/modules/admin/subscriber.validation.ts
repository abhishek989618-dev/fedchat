
import { z } from "zod";

const accessLevelSchema = z.enum([
  "FULL",
  "READONLY",
  "LOCKED",
]);

export const createSubscriberSchema = z
  .object({
    userId: z.string().uuid(),

    planId: z.string().uuid(),

    accessLevel: accessLevelSchema,

    startsAt: z.coerce.date(),

    expiresAt: z.coerce.date(),

    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) =>
      data.expiresAt > data.startsAt,
    {
      message:
        "Expiry date must be after start date",
      path: ["expiresAt"],
    }
  );

export const updateSubscriberSchema = z
  .object({
    planId: z.string().uuid().optional(),

    accessLevel:
      accessLevelSchema.optional(),

    startsAt: z.coerce.date().optional(),

    expiresAt: z.coerce.date().optional(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.startsAt &&
        data.expiresAt
      ) {
        return (
          data.expiresAt >
          data.startsAt
        );
      }

      return true;
    },
    {
      message:
        "Expiry date must be after start date",
      path: ["expiresAt"],
    }
  );

