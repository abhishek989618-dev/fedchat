import type {
  Request,
  Response
} from "express";

import {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema
} from "./roles.validation.js";

import { RolesRepository } from "./roles.repository.js";
import { RolesService } from "./roles.service.js";

const rolesService =
  new RolesService(
    new RolesRepository()
  );

export async function getRoles(
  req: Request,
  res: Response
) {
  try {
    const roles =
      await rolesService.getAllRoles();

    return res.status(200).json({
      success: true,
      data: {
        roles
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles"
    });
  }
}

export async function getRole(
  req: Request<{ id: string}>,
  res: Response
) {
  try {
    const role =
      await rolesService.getRoleById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: {
        role
      }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Role not found"
    });
  }
}

export async function createRole(
  req: Request,
  res: Response
) {
  try {
    const input =
      createRoleSchema.parse(
        req.body
      );

    const role =
      await rolesService.createRole(
        input
      );

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: {
        role
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create role"
    });
  }
}

export async function updateRole(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input =
      updateRoleSchema.parse(
        req.body
      );

    const role =
      await rolesService.updateRole(
        req.params.id,
        input
      );

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: {
        role
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update role"
    });
  }
}

export async function deleteRole(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    await rolesService.deleteRole(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete role"
    });
  }
}

export async function assignPermission(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const input =
      assignPermissionSchema.parse(
        req.body
      );

    const result =
      await rolesService.assignPermission(
        req.params.id,
        input.permissionId
      );

    return res.status(201).json({
      success: true,
      message: "Permission assigned successfully",
      data: {
        rolePermission: result
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign permission"
    });
  }
}

export async function removePermission(
  req: Request<{ id: string; permissionId: string }>,
  res: Response
) {
  try {
    await rolesService.removePermission(
      req.params.id,
      req.params.permissionId
    );

    return res.status(200).json({
      success: true,
      message: "Permission removed successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove permission"
    });
  }
}

export async function getPermissions(
  req: Request,
  res: Response
) {
  try {
    const permissions =
      await rolesService.getAllPermissions();

    return res.status(200).json({
      success: true,
      data: {
        permissions
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions"
    });
  }
}