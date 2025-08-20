import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMemberRole, requireUser } from "./auth";
import { ROLES } from "./schema";

export const list = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin"] });

    return await ctx.db
      .query("invites")
      .withIndex("by_group_and_email", (q) => q.eq("groupId", groupId))
      .collect();
  },
});

export const invite = mutation({
  args: {
    groupId: v.id("groups"),
    email: v.string(),
    role: ROLES,
  },
  handler: async (ctx, { groupId, email, role }) => {
    const { user } = await assertMemberRole(ctx, groupId, {
      requiredRoles: ["owner", "admin"],
    });

    // Prevent inviting self
    if (email === user.email) {
      throw new Error("You cannot invite yourself to a group.");
    }

    // Check if user is already a member
    const invitedUser = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).unique();
    if (invitedUser) {
        const existingMembership = await ctx.db.query("members").withIndex("by_group_and_user", q => q.eq("groupId", groupId).eq("userId", invitedUser._id)).unique();
        if (existingMembership) {
            throw new Error(`User ${email} is already in this group.`);
        }
    }

    // Check for existing invite
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_group_and_email", (q) => q.eq("groupId", groupId).eq("email", email))
      .unique();

    if (existingInvite) {
      throw new Error(`An invite for ${email} already exists.`);
    }

    await ctx.db.insert("invites", {
      groupId,
      email,
      role,
      invitedBy: user._id,
    });
  },
});

export const accept = mutation({
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .first();

    if (!invite) {
      throw new Error("No pending invite found for your account.");
    }

    await ctx.db.insert("members", {
      userId: user._id,
      groupId: invite.groupId,
      role: invite.role,
    });

    await ctx.db.delete(invite._id);

    return { groupId: invite.groupId };
  },
});

export const deleteInvite = mutation({
    args: { inviteId: v.id("invites") },
    handler: async (ctx, { inviteId }) => {
        const invite = await ctx.db.get(inviteId);
        if (!invite) {
            throw new Error("Invite not found");
        }

        await assertMemberRole(ctx, invite.groupId, { requiredRoles: ["owner", "admin"] });

        await ctx.db.delete(inviteId);
    }
});
