import type {
  Request,
  Response
} from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  updateProfileSchema,
  changePasswordSchema
} from "./users.validation.js";

import { UsersService } from "./users.service.js";
import { UsersRepository } from "./users.repository.js";

const usersService =
  new UsersService(
    new UsersRepository()
  );

export async function searchUsers(
  req: Request,
  res: Response
) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const users = await usersService.search(query, req.userId);
  return res.status(200).json({ success: true, data: { users } });
}

export async function getMe(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const user =
      await usersService.getUserById(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "User not found"
    });
  }
}

export async function getUserById(
  req: Request,
  res: Response
) {
  try {
    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }

    const user =
      await usersService.getUserById(
        userId
      );

    return res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "User not found"
    });
  }
}

export async function updateMe(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const input =
      updateProfileSchema.parse(
        req.body
      );

    const user =
      await usersService.updateProfile(
        req.userId,
        input
      );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Profile update failed"
    });
  }
}

export async function uploadProfileMedia(req: Request, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Authentication required" });
    const file = (req as any).file as Express.Multer.File | undefined;
    const kind = req.body?.kind === "banner" ? "banner" : req.body?.kind === "avatar" ? "avatar" : "";
    if (!file) return res.status(400).json({ success: false, message: "Image file is required" });
    if (!kind) return res.status(400).json({ success: false, message: "Profile image kind must be avatar or banner" });
    if (!file.mimetype.startsWith("image/")) return res.status(415).json({ success: false, message: "Only image files are allowed" });
    if (file.size > 8 * 1024 * 1024) return res.status(413).json({ success: false, message: "Image must be 8MB or smaller" });

    const ext = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" } as Record<string,string>)[file.mimetype] ?? ".img";
    const dir = path.resolve(process.cwd(), "uploads", "profile");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${req.userId}-${kind}-${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(dir, filename);
    await fs.writeFile(fullPath, file.buffer);
    const publicUrl = `/uploads/profile/${filename}`;

    const current = await usersService.getUserById(req.userId);
    const oldUrl = kind === "avatar" ? current.avatar : current.bannerUrl;
    const updated = await usersService.updateProfile(req.userId, kind === "avatar" ? { avatar: publicUrl } : { bannerUrl: publicUrl });

    if (oldUrl?.startsWith("/uploads/profile/")) {
      const oldPath = path.resolve(process.cwd(), oldUrl.replace(/^\//, ""));
      if (oldPath !== fullPath) fs.unlink(oldPath).catch(() => undefined);
    }

    return res.status(200).json({ success: true, message: kind === "avatar" ? "Profile photo updated" : "Profile banner updated", data: { user: updated, url: publicUrl } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Profile image upload failed" });
  }
}

export async function changePassword(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const input =
      changePasswordSchema.parse(
        req.body
      );

    await usersService.changePassword(
      req.userId,
      input
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Password change failed"
    });
  }
}

export async function deleteMe(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    await usersService.deleteAccount(
      req.userId
    );

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Account deletion failed"
    });
  }
}