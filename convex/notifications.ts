import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { v } from "convex/values";

export const getUnreadCount = query(async (ctx) => {
  const { user } = await requireUser(ctx);

  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_user_and_read_status", (q) => q.eq("userId", user._id).eq("readAt", undefined))
    .collect();

  return notifications.length;
});

export const list = query(async (ctx) => {
    const { user } = await requireUser(ctx);

    const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", q => q.eq("userId", user._id))
        .order("desc")
        .take(20);

    return Promise.all(notifications.map(async (n) => {
        const activity = await ctx.db.get(n.activityId);
        if (!activity) return null; // Should not happen
        const actor = await ctx.db.get(activity.userId);
        const group = await ctx.db.get(activity.groupId);

        // This is a simplified summary. A real app would have more detail.
        const summary = `${actor?.name} ${activity.verb} an ${activity.entityType} in ${group?.name}`;

        return {
            ...n,
            summary,
            timestamp: activity.timestamp
        };
    })).then(res => res.filter(Boolean));
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const { user } = await requireUser(ctx);
    const notification = await ctx.db.get(notificationId);

    if (notification && notification.userId === user._id) {
      await ctx.db.patch(notificationId, { readAt: Date.now() });
    }
  },
});

export const markAllAsRead = mutation(async (ctx) => {
    const { user } = await requireUser(ctx);
    const unread = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_read_status", q => q.eq("userId", user._id).eq("readAt", undefined))
        .collect();

    await Promise.all(unread.map(n => ctx.db.patch(n._id, { readAt: Date.now() })));
});
