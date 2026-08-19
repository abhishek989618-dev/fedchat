
import { prisma } from "../../config/database.js";

export const adminRepository = {
  // =====================================================
  // USERS
  // =====================================================

  async findUsers(params?: {
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Math.floor(params?.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(5, Math.floor(params?.pageSize ?? 10))
    );
    const skip = (page - 1) * pageSize;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: pageSize,
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
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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