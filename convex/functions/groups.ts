import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../auth";

async function requireMembership(ctx: any, groupId: string) {
  const me = await requireUser(ctx);
  const mem = await ctx.db
    .query("memberships")
    .withIndex("by_group_user", (q: any) => q.eq("groupId", groupId as any).eq("userId", me._id))
    .unique();
  if (!mem) throw new Error("Forbidden");
  return { me, mem };
}

export const myGroups = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const mems = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q: any) => q.eq("userId", me._id))
      .collect();
    const groups = await Promise.all(mems.map((m: any) => ctx.db.get(m.groupId)));
    return groups.filter(Boolean);
  },
});

export const listMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await requireMembership(ctx, groupId);
    const mems = await ctx.db
      .query("memberships")
      .withIndex("by_group", (q: any) => q.eq("groupId", groupId))
      .collect();
    const users = await Promise.all(mems.map((m: any) => ctx.db.get(m.userId)));
    return mems.map((m: any, i: number) => ({ ...m, user: users[i] }));
  },
});

export const createGroup = mutation({
  args: { name: v.string(), currency: v.string() },
  handler: async (ctx, { name, currency }) => {
    const me = await requireUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      name,
      ownerId: me._id,
      currency,
      createdAt: Date.now(),
    });
    await ctx.db.insert("memberships", {
      groupId,
      userId: me._id,
      role: "owner",
      createdAt: Date.now(),
    });
    return groupId;
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const { me } = await requireMembership(ctx, groupId);
    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Not found");
    if (group.ownerId !== me._id) throw new Error("Only owner can delete group");

    // cascade (simple)
    const exps = await ctx.db
      .query("expenses")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .collect();
    for (const e of exps) await ctx.db.delete(e._id);

    const mems = await ctx.db
      .query("memberships")
      .withIndex("by_group", (q: any) => q.eq("groupId", groupId))
      .collect();
    for (const m of mems) await ctx.db.delete(m._id);

    const invs = await ctx.db
      .query("invites")
      .withIndex("by_code", (q: any) => q) // no filter; small table in MVP
      .collect();
    for (const i of invs.filter((i: any) => i.groupId === groupId)) await ctx.db.delete(i._id);

    await ctx.db.delete(groupId);
    return true;
  },
});

// ---- Invites ----

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const createInvite = mutation({
  args: { groupId: v.id("groups"), ttlHours: v.optional(v.number()) },
  handler: async (ctx, { groupId, ttlHours = 72 }) => {
    const { me } = await requireMembership(ctx, groupId);
    const code = randomCode(8);
    const expiresAt = Date.now() + ttlHours * 3600 * 1000;
    const id = await ctx.db.insert("invites", {
      groupId,
      code,
      expiresAt,
      createdBy: me._id,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const joinByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const me = await requireUser(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q: any) => q.eq("code", code))
      .unique();
    if (!invite) throw new Error("Invalid code");
    if (invite.expiresAt < Date.now()) throw new Error("Invite expired");

    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_group_user", (q: any) => q.eq("groupId", invite.groupId).eq("userId", me._id))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("memberships", {
      groupId: invite.groupId,
      userId: me._id,
      role: "member",
      createdAt: Date.now(),
    });
  },
});
