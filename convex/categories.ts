import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMemberRole } from "./auth";

export const list = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin", "member", "viewer"] });
    return await ctx.db
      .query("categories")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .order("asc", "sortOrder")
      .collect();
  },
});

export const add = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, name, emoji, color }) => {
    await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin"] });

    const highestSortOrder = await ctx.db
      .query("categories")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .order("desc", "sortOrder")
      .first();

    await ctx.db.insert("categories", {
      groupId,
      name,
      emoji,
      color,
      sortOrder: (highestSortOrder?.sortOrder ?? 0) + 1,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, { categoryId, ...rest }) => {
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    await assertMemberRole(ctx, category.groupId, { requiredRoles: ["owner", "admin"] });

    await ctx.db.patch(categoryId, rest);
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    await assertMemberRole(ctx, category.groupId, { requiredRoles: ["owner", "admin"] });

    // TODO: What to do with expenses that use this category?
    // Option 1: Unset categoryId on expenses
    // Option 2: Prevent deletion if in use
    // For now, we'll just delete it.

    await ctx.db.delete(categoryId);
  },
});
