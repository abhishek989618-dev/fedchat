
import { adminRepository } from "./admin.repository.js";
import { subscriptionService } from "../subscriptions/subscription.service.js";

export const adminService = {
  // =====================================================
  // USERS
  // =====================================================

  async getUsers(params?: { page?: number; pageSize?: number }) {
    return adminRepository.findUsers(params);
  },

  // =====================================================
  // PLAN MANAGEMENT
  // =====================================================

  async getPlansForAdmin() {
    return subscriptionService.getPlans({ includeInactive: true });
  },

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
    return subscriptionService.createPlan(data);
  },

  async updatePlan(id: string, data: {
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
  }) {
    return subscriptionService.updatePlan(id, data);
  },

  async getUser(id: string) {
    const user =
      await adminRepository.findUserById(id);

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return user;
  },

  async updateUserStatus(
    id: string,
    status: string
  ) {
    const user =
      await adminRepository.findUserById(id);

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return adminRepository.updateUserStatus(
      id,
      status
    );
  },

  // =====================================================
  // FORCE LOGOUT
  // =====================================================

  async forceLogoutUser(id: string) {
    const user =
      await adminRepository.findUserById(id);

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return adminRepository.forceLogoutUser(
      id
    );
  },
};

