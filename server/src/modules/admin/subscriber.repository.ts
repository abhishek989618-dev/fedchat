
import {prisma }from "../../config/database.js";

export const subscriberRepository = {
  // =====================================================
  // CREATE
  // =====================================================

  async create(data: {
    userId: string;
    planId: string;
    accessLevel: "FULL" | "READONLY" | "LOCKED";
    startsAt: Date;
    expiresAt: Date;
    isActive?: boolean;
  }) {
    return prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        accessLevel: data.accessLevel,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        isActive: data.isActive ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  },

  // =====================================================
  // READ ALL
  // =====================================================

  async findAll() {
    return prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // =====================================================
  // READ ONE
  // =====================================================

  async findById(id: string) {
    return prisma.subscription.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  },

  // =====================================================
  // UPDATE
  // =====================================================

  async update(
    id: string,
    data: {
      planId?: string;
      accessLevel?: "FULL" | "READONLY" | "LOCKED";
      startsAt?: Date;
      expiresAt?: Date;
      isActive?: boolean;
    }
  ) {
    return prisma.subscription.update({
      where: {
        id,
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  },

  // =====================================================
  // DELETE
  // =====================================================

  async delete(id: string) {
    return prisma.subscription.delete({
      where: {
        id,
      },
    });
  },

  // =====================================================
  // USER / PLAN VALIDATION
  // =====================================================

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

  async findPlanById(planId: string) {
    return prisma.subscriptionPlan.findUnique({
      where: {
        id: planId,
      },
    });
  },
};

