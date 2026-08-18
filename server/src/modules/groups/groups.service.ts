import { groupsRepository } from "./groups.repository.js";
import { subscriptionService } from "../subscriptions/subscription.service.js";
import { rawPool } from "../../config/raw-db.js";
import { createUserNotification } from "../notifications/notification.service.js";

export const groupsService = {
  async create(data: { name: string; description?: string; createdById: string; isPrivate?: boolean; avatar?: string | null; bannerUrl?: string | null }) {
    if (!data.name?.trim()) throw new Error("Group name is required");
    const subscription = await subscriptionService.ensurePaidFeature(data.createdById);
    const maxGroups = subscription.plan?.maxGroups;
    if (typeof maxGroups === "number") {
      const owned = await groupsRepository.countOwned(data.createdById);
      if (owned >= maxGroups) {
        throw new Error(`Your plan allows up to ${maxGroups} group(s). Upgrade your plan to create more.`);
      }
    }
    return groupsRepository.createRoom({ ...data, name: data.name.trim() });
  },

  list(userId: string) {
    return groupsRepository.findMyGroups(userId);
  },

  async addMember(roomId: string, userId: string, requestedById: string) {
    if (!userId) throw new Error("User ID is required");
    const owner = await rawPool.query(`SELECT 1 FROM rooms WHERE id=$1 AND created_by_id=$2`, [roomId, requestedById]);
    if (!owner.rowCount) throw new Error("Only the group owner can add members");
    const targetSub = await rawPool.query(`SELECT 1 FROM subscriptions s WHERE s."userId"=$1 AND s."isActive"=true AND s."startsAt"<=NOW() AND s."expiresAt">NOW() AND s."accessLevel"='FULL' LIMIT 1`, [userId]);
    if (!targetSub.rowCount) throw new Error("Only users with an active FULL paid subscription can be added to a group");
    const subscription = await subscriptionService.ensurePaidFeature(requestedById);
    const maxMembers = subscription.plan?.maxMembersPerGroup;
    if (typeof maxMembers === "number") {
      const current = await groupsRepository.countMembers(roomId);
      if (current >= maxMembers) {
        throw new Error(`Your plan allows up to ${maxMembers} member(s) per group. Upgrade your plan to add more.`);
      }
    }
    const member = await groupsRepository.addMember(roomId, userId);
    await createUserNotification(userId, { title: "Added to a group", message: "You were added to a FedChat group.", type: "group_added" }).catch(() => undefined);
    return member;
  },

  removeMember(roomId: string, userId: string) {
    return groupsRepository.removeMember(roomId, userId);
  },

  members(roomId: string) {
    return groupsRepository.members(roomId);
  },

  async update(roomId: string, userId: string, data: { name?: string; description?: string | null; isPrivate?: boolean; avatar?: string | null; bannerUrl?: string | null }) {
    const owner = await rawPool.query(`SELECT 1 FROM rooms WHERE id=$1 AND created_by_id=$2 AND type='GROUP'`, [roomId, userId]);
    if (!owner.rowCount) throw new Error('Only the group owner can update group settings');
    const current = await groupsRepository.findById(roomId);
    if (!current) throw new Error('Group not found');
    return groupsRepository.update(roomId, data);
  },

};
