import { prisma } from "../../config/database.js";

export class RolesRepository {
  async findAll() {
    return prisma.role.findMany({
      orderBy: {
        name: "asc"
      },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true
          }
        },
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.role.findUnique({
      where: {
        id
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true
          }
        },
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: {
        name
      }
    });
  }

  async create(data: {
    name: string;
    description?: string;
  }) {
    return prisma.role.create({
      data
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
    }
  ) {
    return prisma.role.update({
      where: {
        id
      },
      data
    });
  }

  async delete(id: string) {
    return prisma.role.delete({
      where: {
        id
      }
    });
  }

  async findPermissionById(
    permissionId: string
  ) {
    return prisma.permission.findUnique({
      where: {
        id: permissionId
      }
    });
  }

  async addPermission(
    roleId: string,
    permissionId: string
  ) {
    return prisma.rolePermission.create({
      data: {
        roleId,
        permissionId
      },
      include: {
        permission: true
      }
    });
  }

  async removePermission(
    roleId: string,
    permissionId: string
  ) {
    return prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });
  }

  async findAllPermissions() {
    return prisma.permission.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }
}