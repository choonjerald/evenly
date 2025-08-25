import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../auth";
import { api } from "../_generated/api";
import { computeSharesFromItems } from "../../lib/settlements";
import { Id } from "../_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

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
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .order("desc")
      .take(limit);

    return Promise.all(
      expenses.map(async (e) => ({
        ...e,
        receiptUrl: e.receiptStorageId
          ? await ctx.storage.getUrl(e.receiptStorageId)
          : null,
      }))
    );
  },
});

export const addExpense = mutation({
  args: {
    groupId: v.id("groups"),
    payerId: v.id("users"),
    currency: v.string(),
    description: v.string(),
    amountCents: v.optional(v.number()),
    participants: v.optional(v.array(v.id("users"))),
    weights: v.optional(v.record(v.string(), v.number())),
    items: v.optional(
      v.array(
        v.object({
          description: v.string(),
          priceCents: v.number(),
          assignedTo: v.array(v.id("users")),
        })
      )
    ),
    serviceTaxRate: v.optional(v.number()),
    gstRate: v.optional(v.number()),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.groupId);

    if (!args.description.trim()) {
      throw new Error("Description required");
    }

    let amountCents: number;
    let participants: Id<"users">[];
    let weights: Record<string, number> | undefined = undefined;
    let items = args.items;

    const taxMultiplier =
      1 + (args.serviceTaxRate ?? 0) / 100 + (args.gstRate ?? 0) / 100;

    if (items && items.length > 0) {
      const shares = computeSharesFromItems(items as any);
      amountCents = Math.round(shares.amountCents * taxMultiplier);
      weights = Object.fromEntries(
        Object.entries(shares.weights).map(([u, c]) => [u, c * taxMultiplier])
      );
      participants = Object.keys(weights) as Id<"users">[];
    } else {
      if (args.amountCents == null || !args.participants) {
        throw new Error("Amount and participants required");
      }
      if (args.amountCents <= 0) throw new Error("Amount must be positive");
      amountCents = Math.round(args.amountCents * taxMultiplier);
      participants = args.participants as Id<"users">[];
      weights = args.weights ?? undefined;
    }

    if (!participants.includes(args.payerId)) {
      throw new Error("Payer must be a participant");
    }

    for (const u of participants) {
      const mem = await ctx.db
        .query("memberships")
        .withIndex("by_group_user", (q: any) => q.eq("groupId", args.groupId).eq("userId", u))
        .unique();
      if (!mem) throw new Error("All participants must be group members");
    }

    return await ctx.db.insert("expenses", {
      groupId: args.groupId,
      payerId: args.payerId,
      currency: args.currency,
      description: args.description,
      amountCents,
      participants,
      weights,
      items,
      serviceTaxRate: args.serviceTaxRate ?? 0,
      gstRate: args.gstRate ?? 0,
      receiptStorageId: args.receiptStorageId,
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
    // 1) Guard: user must be a member (no awaits in index callbacks)
    await requireMembership(ctx, groupId);

    // 2) Expenses → net (integer-safe Largest Remainder rounding)
    const exps = await ctx.db
      .query("expenses")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .collect();

    const net: Record<string, number> = {};
    for (const e of exps) {
      const participants = e.participants as string[];
      const weights = e.weights ?? Object.fromEntries(participants.map((id) => [id, 1]));
      const totalWeight = participants.reduce((s, u) => s + (weights[u] ?? 1), 0);

      // quotas/floors/remainders
      const rows = participants.map((u) => {
        const quota = (e.amountCents * (weights[u] ?? 1)) / totalWeight;
        const floor = Math.floor(quota);
        const rem = quota - floor;
        return { u, floor, rem };
      });
      const sumFloors = rows.reduce((s, r) => s + r.floor, 0);
      let leftover = e.amountCents - sumFloors;
      // deterministic tie-break by user id
      rows.sort((a, b) => (b.rem !== a.rem ? b.rem - a.rem : a.u.localeCompare(b.u)));
      for (let i = 0; i < leftover; i++) rows[i].floor += 1;

      // apply to net
      for (const r of rows) net[r.u] = (net[r.u] ?? 0) - r.floor; // each owes their share
      net[e.payerId] = (net[e.payerId] ?? 0) + e.amountCents;     // payer credited
    }

    // 3) Settlements → adjust net
    //    fromUser pays toUser amountCents:
    //    fromUser owes less (+amount), toUser is owed less (-amount)
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group_createdAt", (q: any) => q.eq("groupId", groupId))
      .collect();

    for (const s of settlements) {
      net[s.fromUserId] = (net[s.fromUserId] ?? 0) + s.amountCents;
      net[s.toUserId] = (net[s.toUserId] ?? 0) - s.amountCents;
    }

    return net; // { userId: cents }
  },
});


export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    currency: v.optional(v.string()),
    payerId: v.optional(v.id("users")),
    amountCents: v.optional(v.number()),
    participants: v.optional(v.array(v.id("users"))),
    weights: v.optional(v.record(v.string(), v.number())),
    items: v.optional(
      v.array(
        v.object({
          description: v.string(),
          priceCents: v.number(),
          assignedTo: v.array(v.id("users")),
        })
      )
    ),
    receiptStorageId: v.optional(v.id("_storage")),
    serviceTaxRate: v.optional(v.number()),
    gstRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { expenseId, ...patch } = args;
    const e = await ctx.db.get(expenseId);
    if (!e) throw new Error("Not found");
    await requireMembership(ctx, e.groupId);

    const update: any = {};

    // Optional validations + assignments
    if (patch.description !== undefined) {
      if (!patch.description.trim()) {
        throw new Error("Description required");
      }
      update.description = patch.description;
    }
    if (patch.currency !== undefined) update.currency = patch.currency;
    if (patch.payerId !== undefined) update.payerId = patch.payerId;
    if (patch.receiptStorageId !== undefined)
      update.receiptStorageId = patch.receiptStorageId;

    const serviceTaxRate = patch.serviceTaxRate ?? e.serviceTaxRate ?? 0;
    const gstRate = patch.gstRate ?? e.gstRate ?? 0;

    if (patch.items !== undefined) {
      if (patch.items.length === 0) throw new Error("Items required");

      const { amountCents, weights } = computeSharesFromItems(patch.items as any);
      const multiplier = 1 + serviceTaxRate / 100 + gstRate / 100;

      const participants = Object.keys(weights);
      const payerCheck = patch.payerId ?? e.payerId;
      if (!participants.includes(payerCheck)) {
        throw new Error("Payer must be a participant");
      }

      for (const u of participants) {
        const mem = await ctx.db
          .query("memberships")
          .withIndex("by_group_user", (q: any) => q.eq("groupId", e.groupId).eq("userId", u))
          .unique();
        if (!mem) throw new Error("All participants must be group members");
      }

      update.items = patch.items;
      update.amountCents = Math.round(amountCents * multiplier);
      const weighted = Object.fromEntries(
        Object.entries(weights).map(([u, c]) => [u, c * multiplier])
      );
      update.participants = Object.keys(weighted);
      update.weights = weighted;
      update.serviceTaxRate = serviceTaxRate;
      update.gstRate = gstRate;
    } else {
      if (patch.amountCents !== undefined) {
        if (patch.amountCents <= 0) throw new Error("Amount must be positive");
        update.amountCents = patch.amountCents;
      }

      const participants = patch.participants ?? (e.participants as string[]);

      if (patch.participants !== undefined) {
        for (const u of participants) {
          const mem = await ctx.db
            .query("memberships")
            .withIndex("by_group_user", (q: any) => q.eq("groupId", e.groupId).eq("userId", u))
            .unique();
          if (!mem) throw new Error("All participants must be group members");
        }
        update.participants = participants;
      }

      const payerCheck = patch.payerId ?? e.payerId;
      if (!participants.includes(payerCheck)) {
        throw new Error("Payer must be a participant");
      }

      if (patch.weights !== undefined) {
        update.weights = patch.weights;
      }
      if (patch.serviceTaxRate !== undefined)
        update.serviceTaxRate = patch.serviceTaxRate;
      if (patch.gstRate !== undefined) update.gstRate = patch.gstRate;
    }

    await ctx.db.patch(expenseId, update);
    return true;
  },
});
