import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ROLES = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
  v.literal("viewer")
);
export type Role = typeof ROLES.values[number];

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    clerkUser: v.any(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_id", [("clerkUser.id" as any)]),

  groups: defineTable({
    name: v.string(),
    homeCurrency: v.string(), // ISO 4217 code
    ownerId: v.id("users"),
  }),

  members: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    role: ROLES,
  })
    .index("by_group_and_user", ["groupId", "userId"])
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"]),

  invites: defineTable({
    groupId: v.id("groups"),
    email: v.string(),
    role: ROLES,
    invitedBy: v.id("users"),
  })
    .index("by_group_and_email", ["groupId", "email"])
    .index("by_email", ["email"]),

  categories: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_group", ["groupId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    paidBy: v.id("users"),
    paidAt: v.number(), // timestamp
    amount: v.number(), // minor units
    currency: v.string(), // ISO 4217 code
    memo: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    receiptId: v.optional(v.id("receipts")),
    // For v1.1 multi-currency
    fxRate: v.optional(v.number()), // to homeCurrency
    // For soft-delete
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  }).index("by_group", ["groupId"]),

  splits: defineTable({
    expenseId: v.id("expenses"),
    userId: v.id("users"),
    share: v.number(), // minor units owed
    // For split methods
    method: v.union(
      v.literal("equal"),
      v.literal("shares"),
      v.literal("percentage"),
      v.literal("manual")
    ),
    weight: v.optional(v.number()), // for shares/percentage
  })
    .index("by_expense", ["expenseId"])
    .index("by_user", ["userId"]),

  payments: defineTable({
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    paidAt: v.number(), // timestamp
    amount: v.number(), // minor units, in group's homeCurrency
    memo: v.optional(v.string()),
    // For voiding
    voidedAt: v.optional(v.number()),
    voidedBy: v.optional(v.id("users")),
  })
    .index("by_group", ["groupId"]),

  receipts: defineTable({
    storageId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    uploadedBy: v.id("users"),
  }),

  activity: defineTable({
    groupId: v.id("groups"),
    timestamp: v.number(),
    userId: v.id("users"),
    verb: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted")
    ),
    entityType: v.union(
      v.literal("expense"),
      v.literal("payment"),
      v.literal("member"),
      v.literal("group")
    ),
    entityId: v.string(), // Can't be v.id() due to heterogeneity
    before: v.optional(v.any()),
    after: v.optional(v.any()),
  }).index("by_group", ["groupId"]),

  notifications: defineTable({
    userId: v.id("users"),
    activityId: v.id("activity"),
    readAt: v.optional(v.number()),
  })
    .index("by_user_and_read_status", ["userId", "readAt"])
    .index("by_user", ["userId"]),

  // v1.1 scaffolding
  recurringExpenses: defineTable({
    groupId: v.id("groups"),
    templateExpense: v.any(), // Store a template of the expense to create
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    nextDueDate: v.number(), // timestamp
    lastCreated: v.optional(v.number()),
    timezone: v.string(),
  }).index("by_next_due_date", ["nextDueDate"]),
});
