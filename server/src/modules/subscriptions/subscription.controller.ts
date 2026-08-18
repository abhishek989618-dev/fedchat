
import type { Request, Response } from "express";

import { subscriptionService } from "./subscription.service.js";
import {
  createPlanSchema,
  updatePlanSchema,
  subscribeSchema,
} from "./subscription.validation.js";

// ------------------------------------
// Plans
// ------------------------------------

export async function createPlan(
  req: Request,
  res: Response
) {
  try {
    const input =
      createPlanSchema.parse(req.body);

    const plan =
      await subscriptionService.createPlan(input);

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create subscription plan",
    });
  }
}

export async function getPlans(
  _req: Request,
  res: Response
) {
  try {
    const plans =
      await subscriptionService.getPlans();

    return res.status(200).json({
      success: true,
      data: {
        plans,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
    });
  }
}

export async function getPlan(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const plan =
      await subscriptionService.getPlan(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Subscription plan not found",
    });
  }
}

export async function updatePlan(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input =
      updatePlanSchema.parse(req.body);

    const plan =
      await subscriptionService.updatePlan(
        req.params.id,
        input
      );

    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update subscription plan",
    });
  }
}

// ------------------------------------
// User subscription
// ------------------------------------

export async function subscribe(
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
      subscribeSchema.parse(req.body);

    const subscription =
      await subscriptionService.subscribeUser(
        req.userId,
        input.planId
      );

    return res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      data: {
        subscription,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to activate subscription",
    });
  }
}

export async function getCurrentSubscription(
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

    const subscription =
      await subscriptionService.getCurrentSubscription(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        subscription,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch subscription",
    });
  }
}

export async function getMySubscriptions(
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

    const subscriptions =
      await subscriptionService.getUserSubscriptions(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        subscriptions,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch subscriptions",
    });
  }
}

export async function getMyAccessLevel(
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

    const accessLevel =
      await subscriptionService.getAccessLevel(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        accessLevel,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to determine access level",
    });
  }
}

