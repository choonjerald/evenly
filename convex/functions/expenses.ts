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

export const listExpenses = query({
  args: { groupId: v.id("groups"), limit: v.optional(v.number()) },
  handler: async (ctx, { groupId, limit = 100 }) => {
    await requireMembership(ctx, groupId);
    return await ctx.db
      .query("expenses")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .order("desc")
      .take(limit);
  },
});

export const addExpense = mutation({
  args: {
    groupId: v.id("groups"),
    payerId: v.id("users"),
    amountCents: v.number(),
    currency: v.string(),
    description: v.string(),
    participants: v.array(v.id("users")),
    weights: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.groupId);

    // Basic validations
    if (args.amountCents <= 0) throw new Error("Amount must be positive");
    if (!args.participants.includes(args.payerId)) {
      throw new Error("Payer must be a participant");
    }
    // Optional: ensure all participants are members
    for (const u of args.participants) {
      const mem = await ctx.db
        .query("memberships")
        .withIndex("by_group_user", (q: any) => q.eq("groupId", args.groupId).eq("userId", u))
        .unique();
      if (!mem) throw new Error("All participants must be group members");
    }

    return await ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, { expenseId }) => {
    const e = await ctx.db.get(expenseId);
    if (!e) throw new Error("Not found");
    await requireMembership(ctx, e.groupId);
    await ctx.db.delete(expenseId);
    return true;
  },
});

export const balances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await requireMembership(ctx, groupId);
    const exps = await ctx.db
      .query("expenses")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .collect();

    const net: Record<string, number> = {};
    for (const e of exps) {
      const participants = e.participants as string[];
      const weights = e.weights ?? Object.fromEntries(participants.map((id) => [id, 1]));
      const totalWeight = participants.reduce((sum, id) => sum + (weights[id] ?? 1), 0);
      for (const u of participants) {
        const share = Math.round((e.amountCents * (weights[u] ?? 1)) / totalWeight);
        net[u] = (net[u] ?? 0) - share; // owes share
      }
      net[e.payerId] = (net[e.payerId] ?? 0) + e.amountCents; // gets credit for paying
    }
    return net; // { userId: cents }
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amountCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    payerId: v.optional(v.id("users")),
    participants: v.optional(v.array(v.id("users"))),
    weights: v.optional(v.record(v.string(), v.number())), // pass {} to clear (equal)
  },
  handler: async (ctx, args) => {
    const { expenseId, ...patch } = args;
    const e = await ctx.db.get(expenseId);
    if (!e) throw new Error("Not found");
    await requireMembership(ctx, e.groupId);

    const update: any = {};

    // Optional validations + assignments
    if (patch.amountCents !== undefined) {
      if (patch.amountCents <= 0) throw new Error("Amount must be positive");
      update.amountCents = patch.amountCents;
    }
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.currency !== undefined) update.currency = patch.currency;
    if (patch.payerId !== undefined) update.payerId = patch.payerId;

    if (patch.participants !== undefined) {
      if (patch.participants.length === 0) throw new Error("Participants required");
      // ensure all are members
      for (const u of patch.participants) {
        const mem = await ctx.db
          .query("memberships")
          .withIndex("by_group_user", (q: any) => q.eq("groupId", e.groupId).eq("userId", u))
          .unique();
        if (!mem) throw new Error("All participants must be group members");
      }
      update.participants = patch.participants;
      // if payer provided earlier/unchanged, ensure payer is in participants
      const payerCheck = patch.payerId ?? e.payerId;
      if (!update.participants.includes(payerCheck)) {
        throw new Error("Payer must be a participant");
      }
    } else if (patch.payerId !== undefined) {
      // participants unchanged; ensure payer remains a participant
      if (!e.participants.includes(patch.payerId)) {
        throw new Error("Payer must be a participant");
      }
    }

    if (patch.weights !== undefined) {
      // empty object means equal split → remove weights field
      update.weights = Object.keys(patch.weights).length === 0 ? undefined : patch.weights;
    }

    await ctx.db.patch(expenseId, update);
    return true;
  },
});
