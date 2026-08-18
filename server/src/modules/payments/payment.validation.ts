
import { z } from "zod";

export const createPaymentMethodSchema =
  z.object({
    name: z
      .string()
      .min(2)
      .max(100),

    type: z.enum(["UPI", "BANK", "OTHER"]).default("UPI"),

    description: z
      .string()
      .max(500)
      .optional(),

    qrCodeUrl: z
      .string()
      .url()
      .optional(),

    paymentNumber: z
      .string()
      .max(100)
      .optional(),

    upiId: z
      .string()
      .max(200)
      .optional(),

    isDefault: z.boolean().optional(),
  });

export const updatePaymentMethodSchema =
  z.object({
    name: z
      .string()
      .min(2)
      .max(100)
      .optional(),

    type: z.enum(["UPI", "BANK", "OTHER"]).optional(),

    description: z
      .string()
      .max(500)
      .optional(),

    qrCodeUrl: z
      .string()
      .url()
      .optional(),

    paymentNumber: z
      .string()
      .max(100)
      .optional(),

    upiId: z
      .string()
      .max(200)
      .optional(),

    isDefault: z.boolean().optional(),

    isActive: z
      .boolean()
      .optional(),
  });

export const createPaymentRequestSchema =
  z.object({
    planId: z
      .string()
      .uuid(),

    paymentMethodId: z
      .string()
      .uuid(),

    transactionId: z
      .string()
      .min(3)
      .max(255),

    screenshotUrl: z
      .string()
      .url()
      .optional(),
  });

export const paymentStatusSchema =
  z.object({
    status: z.enum([
      "PENDING",
      "APPROVED",
      "REJECTED",
    ]),
  });

export const rejectPaymentSchema =
  z.object({
    rejectionReason: z
      .string()
      .min(
        3,
        "Rejection reason is required"
      )
      .max(500),
  });

