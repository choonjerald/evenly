import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMemberRole } from "./auth";
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validateManualSplit,
} from "./lib/splits";
import { Doc } from "./_generated/dataModel";

const expenseArgs = {
  groupId: v.id("groups"),
  paidAt: v.number(),
  amount: v.number(),
  currency: v.string(),
  memo: v.optional(v.string()),
  categoryId: v.optional(v.id("categories")),
  receiptId: v.optional(v.id("receipts")),
};

const splitArgs = {
  splitMode: v.union(
    v.literal("equal"),
    v.literal("shares"),
    v.literal("percentage"),
    v.literal("manual")
  ),
  participants: v.array(
    v.object({
      userId: v.id("users"),
      weight: v.optional(v.number()), // For shares/percentage
      share: v.optional(v.number()), // For manual
    })
  ),
};

export const add = mutation({
  args: { ...expenseArgs, ...splitArgs },
  handler: async (ctx, args) => {
    const { user } = await assertMemberRole(ctx, args.groupId, {
      requiredRoles: ["owner", "admin", "member"],
    });

    let splits: { userId: string; share: number }[] = [];
    switch (args.splitMode) {
      case "equal":
        splits = calculateEqualSplit(args.amount, args.participants);
        break;
      case "shares":
        splits = calculateSharesSplit(
          args.amount,
          args.participants as any
        );
        break;
      case "percentage":
        splits = calculatePercentageSplit(
          args.amount,
          args.participants as any
        );
        break;
      case "manual":
        splits = validateManualSplit(args.amount, args.participants as any);
        break;
    }

    const expenseId = await ctx.db.insert("expenses", {
      groupId: args.groupId,
      paidBy: user._id,
      paidAt: args.paidAt,
      amount: args.amount,
      currency: args.currency,
      memo: args.memo,
      categoryId: args.categoryId,
      receiptId: args.receiptId,
    });

    await Promise.all(
      splits.map((split) =>
        ctx.db.insert("splits", {
          expenseId,
          userId: split.userId,
          share: split.share,
          method: args.splitMode,
          weight: args.participants.find(p => p.userId === split.userId)?.weight
        })
      )
    );

    // TODO: Add activity log entry

    return expenseId;
  },
});

export const list = query({
    args: {
        groupId: v.id("groups"),
        // Filters
        memberId: v.optional(v.id("users")),
        categoryId: v.optional(v.id("categories")),
        dateRange: v.optional(v.object({ start: v.number(), end: v.number() })),
    },
    handler: async (ctx, { groupId, memberId, categoryId, dateRange }) => {
        await assertMemberRole(ctx, groupId, { requiredRoles: ["owner", "admin", "member", "viewer"] });

        let expenseQuery = ctx.db
            .query("expenses")
            .withIndex("by_group", q => q.eq("groupId", groupId))
            .filter(q => q.eq(q.field("deletedAt"), undefined));

        if (categoryId) {
            expenseQuery = expenseQuery.filter(q => q.eq(q.field("categoryId"), categoryId));
        }
        if (dateRange) {
            expenseQuery = expenseQuery.filter(q => 
                q.and(
                    q.gte(q.field("paidAt"), dateRange.start),
                    q.lte(q.field("paidAt"), dateRange.end)
                )
            );
        }

        const expenses = await expenseQuery.order("desc", "paidAt").collect();

        const expensesWithDetails = await Promise.all(expenses.map(async (expense) => {
            const [paidByUser, category, splits, receipt] = await Promise.all([
                ctx.db.get(expense.paidBy),
                expense.categoryId ? ctx.db.get(expense.categoryId) : null,
                ctx.db.query("splits").withIndex("by_expense", q => q.eq("expenseId", expense._id)).collect(),
                expense.receiptId ? ctx.db.get(expense.receiptId) : null
            ]);
            const participants = await Promise.all(splits.map(async s => ({
                ...s,
                user: await ctx.db.get(s.userId)
            })));
            return { ...expense, paidByUser, category, participants, receipt };
        }));

        if (memberId) {
            return expensesWithDetails.filter(e => 
                e.paidBy === memberId || e.participants.some(p => p.userId === memberId)
            );
        }

        return expensesWithDetails;
    }
});

export const softDelete = mutation({
    args: { expenseId: v.id("expenses") },
    handler: async (ctx, { expenseId }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense) throw new Error("Expense not found");

        const { user, membership } = await assertMemberRole(ctx, expense.groupId, { requiredRoles: ["owner", "admin", "member"] });

        // Only owner, admin, or the person who paid can delete
        if (membership.role !== "owner" && membership.role !== "admin" && expense.paidBy !== user._id) {
            throw new Error("You do not have permission to delete this expense.");
        }

        await ctx.db.patch(expenseId, {
            deletedAt: Date.now(),
            deletedBy: user._id
        });

        // TODO: Add activity log entry
    }
});

export const undoDelete = mutation({
    args: { expenseId: v.id("expenses") },
    handler: async (ctx, { expenseId }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense) throw new Error("Expense not found");

        await assertMemberRole(ctx, expense.groupId, { requiredRoles: ["owner", "admin"] });

        await ctx.db.patch(expenseId, {
            deletedAt: undefined,
            deletedBy: undefined
        });

        // TODO: Add activity log entry
    }
});
