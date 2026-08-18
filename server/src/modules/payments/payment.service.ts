
import { paymentRepository } from "./payment.repository.js";
import { subscriptionService } from "../subscriptions/subscription.service.js";

export const paymentService = {
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
    if (!data.name?.trim()) {
      throw new Error(
        "Payment method name is required"
      );
    }

    return paymentRepository.createPaymentMethod({
      name: data.name.trim(),
      type: data.type || "UPI",
      description:
        data.description?.trim(),
      qrCodeUrl:
        data.qrCodeUrl?.trim(),
      paymentNumber:
        data.paymentNumber?.trim(),
      upiId:
        data.upiId?.trim(),
      isDefault: Boolean(data.isDefault),
    });
  },

  async getPaymentMethods() {
    return paymentRepository.findAllPaymentMethods();
  },

  async getPaymentMethod(id: string) {
    const method =
      await paymentRepository.findPaymentMethodById(
        id
      );

    if (!method) {
      throw new Error(
        "Payment method not found"
      );
    }

    return method;
  },

  async updatePaymentMethod(
    id: string,
    data: {
      name?: string;
      type?: "UPI" | "BANK" | "OTHER";
      description?: string;
      qrCodeUrl?: string;
      paymentNumber?: string;
      upiId?: string;
      isDefault?: boolean;
      isActive?: boolean;
    }
  ) {
    await this.getPaymentMethod(id);

    if (
      data.name !== undefined &&
      !data.name.trim()
    ) {
      throw new Error(
        "Payment method name cannot be empty"
      );
    }

    return paymentRepository.updatePaymentMethod(
      id,
      {
        ...data,
        name: data.name?.trim(),
        description:
          data.description?.trim(),
        qrCodeUrl:
          data.qrCodeUrl?.trim(),
        paymentNumber:
          data.paymentNumber?.trim(),
        upiId:
          data.upiId?.trim(),
      }
    );
  },

  // =====================================================
  // CREATE PAYMENT REQUEST
  // =====================================================

  async createPaymentRequest(data: {
    userId: string;
    planId: string;
    paymentMethodId: string;
    transactionId: string;
    screenshotUrl?: string;
  }) {
    // ---------------------------------------------
    // 1. User validation
    // ---------------------------------------------

    const user =
      await paymentRepository.findUserById(
        data.userId
      );

    if (!user) {
      throw new Error("User not found");
    }

    // ---------------------------------------------
    // 2. Plan validation
    // ---------------------------------------------

    const plan =
      await paymentRepository.findPlanById(
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
    // 3. Payment method validation
    // ---------------------------------------------

    const paymentMethod =
      await paymentRepository.findPaymentMethodById(
        data.paymentMethodId
      );

    if (!paymentMethod) {
      throw new Error(
        "Payment method not found"
      );
    }

    if (!paymentMethod.isActive) {
      throw new Error(
        "Payment method is inactive"
      );
    }

    // ---------------------------------------------
    // 4. Transaction ID validation
    // ---------------------------------------------

    const transactionId =
      data.transactionId?.trim();

    if (!transactionId) {
      throw new Error(
        "Transaction ID is required"
      );
    }

    // ---------------------------------------------
    // 5. Duplicate transaction check
    // ---------------------------------------------

    const existingTransaction =
      await paymentRepository.findPaymentRequestByTransactionId(
        transactionId
      );

    if (existingTransaction) {
      throw new Error(
        "This transaction ID has already been submitted"
      );
    }

    // ---------------------------------------------
    // 6. Existing pending request check
    // ---------------------------------------------

    const pendingRequest =
      await paymentRepository.findPendingPaymentForUserAndPlan(
        data.userId,
        data.planId
      );

    if (pendingRequest) {
      throw new Error(
        "You already have a pending payment request for this plan"
      );
    }

    // ---------------------------------------------
    // 7. Create pending request
    // ---------------------------------------------

    return paymentRepository.createPaymentRequest({
      userId: data.userId,
      planId: data.planId,
      paymentMethodId:
        data.paymentMethodId,
      transactionId,
      screenshotUrl:
        data.screenshotUrl?.trim(),
      amount: Number(plan.price),
    });
  },

  // =====================================================
  // USER PAYMENT REQUESTS
  // =====================================================

  async getMyPaymentRequests(
    userId: string
  ) {
    const user =
      await paymentRepository.findUserById(
        userId
      );

    if (!user) {
      throw new Error("User not found");
    }

    return paymentRepository.findPaymentRequestsByUserId(
      userId
    );
  },

  async getPaymentRequest(
    id: string
  ) {
    const request =
      await paymentRepository.findPaymentRequestById(
        id
      );

    if (!request) {
      throw new Error(
        "Payment request not found"
      );
    }

    return request;
  },

  // =====================================================
  // ADMIN PAYMENT REQUESTS
  // =====================================================

  async getPendingPaymentRequests() {
    return paymentRepository.findPaymentRequestsByStatus(
      "PENDING"
    );
  },

  async getPaymentRequestsByStatus(
    status:
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
  ) {
    return paymentRepository.findPaymentRequestsByStatus(
      status
    );
  },

async approvePaymentRequest(
  paymentRequestId: string,
  reviewedById: string
) {
  const paymentRequest =
    await paymentRepository.findPaymentRequestById(
      paymentRequestId
    );

  if (!paymentRequest) {
    throw new Error(
      "Payment request not found"
    );
  }

  if (
    paymentRequest.status !==
    "PENDING"
  ) {
    throw new Error(
      "Only pending payment requests can be approved"
    );
  }

  // ---------------------------------------------
  // Approve payment
  // ---------------------------------------------

  const approved =
    await paymentRepository.approvePaymentRequest(
      paymentRequestId,
      reviewedById
    );

  // ---------------------------------------------
  // Activate subscription
  // ---------------------------------------------

  const subscription =
    await subscriptionService.activateSubscription(
      paymentRequest.user.id,
      paymentRequest.plan.id
    );

  return {
    paymentRequest: approved,
    subscription,
  };
},

async rejectPaymentRequest(
  paymentRequestId: string,
  reviewedById: string,
  rejectionReason: string
) {
  const paymentRequest =
    await paymentRepository.findPaymentRequestById(
      paymentRequestId
    );

  if (!paymentRequest) {
    throw new Error(
      "Payment request not found"
    );
  }

  if (
    paymentRequest.status !==
    "PENDING"
  ) {
    throw new Error(
      "Only pending payment requests can be rejected"
    );
  }

  if (!rejectionReason?.trim()) {
    throw new Error(
      "Rejection reason is required"
    );
  }

  return paymentRepository.rejectPaymentRequest(
    paymentRequestId,
    reviewedById,
    rejectionReason.trim()
  );
},

};

