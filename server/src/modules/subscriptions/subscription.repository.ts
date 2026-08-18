
import {prisma} from "../../config/database.js";

export const subscriptionRepository = {
  // -----------------------------
  // Subscription Plans
  // -----------------------------

  async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    accessLevel: "FULL" | "READONLY" | "LOCKED";
    maxGroups?: number | null;
    maxMembersPerGroup?: number | null;
    maxCommunities?: number | null;
    maxGuestsPerGroup?: number | null;
  }) {
    return prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        accessLevel: data.accessLevel,
        maxGroups: data.maxGroups,
        maxMembersPerGroup: data.maxMembersPerGroup,
        maxCommunities: data.maxCommunities,
        maxGuestsPerGroup: data.maxGuestsPerGroup,
      },
    });
  },

  async findAllPlans() {
    return prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });
  },

  async findPlanById(id: string) {
    return prisma.subscriptionPlan.findUnique({
      where: {
        id,
      },
    });
  },

  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      durationDays?: number;
      accessLevel?: "FULL" | "READONLY" | "LOCKED";
      isActive?: boolean;
      maxGroups?: number | null;
      maxMembersPerGroup?: number | null;
      maxCommunities?: number | null;
      maxGuestsPerGroup?: number | null;
    }
  ) {
    return prisma.subscriptionPlan.update({
      where: {
        id,
      },
      data,
    });
  },

  // -----------------------------
  // User Subscriptions
  // -----------------------------

  async createSubscription(data: {
    userId: string;
    planId: string;
    accessLevel: "FULL" | "READONLY" | "LOCKED";
    startsAt: Date;
    expiresAt: Date;
  }) {
    return prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        accessLevel: data.accessLevel,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        isActive: true,
      },
      include: {
        plan: true,
      },
    });
  },

  async findActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        startsAt: {
          lte: new Date(),
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });
  },

  async findSubscriptionsByUserId(userId: string) {
    return prisma.subscription.findMany({
      where: {
        userId,
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findSubscriptionById(id: string) {
    return prisma.subscription.findUnique({
      where: {
        id,
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async deactivateSubscription(id: string) {
    return prisma.subscription.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  },

  async deactivateExpiredSubscriptions() {
    return prisma.subscription.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });
  },

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  },
};

