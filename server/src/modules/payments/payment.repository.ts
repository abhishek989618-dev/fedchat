
import {prisma} from "../../config/database.js";

type PaymentRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export const paymentRepository = {
  // =====================================================
  // PAYMENT METHODS
  // =====================================================

  async createPaymentMethod(data: {
    name: string;
    type?: "UPI" | "BANK" | "OTHER";
    description?: string;
    qrCodeUrl?: string;
    paymentNumber?: string;
    upiId?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({ data: { isDefault: false } });
    }
    return prisma.paymentMethod.create({
      data: {
        name: data.name,
        type: data.type || "UPI",
        description: data.description,
        qrCodeUrl: data.qrCodeUrl,
        paymentNumber: data.paymentNumber,
        upiId: data.upiId,
        isDefault: Boolean(data.isDefault),
      },
    });
  },

  async findAllPaymentMethods() {
    return prisma.paymentMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async findPaymentMethodById(id: string) {
    return prisma.paymentMethod.findUnique({
      where: {
        id,
      },
    });
  },

  async updatePaymentMethod(
    id: string,
    data: {
      name?: string;
      description?: string;
      qrCodeUrl?: string;
      paymentNumber?: string;
      upiId?: string;
      isDefault?: boolean;
      isActive?: boolean;
    }
  ) {
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }
    return prisma.paymentMethod.update({
      where: {
        id,
      },
      data,
    });
  },

  // =====================================================
  // PAYMENT REQUESTS
  // =====================================================

  async createPaymentRequest(data: {
    userId: string;
    planId: string;
    paymentMethodId: string;
    transactionId: string;
    screenshotUrl?: string;
    amount: number;
  }) {
    return prisma.paymentRequest.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        paymentMethodId:
          data.paymentMethodId,
        transactionId:
          data.transactionId,
        screenshotUrl:
          data.screenshotUrl,
        amount: data.amount,
        status: "PENDING",
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
    });
  },

  async findPaymentRequestById(
    id: string
  ) {
    return prisma.paymentRequest.findUnique({
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
        paymentMethod: true,
      },
    });
  },

  async findPaymentRequestsByUserId(
    userId: string
  ) {
    return prisma.paymentRequest.findMany({
      where: {
        userId,
      },
      include: {
        plan: true,
        paymentMethod: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findPaymentRequestsByStatus(
    status: PaymentRequestStatus
  ) {
    return prisma.paymentRequest.findMany({
      where: {
        status,
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
        paymentMethod: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findPaymentRequestByTransactionId(
    transactionId: string
  ) {
    return prisma.paymentRequest.findFirst({
      where: {
        transactionId,
      },
    });
  },

  async updatePaymentRequestStatus(
    id: string,
    data: {
      status: PaymentRequestStatus;
      reviewedById?: string;
      reviewedAt?: Date;
      rejectionReason?: string;
    }
  ) {
    return prisma.paymentRequest.update({
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
        paymentMethod: true,
      },
    });
  },

  // =====================================================
  // VALIDATION HELPERS
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

  async findPendingPaymentForUserAndPlan(
    userId: string,
    planId: string
  ) {
    return prisma.paymentRequest.findFirst({
      where: {
        userId,
        planId,
        status: "PENDING",
      },
    });
  },
// =====================================================
// ADMIN REVIEW
// =====================================================

async approvePaymentRequest(
  id: string,
  reviewedById: string
) {
  return prisma.paymentRequest.update({
    where: {
      id,
    },
    data: {
      status: "APPROVED",
      reviewedById,
      reviewedAt: new Date(),
      rejectionReason: null,
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
      paymentMethod: true,
    },
  });
},

async rejectPaymentRequest(
  id: string,
  reviewedById: string,
  rejectionReason: string
) {
  return prisma.paymentRequest.update({
    where: {
      id,
    },
    data: {
      status: "REJECTED",
      reviewedById,
      reviewedAt: new Date(),
      rejectionReason,
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
      paymentMethod: true,
    },
  });
},

};

