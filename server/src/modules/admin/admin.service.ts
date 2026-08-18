
import { adminRepository } from "./admin.repository.js";

export const adminService = {
  // =====================================================
  // USERS
  // =====================================================

  async getUsers() {
    return adminRepository.findUsers();
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

