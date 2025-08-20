import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertMemberRole } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

// --- Queries ---

export const getBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin", "member", "viewer"] });

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const members = await ctx.db.query("members").withIndex("by_group", q => q.eq("groupId", groupId)).collect();
    const expenses = await ctx.db.query("expenses").withIndex("by_group", q => q.eq("groupId", groupId)).filter(q => q.eq(q.field("deletedAt"), undefined)).collect();
    const payments = await ctx.db.query("payments").withIndex("by_group", q => q.eq("groupId", groupId)).filter(q => q.eq(q.field("voidedAt"), undefined)).collect();

    const balances = new Map<Id<"users">, number>();

    for (const member of members) {
        balances.set(member.userId, 0);
    }

    for (const expense of expenses) {
        // TODO: Handle multi-currency (v1.1)
        const splits = await ctx.db.query("splits").withIndex("by_expense", q => q.eq("expenseId", expense._id)).collect();
        // Credit the payer
        balances.set(expense.paidBy, (balances.get(expense.paidBy) ?? 0) + expense.amount);
        // Debit the participants
        for (const split of splits) {
            balances.set(split.userId, (balances.get(split.userId) ?? 0) - split.share);
        }
    }

    for (const payment of payments) {
        balances.set(payment.fromUserId, (balances.get(payment.fromUserId) ?? 0) + payment.amount);
        balances.set(payment.toUserId, (balances.get(payment.toUserId) ?? 0) - payment.amount);
    }

    const balancesWithUsers = await Promise.all(
        Array.from(balances.entries()).map(async ([userId, balance]) => ({
            userId,
            balance,
            user: await ctx.db.get(userId),
        }))
    );
    return balancesWithUsers;
  },
});

export const suggest = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        const balances = await getBalances(ctx, { groupId });

        const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
        const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

        const settlements: { from: Id<"users">, to: Id<"users">, amount: number }[] = [];

        let i = 0, j = 0;
        while(i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            const amount = Math.min(-debtor.balance, creditor.balance);

            settlements.push({ from: debtor.userId, to: creditor.userId, amount });

            debtor.balance += amount;
            creditor.balance -= amount;

            if (Math.round(debtor.balance) === 0) i++;
            if (Math.round(creditor.balance) === 0) j++;
        }

        const settlementsWithUsers = await Promise.all(settlements.map(async (s) => ({
            ...s,
            fromUser: await ctx.db.get(s.from),
            toUser: await ctx.db.get(s.to),
        })));
        return settlementsWithUsers;
    }
});

// --- Mutations ---

export const recordPayment = mutation({
    args: {
        groupId: v.id("groups"),
        fromUserId: v.id("users"),
        toUserId: v.id("users"),
        amount: v.number(),
        memo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user } = await assertMemberRole(ctx, args.groupId, { requiredRoles: ["owner", "admin", "member"] });

        await ctx.db.insert("payments", {
            groupId: args.groupId,
            fromUserId: args.fromUserId,
            toUserId: args.toUserId,
            amount: args.amount,
            paidAt: Date.now(),
            memo: args.memo,
        });

        // TODO: Add activity log
    }
});

export const voidPayment = mutation({
    args: { paymentId: v.id("payments") },
    handler: async (ctx, { paymentId }) => {
        const payment = await ctx.db.get(paymentId);
        if (!payment) throw new Error("Payment not found");

        const { user } = await assertMemberRole(ctx, payment.groupId, { requiredRoles: ["owner", "admin"] });

        await ctx.db.patch(paymentId, {
            voidedAt: Date.now(),
            voidedBy: user._id
        });

        // TODO: Add activity log
    }
});
