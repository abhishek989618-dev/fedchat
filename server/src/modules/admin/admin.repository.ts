
import { prisma } from "../../config/database.js";

export const adminRepository = {
  // =====================================================
  // USERS
  // =====================================================

  async findUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateUserStatus(
    id: string,
    status: string
  ) {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        status: status as never,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true,
      },
    });
  },

  // =====================================================
  // FORCE LOGOUT
  // =====================================================

  async forceLogoutUser(id: string) {
    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
        },
      });

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return user;
  },
};