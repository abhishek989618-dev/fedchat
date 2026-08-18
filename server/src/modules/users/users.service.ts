import bcrypt from "bcryptjs";

import { UsersRepository } from "./users.repository.js";

import type {
  UpdateProfileInput,
  ChangePasswordInput
} from "./users.validation.ts";

export class UsersService {
  constructor(
    private readonly repository: UsersRepository
  ) {}

  async getUserById(id: string) {
    const user =
      await this.repository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return this.formatUser(user);
  }

  async search(query: string, userId: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return this.repository.search(trimmed, userId);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ) {
    if (input.username) {
      const existing =
        await this.repository.findByUsername(
          input.username
        );

      if (
        existing &&
        existing.id !== userId
      ) {
        throw new Error(
          "Username is already taken"
        );
      }
    }

    const user =
      await this.repository.updateProfile(
        userId,
        input
      );

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      status: user.status,
      role: user.role.name,
      updatedAt: user.updatedAt
    };
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ) {
    const user =
      await this.repository.findById(
        userId
      );

    if (!user) {
      throw new Error("User not found");
    }

    const valid =
      await bcrypt.compare(
        input.currentPassword,
        user.passwordHash
      );

    if (!valid) {
      throw new Error(
        "Current password is incorrect"
      );
    }

    if (
      input.currentPassword ===
      input.newPassword
    ) {
      throw new Error(
        "New password must be different from current password"
      );
    }

    const passwordHash =
      await bcrypt.hash(
        input.newPassword,
        12
      );

    await this.repository.updatePassword(
      userId,
      passwordHash
    );

    return true;
  }

  async deleteAccount(userId: string) {
    const user =
      await this.repository.findById(
        userId
      );

    if (!user) {
      throw new Error("User not found");
    }

    await this.repository.deleteUser(
      userId
    );

    return true;
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      status: user.status,
      role: user.role.name,
      permissions:
        user.role.permissions.map(
          (item: any) =>
            item.permission.name
        ),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}