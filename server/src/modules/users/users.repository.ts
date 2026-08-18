import { prisma } from "../../config/database.js";

export class UsersRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async search(query: string, excludeUserId: string) {
    return prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, firstName: true, lastName: true, avatar: true, bannerUrl: true, bio: true },
      take: 20,
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: {
        username
      }
    });
  }

  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string;
      avatar?: string | null;
      bannerUrl?: string | null;
      bio?: string | null;
    }
  ) {
    return prisma.user.update({
      where: {
        id
      },
      data,
      include: {
        role: true
      }
    });
  }

  async updatePassword(
    id: string,
    passwordHash: string
  ) {
    return prisma.user.update({
      where: {
        id
      },
      data: {
        passwordHash
      }
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: {
        id
      }
    });
  }
}