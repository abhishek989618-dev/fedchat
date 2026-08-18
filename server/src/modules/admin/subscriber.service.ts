
import {
  subscriberRepository,
} from "./subscriber.repository.js";

export const subscriberService = {
  // =====================================================
  // CREATE
  // =====================================================

  async createSubscriber(data: {
    userId: string;
    planId: string;
    accessLevel:
      | "FULL"
      | "READONLY"
      | "LOCKED";
    startsAt: Date;
    expiresAt: Date;
    isActive?: boolean;
  }) {
    // ---------------------------------------------
    // Validate user
    // ---------------------------------------------

    const user =
      await subscriberRepository.findUserById(
        data.userId
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    // ---------------------------------------------
    // Validate plan
    // ---------------------------------------------

    const plan =
      await subscriberRepository.findPlanById(
        data.planId
      );

    if (!plan) {
      throw new Error(
        "Subscription plan not found"
      );
    }

    if (!plan.isActive) {
      throw new Error(
        "Subscription plan is inactive"
      );
    }

    // ---------------------------------------------
    // Validate dates
    // ---------------------------------------------

    if (
      data.expiresAt <=
      data.startsAt
    ) {
      throw new Error(
        "Expiry date must be after start date"
      );
    }

    return subscriberRepository.create(
      data
    );
  },

  // =====================================================
  // GET ALL
  // =====================================================

  async getSubscribers() {
    return subscriberRepository.findAll();
  },

  // =====================================================
  // GET ONE
  // =====================================================

  async getSubscriber(id: string) {
    const subscriber =
      await subscriberRepository.findById(
        id
      );

    if (!subscriber) {
      throw new Error(
        "Subscriber not found"
      );
    }

    return subscriber;
  },

  // =====================================================
  // UPDATE
  // =====================================================

  async updateSubscriber(
    id: string,
    data: {
      planId?: string;
      accessLevel?:
        | "FULL"
        | "READONLY"
        | "LOCKED";
      startsAt?: Date;
      expiresAt?: Date;
      isActive?: boolean;
    }
  ) {
    // ---------------------------------------------
    // Existing subscription
    // ---------------------------------------------

    const existing =
      await subscriberRepository.findById(
        id
      );

    if (!existing) {
      throw new Error(
        "Subscriber not found"
      );
    }

    // ---------------------------------------------
    // Validate plan if changed
    // ---------------------------------------------

    if (data.planId) {
      const plan =
        await subscriberRepository.findPlanById(
          data.planId
        );

      if (!plan) {
        throw new Error(
          "Subscription plan not found"
        );
      }

      if (!plan.isActive) {
        throw new Error(
          "Subscription plan is inactive"
        );
      }
    }

    // ---------------------------------------------
    // Validate dates
    // ---------------------------------------------

    const startsAt =
      data.startsAt ??
      existing.startsAt;

    const expiresAt =
      data.expiresAt ??
      existing.expiresAt;

    if (
      expiresAt <= startsAt
    ) {
      throw new Error(
        "Expiry date must be after start date"
      );
    }

    return subscriberRepository.update(
      id,
      data
    );
  },

  // =====================================================
  // CANCEL
  // =====================================================

  async cancelSubscriber(
    id: string
  ) {
    const subscriber =
      await subscriberRepository.findById(
        id
      );

    if (!subscriber) {
      throw new Error(
        "Subscriber not found"
      );
    }

    if (!subscriber.isActive) {
      throw new Error(
        "Subscription is already inactive"
      );
    }

    return subscriberRepository.update(
      id,
      {
        isActive: false,
      }
    );
  },

  // =====================================================
  // DELETE
  // =====================================================

  async deleteSubscriber(
    id: string
  ) {
    const subscriber =
      await subscriberRepository.findById(
        id
      );

    if (!subscriber) {
      throw new Error(
        "Subscriber not found"
      );
    }

    return subscriberRepository.delete(
      id
    );
  },
};

