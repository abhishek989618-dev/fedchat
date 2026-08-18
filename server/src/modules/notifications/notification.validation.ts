
import { z } from "zod";

export const createNotificationSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(
        200,
        "Title must not exceed 200 characters"
      ),

    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(
        5000,
        "Message must not exceed 5000 characters"
      ),

    type: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional()
  });

export const notificationIdSchema =
  z.object({
    notificationId: z
      .string()
      .uuid(
        "Invalid notification ID"
      )
  });

export type CreateNotificationInput =
  z.infer<
    typeof createNotificationSchema
  >;

