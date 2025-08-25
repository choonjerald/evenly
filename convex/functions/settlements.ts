import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../auth";

// Small helper: ensure both users are members of the group
async function assertMember(ctx: any, groupId: string, userId: string) {
  const mem = await ctx.db
    .query("memberships")
    .withIndex("by_group_user", (q: any) => q.eq("groupId", groupId as any).eq("userId", userId as any))
    .unique();
  if (!mem) throw new Error("User is not a member of this group");
}

async function requireMembership(ctx: any, groupId: string) {
  const me = await requireUser(ctx);
  const mem = await ctx.db
    .query("memberships")
    .withIndex("by_group_user", (q: any) => q.eq("groupId", groupId as any).eq("userId", me._id))
    .unique();
  if (!mem) throw new Error("Forbidden");
  return me;
}

// Record a settlement (money moved from fromUser -> toUser)
export const addSettlement = mutation({
  args: {
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amountCents: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, fromUserId, toUserId, amountCents, note }) => {
    const me = await requireMembership(ctx, groupId);
    if (amountCents <= 0) throw new Error("Amount must be positive");
    if (fromUserId === toUserId) throw new Error("From and To cannot be the same user");

    // both must be members
    await assertMember(ctx, groupId, fromUserId);
    await assertMember(ctx, groupId, toUserId);

    // Optional: allow only recording for yourself or anyone? We allow any member.
    const id = await ctx.db.insert("settlements", {
      groupId,
      fromUserId,
      toUserId,
      amountCents,
      note,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// List recent settlements for a group
export const listSettlements = query({
  args: { groupId: v.id("groups"), limit: v.optional(v.number()) },
  handler: async (ctx, { groupId, limit = 20 }) => {
    await requireMembership(ctx, groupId);
    return await ctx.db
      .query("settlements")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .order("desc")
      .take(limit);
  },
});

// (Optional) Delete a settlement (owner only or the creator? For MVP, any member)
export const deleteSettlement = mutation({
  args: { settlementId: v.id("settlements") },
  handler: async (ctx, { settlementId }) => {
    const s = await ctx.db.get(settlementId);
    if (!s) throw new Error("Not found");
    await requireMembership(ctx, s.groupId);
    await ctx.db.delete(settlementId);
    return true;
  },
});
