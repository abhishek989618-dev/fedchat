
import type { Request, Response } from "express";

import { subscriberService } from "./subscriber.service.js";

import {
  createSubscriberSchema,
  updateSubscriberSchema,
} from "./subscriber.validation.js";

// =====================================================
// CREATE
// =====================================================

export async function createSubscriber(
  req: Request,
  res: Response
) {
  try {
    const input =
      createSubscriberSchema.parse(
        req.body
      );

    const subscriber =
      await subscriberService.createSubscriber(
        input
      );

    return res.status(201).json({
      success: true,
      message:
        "Subscriber created successfully",
      data: {
        subscriber,
      },
    });
  } catch (error) {
    console.error(
      "Create subscriber error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create subscriber",
    });
  }
}

// =====================================================
// GET ALL
// =====================================================

export async function getSubscribers(
  _req: Request,
  res: Response
) {
  try {
    const subscribers =
      await subscriberService.getSubscribers();

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
      },
    });
  } catch (error) {
    console.error(
      "Get subscribers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch subscribers",
    });
  }
}

// =====================================================
// GET ONE
// =====================================================

export async function getSubscriber(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const subscriber =
      await subscriberService.getSubscriber(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        subscriber,
      },
    });
  } catch (error) {
    console.error(
      "Get subscriber error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Subscriber not found",
    });
  }
}

// =====================================================
// UPDATE
// =====================================================

export async function updateSubscriber(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input =
      updateSubscriberSchema.parse(
        req.body
      );

    const subscriber =
      await subscriberService.updateSubscriber(
        req.params.id,
        input
      );

    return res.status(200).json({
      success: true,
      message:
        "Subscriber updated successfully",
      data: {
        subscriber,
      },
    });
  } catch (error) {
    console.error(
      "Update subscriber error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update subscriber",
    });
  }
}

// =====================================================
// CANCEL
// =====================================================

export async function cancelSubscriber(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const subscriber =
      await subscriberService.cancelSubscriber(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Subscriber cancelled successfully",
      data: {
        subscriber,
      },
    });
  } catch (error) {
    console.error(
      "Cancel subscriber error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel subscriber",
    });
  }
}

// =====================================================
// DELETE
// =====================================================

export async function deleteSubscriber(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    await subscriberService.deleteSubscriber(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Subscriber deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete subscriber error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete subscriber",
    });
  }
}

