import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMemberRole, requireUser } from "./auth";
import { ROLES } from "./schema";

export const create = mutation({
  args: {
    name: v.string(),
    homeCurrency: v.string(),
  },
  handler: async (ctx, { name, homeCurrency }) => {
    const { user } = await requireUser(ctx);

    const groupId = await ctx.db.insert("groups", {
      name,
      homeCurrency,
      ownerId: user._id,
    });

    await ctx.db.insert("members", {
      groupId,
      userId: user._id,
      role: "owner",
    });

    return groupId;
  },
});

export const list = query({
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        return group ? { ...group, membership } : null;
      })
    );

    return groups.filter(Boolean);
  },
});

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const { membership } = await assertMemberRole(ctx, groupId, {
      requiredRoles: ["owner", "admin", "member", "viewer"],
    });

    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    return { ...group, membership };
  },
});
