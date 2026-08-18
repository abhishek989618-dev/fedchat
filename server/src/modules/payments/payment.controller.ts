import type {
  Request,
  Response,
} from "express";

import { paymentService } from "./payment.service.js";

import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  createPaymentRequestSchema,
  rejectPaymentSchema,
} from "./payment.validation.js";

// =====================================================
// PAYMENT METHODS
// =====================================================

export async function createPaymentMethod(
  req: Request,
  res: Response
) {
  try {
    const input =
      createPaymentMethodSchema.parse(
        req.body
      );

    const method =
      await paymentService.createPaymentMethod(
        input
      );

    return res.status(201).json({
      success: true,
      message:
        "Payment method created successfully",
      data: {
        paymentMethod: method,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create payment method",
    });
  }
}

export async function getPaymentMethods(
  _req: Request,
  res: Response
) {
  try {
    const methods =
      await paymentService.getPaymentMethods();

    return res.status(200).json({
      success: true,
      data: {
        paymentMethods: methods,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch payment methods",
    });
  }
}

export async function getPaymentMethod(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const method =
      await paymentService.getPaymentMethod(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        paymentMethod: method,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Payment method not found",
    });
  }
}

export async function updatePaymentMethod(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input =
      updatePaymentMethodSchema.parse(
        req.body
      );

    const method =
      await paymentService.updatePaymentMethod(
        req.params.id,
        input
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment method updated successfully",
      data: {
        paymentMethod: method,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update payment method",
    });
  }
}

// =====================================================
// PAYMENT REQUEST
// =====================================================

export async function createPaymentRequest(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const input =
      createPaymentRequestSchema.parse(
        req.body
      );

    const request =
      await paymentService.createPaymentRequest({
        userId: req.userId,
        planId: input.planId,
        paymentMethodId:
          input.paymentMethodId,
        transactionId:
          input.transactionId,
        screenshotUrl:
          input.screenshotUrl,
      });

    return res.status(201).json({
      success: true,
      message:
        "Payment request submitted successfully",
      data: {
        paymentRequest: request,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to submit payment request",
    });
  }
}

export async function getMyPaymentRequests(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const requests =
      await paymentService.getMyPaymentRequests(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        paymentRequests: requests,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch payment requests",
    });
  }
}

export async function getPaymentRequest(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const request =
      await paymentService.getPaymentRequest(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        paymentRequest: request,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Payment request not found",
    });
  }
}

// =====================================================
// ADMIN
// =====================================================

export async function getPendingPaymentRequests(
  _req: Request,
  res: Response
) {
  try {
    const requests =
      await paymentService.getPendingPaymentRequests();

    return res.status(200).json({
      success: true,
      data: {
        paymentRequests: requests,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending payment requests",
    });
  }
}

export async function getPaymentRequestsByStatus(
  req: Request<{ status: string }>,
  res: Response
) {
  try {
    const status =
      req.params.status.toUpperCase();

    if (
      status !== "PENDING" &&
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const requests =
      await paymentService.getPaymentRequestsByStatus(
        status
      );

    return res.status(200).json({
      success: true,
      data: {
        paymentRequests: requests,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch payment requests",
    });
  }
}

export async function approvePaymentRequest(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result =
      await paymentService.approvePaymentRequest(
        req.params.id,
        req.userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment approved and subscription activated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve payment",
    });
  }
}

export async function rejectPaymentRequest(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const input =
      rejectPaymentSchema.parse(
        req.body
      );

    const paymentRequest =
      await paymentService.rejectPaymentRequest(
        req.params.id,
        req.userId,
        input.rejectionReason
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment request rejected successfully",
      data: {
        paymentRequest,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reject payment",
    });
  }
}

