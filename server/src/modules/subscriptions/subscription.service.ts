
import { subscriptionRepository } from "./subscription.repository.js";

type AccessLevel = "FULL" | "READONLY" | "LOCKED";

export const subscriptionService = {
  // -----------------------------
  // Plans
  // -----------------------------

  async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    accessLevel: AccessLevel;
    maxGroups?: number | null;
    maxMembersPerGroup?: number | null;
    maxCommunities?: number | null;
    maxGuestsPerGroup?: number | null;
  }) {
    if (data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (data.durationDays <= 0) {
      throw new Error(
        "Duration must be greater than 0 days"
      );
    }

    return subscriptionRepository.createPlan(data);
  },

  async getPlans(options?: { includeInactive?: boolean }) {
    return subscriptionRepository.findAllPlans(options);
  },

  async getPlan(id: string) {
    const plan =
      await subscriptionRepository.findPlanById(id);

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    return plan;
  },

  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      durationDays?: number;
      accessLevel?: AccessLevel;
      isActive?: boolean;
      maxGroups?: number | null;
      maxMembersPerGroup?: number | null;
      maxCommunities?: number | null;
      maxGuestsPerGroup?: number | null;
    }
  ) {
    await this.getPlan(id);

    if (
      data.price !== undefined &&
      data.price < 0
    ) {
      throw new Error("Price cannot be negative");
    }

    if (
      data.durationDays !== undefined &&
      data.durationDays <= 0
    ) {
      throw new Error(
        "Duration must be greater than 0 days"
      );
    }

    return subscriptionRepository.updatePlan(
      id,
      data
    );
  },

  // -----------------------------
  // User Subscription
  // -----------------------------

  async subscribeUser(
    _userId: string,
    _planId: string
  ) {
    throw new Error("Direct subscription activation is disabled. Submit a manual payment request for platform-admin approval.");
  },

  async getCurrentSubscription(
    userId: string
  ) {
    await this.ensureUserExists(userId);

    const subscription =
      await subscriptionRepository.findActiveSubscription(
        userId
      );

    if (!subscription) {
      return null;
    }

    return subscription;
  },

  async getUserSubscriptions(
    userId: string
  ) {
    await this.ensureUserExists(userId);

    return subscriptionRepository.findSubscriptionsByUserId(
      userId
    );
  },

  // -----------------------------
  // Access Control
  // -----------------------------

  async getAccessLevel(
    userId: string
  ): Promise<AccessLevel> {
    const subscription =
      await subscriptionRepository.findActiveSubscription(
        userId
      );

    if (!subscription) {
      return "LOCKED";
    }

    return subscription.accessLevel;
  },

  async canRead(
    userId: string
  ) {
    const accessLevel =
      await this.getAccessLevel(userId);

    return (
      accessLevel === "FULL" ||
      accessLevel === "READONLY"
    );
  },

  async canSend(
    userId: string
  ) {
    const accessLevel =
      await this.getAccessLevel(userId);

    return accessLevel === "FULL";
  },

  async ensureCanRead(
    userId: string
  ) {
    const accessLevel =
      await this.getAccessLevel(userId);

    if (
      accessLevel === "LOCKED"
    ) {
      throw new Error(
        "Your subscription does not allow chat access"
      );
    }

    return true;
  },

  async ensureCanSend(userId: string) {
    const subscription = await subscriptionRepository.findActiveSubscription(userId);
    // Free users always retain normal one-to-one messaging access.
    // A paid READONLY plan can explicitly restrict sending.
    if (subscription?.accessLevel === "READONLY") {
      throw new Error("Your subscription is read-only");
    }
    return true;
  },

  async ensurePaidFeature(userId: string) {
    const subscription = await subscriptionRepository.findActiveSubscription(userId);
    if (!subscription || subscription.accessLevel !== "FULL") {
      throw new Error("An active FULL subscription is required for this feature");
    }
    return subscription;
  },

  // -----------------------------
  // Expiration
  // -----------------------------

  async deactivateExpiredSubscriptions() {
    return subscriptionRepository.deactivateExpiredSubscriptions();
  },

  // -----------------------------
  // Helpers
  // -----------------------------

  async ensureUserExists(
    userId: string
  ) {
    const user =
      await subscriptionRepository.findUserById(
        userId
      );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },



async activateSubscription(
  userId: string,
  planId: string
) {
  const plan =
    await subscriptionRepository.findPlanById(
      planId
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

  const startsAt = new Date();

  const expiresAt = new Date(
    startsAt
  );

  expiresAt.setDate(
    expiresAt.getDate() +
      plan.durationDays
  );

  return subscriptionRepository.createSubscription({
    userId,
    planId,
    accessLevel: plan.accessLevel,
    startsAt,
    expiresAt,
  });
},

};