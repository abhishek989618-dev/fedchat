import { RolesRepository } from "./roles.repository.js";

import type {
  CreateRoleInput,
  UpdateRoleInput
} from "./roles.validation.js";

export class RolesService {
  constructor(
    private readonly repository: RolesRepository
  ) {}

  async getAllRoles() {
    return this.repository.findAll();
  }

  async getRoleById(id: string) {
    const role =
      await this.repository.findById(id);

    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  }

  async createRole(
    input: CreateRoleInput
  ) {
    const existing =
      await this.repository.findByName(
        input.name
      );

    if (existing) {
      throw new Error(
        "Role already exists"
      );
    }

    return this.repository.create(
      input
    );
  }

  async updateRole(
    id: string,
    input: UpdateRoleInput
  ) {
    const role =
      await this.repository.findById(id);

    if (!role) {
      throw new Error("Role not found");
    }

    if (input.name) {
      const existing =
        await this.repository.findByName(
          input.name
        );

      if (
        existing &&
        existing.id !== id
      ) {
        throw new Error(
          "Role name is already in use"
        );
      }
    }

    return this.repository.update(
      id,
      input
    );
  }

  async deleteRole(id: string) {
    const role =
      await this.repository.findById(id);

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.users.length > 0) {
      throw new Error(
        "Cannot delete a role assigned to users"
      );
    }

    await this.repository.delete(id);

    return true;
  }

  async assignPermission(
    roleId: string,
    permissionId: string
  ) {
    const role =
      await this.repository.findById(
        roleId
      );

    if (!role) {
      throw new Error("Role not found");
    }

    const permission =
      await this.repository.findPermissionById(
        permissionId
      );

    if (!permission) {
      throw new Error(
        "Permission not found"
      );
    }

    const alreadyAssigned =
      role.permissions.some(
        (item) =>
          item.permissionId ===
          permissionId
      );

    if (alreadyAssigned) {
      throw new Error(
        "Permission already assigned to this role"
      );
    }

    return this.repository.addPermission(
      roleId,
      permissionId
    );
  }

  async removePermission(
    roleId: string,
    permissionId: string
  ) {
    const role =
      await this.repository.findById(
        roleId
      );

    if (!role) {
      throw new Error("Role not found");
    }

    const permission =
      role.permissions.find(
        (item) =>
          item.permissionId ===
          permissionId
      );

    if (!permission) {
      throw new Error(
        "Permission is not assigned to this role"
      );
    }

    await this.repository.removePermission(
      roleId,
      permissionId
    );

    return true;
  }

  async getAllPermissions() {
    return this.repository.findAllPermissions();
  }
}