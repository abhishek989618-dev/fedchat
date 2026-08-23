import { prisma } from "../../config/database.js";

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: {
                email
            },
            include: {
                role: true
            }
        });
    }

    async findUserByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone }, include: { role: true } });
  }

  async findUserByUsername(username: string) {
        return prisma.user.findUnique({
            where: {
                username
            }
        });
    }

    async findUserById(id: string) {
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

    async findRoleByName(name: string) {
        return prisma.role.findUnique({
            where: {
                name
            }
        });
    }

    async createUser(data: {
        email: string;
        username: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string;
        roleId: string;
    }) {
        return prisma.user.create({
            data,
            include: {
                role: true
            }
        });
    }

    async createSession(data: {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}) {

  return prisma.userSession.create({
    data
  });
}

    async findSessionById(id: string) {
        return prisma.userSession.findUnique({
            where: {
                id
            },
            include: {
                user: {
                    include: {
                        role: true
                    }
                }
            }
        });
    }

    async revokeSession(id: string) {
        return prisma.userSession.update({
            where: {
                id
            },
            data: {
                revokedAt: new Date()
            }
        });
    }

    async updateSessionToken(
  id: string,
  refreshTokenHash: string,
  expiresAt: Date
) {
  return prisma.userSession.update({
    where: {
      id
    },
    data: {
      refreshTokenHash,
      expiresAt,
      revokedAt: null
    }
  });
}
}