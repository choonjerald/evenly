import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMemberRole } from "./auth";
import { ROLES } from "./schema";

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin", "member", "viewer"] });

    const members = await ctx.db
      .query("members")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return { ...member, user };
      })
    );
  },
});

export const updateRole = mutation({
  args: {
    membershipId: v.id("members"),
    role: ROLES,
  },
  handler: async (ctx, { membershipId, role }) => {
    const memberToUpdate = await ctx.db.get(membershipId);
    if (!memberToUpdate) {
      throw new Error("Membership not found");
    }

    const { membership: currentUserMembership } = await assertMemberRole(
      ctx,
      memberToUpdate.groupId,
      { requiredRoles: ["owner", "admin"] }
    );

    // Owners can manage admins and members, but not other owners.
    if (memberToUpdate.role === "owner" && currentUserMembership.role !== "owner") {
        throw new Error("Only owners can manage other owners.");
    }
    // Admins cannot manage owners or other admins.
    if (currentUserMembership.role === "admin" && (memberToUpdate.role === "owner" || memberToUpdate.role === "admin")) {
        throw new Error("Admins cannot manage owners or other admins.");
    }

    await ctx.db.patch(membershipId, { role });
  },
});

export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const { membership, user } = await assertMemberRole(ctx, groupId, {
      requiredRoles: ["owner", "admin", "member"],
    });

    // Prevent owner from leaving if they are the only owner
    if (membership.role === "owner") {
      const owners = await ctx.db
        .query("members")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();
      if (owners.length === 1) {
        throw new Error("You cannot leave the group as the only owner.");
      }
    }

    await ctx.db.delete(membership._id);
  },
});

export const removeMember = mutation({
    args: { membershipId: v.id("members") },
    handler: async (ctx, { membershipId }) => {
        const memberToRemove = await ctx.db.get(membershipId);
        if (!memberToRemove) {
            throw new Error("Member not found");
        }

        const { membership: currentUserMembership } = await assertMemberRole(ctx, memberToRemove.groupId, { requiredRoles: ["owner", "admin"] });

        if (memberToRemove.role === "owner" || (currentUserMembership.role === "admin" && memberToRemove.role === "admin")) {
            throw new Error("You do not have permission to remove this member.");
        }

        await ctx.db.delete(membershipId);
    }
});
