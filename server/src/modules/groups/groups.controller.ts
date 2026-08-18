import type { Request, Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { groupsService } from "./groups.service.js";

export async function listGroups(req: Request, res: Response) {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const groups = await groupsService.list(req.userId);
    return res.json({ success: true, data: { groups } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load groups" });
  }
}

export async function createGroup(req: Request, res: Response) {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const group = await groupsService.create({ ...req.body, createdById: req.userId });
    return res.status(201).json({ success: true, data: { group } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create group";
    const requiresSubscription = message.includes("subscription is required");
    return res.status(requiresSubscription ? 403 : 400).json({
      success: false,
      message,
      code: requiresSubscription ? "GROUP_PERMISSION_REQUIRED" : "GROUP_CREATE_FAILED",
    });
  }
}

export async function updateGroup(req: Request<{ id: string }>, res: Response) {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const data = {
      name: typeof req.body?.name === "string" ? req.body.name.trim() : undefined,
      description: req.body?.description === null ? null : typeof req.body?.description === "string" ? req.body.description.trim() : undefined,
      isPrivate: typeof req.body?.isPrivate === "boolean" ? req.body.isPrivate : undefined,
    };
    const group = await groupsService.update(req.params.id, req.userId, data);
    return res.json({ success: true, data: { group } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update group" });
  }
}

export async function uploadGroupMedia(req: Request<{ id: string }>, res: Response) {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    const kind = req.body?.kind === "banner" ? "banner" : req.body?.kind === "avatar" ? "avatar" : "";
    if (!file || !kind) return res.status(400).json({ success: false, message: "Group image and kind are required" });
    if (!file.mimetype.startsWith("image/")) return res.status(415).json({ success: false, message: "Only image files are allowed" });
    if (file.size > 10 * 1024 * 1024) return res.status(413).json({ success: false, message: "Image must be 10MB or smaller" });
    const group = await groupsService.update(req.params.id, req.userId, {});
    const dir = path.resolve(process.cwd(), "uploads", "groups");
    await fs.mkdir(dir, { recursive: true });
    const ext = ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif" } as Record<string,string>)[file.mimetype] ?? ".img";
    const filename = `${req.params.id}-${kind}-${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(dir, filename);
    await fs.writeFile(fullPath, file.buffer);
    const url = `/uploads/groups/${filename}`;
    const oldUrl = kind === "avatar" ? (group as any).avatar : (group as any).bannerUrl;
    const updated = await groupsService.update(req.params.id, req.userId, kind === "avatar" ? { avatar: url } : { bannerUrl: url });
    if (oldUrl?.startsWith("/uploads/groups/")) fs.unlink(path.resolve(process.cwd(), oldUrl.replace(/^\//, ""))).catch(() => undefined);
    return res.json({ success: true, data: { group: updated, url } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to upload group media" });
  }
}

export async function addGroupMember(req: Request<{ id: string }>, res: Response) {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const member = await groupsService.addMember(req.params.id, req.body?.userId, req.userId);
    return res.status(201).json({ success: true, data: { member } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add member";
    const limitReached = message.includes("Upgrade your plan") || message.includes("paid subscription");
    return res.status(limitReached ? 403 : 400).json({
      success: false,
      message,
      code: limitReached ? "GROUP_MEMBER_LIMIT_REACHED" : "GROUP_ADD_MEMBER_FAILED",
    });
  }
}

export async function removeGroupMember(req: Request<{ id: string; userId: string }>, res: Response) {
  await groupsService.removeMember(req.params.id, req.params.userId);
  return res.json({ success: true, message: "Member removed" });
}

export async function getGroupMembers(req: Request<{ id: string }>, res: Response) {
  const members = await groupsService.members(req.params.id);
  return res.json({ success: true, data: { members } });
}
