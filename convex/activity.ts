import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { assertMemberRole } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

export const list = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin", "member", "viewer"] });

        const activity = await ctx.db
            .query("activity")
            .withIndex("by_group", q => q.eq("groupId", groupId))
            .order("desc", "timestamp")
            .take(50); // Get last 50 items
        
        return Promise.all(activity.map(async (item) => {
            const user = await ctx.db.get(item.userId);
            return { ...item, user };
        }));
    }
});

// This is an internal mutation to be called from other mutations
// to ensure activity is logged transactionally.
export const logActivity = internalMutation({
    args: {
        groupId: v.id("groups"),
        userId: v.id("users"),
        verb: v.union(v.literal("created"), v.literal("updated"), v.literal("deleted")),
        entityType: v.union(v.literal("expense"), v.literal("payment"), v.literal("member"), v.literal("group")),
        entityId: v.string(),
        before: v.optional(v.any()),
        after: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const activityId = await ctx.db.insert("activity", {
            ...args,
            timestamp: Date.now(),
        });

        // Create notifications for other group members
        const members = await ctx.db.query("members").withIndex("by_group", q => q.eq("groupId", args.groupId)).collect();
        await Promise.all(members.map(member => {
            if (member.userId !== args.userId) { // Don't notify the user who performed the action
                return ctx.db.insert("notifications", {
                    userId: member.userId,
                    activityId,
                });
            }
            return Promise.resolve();
        }));
    }
});
