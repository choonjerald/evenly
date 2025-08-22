import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  groups: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    currency: v.string(), // lock per group, e.g., "SGD"
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  memberships: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_group_user", ["groupId", "userId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    payerId: v.id("users"),
    amountCents: v.number(), // always integer cents
    currency: v.string(),
    description: v.string(),
    participants: v.array(v.id("users")),
    weights: v.optional(v.record(v.string(), v.number())), // { userId: weight }
    receiptStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_group_createdAt", ["groupId", "createdAt"]),

  invites: defineTable({
    groupId: v.id("groups"),
    code: v.string(), // short, unique
    expiresAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  messages: defineTable({
    author: v.string(),      // email string
    text: v.string(),
    createdAt: v.number(),
  }).index("by_author", ["author"]),

  settlements: defineTable({
    groupId: v.id("groups"),
    fromUserId: v.id("users"), // payer (debtor)
    toUserId: v.id("users"),   // recipient (creditor)
    amountCents: v.number(),   // integer cents
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_group_createdAt", ["groupId", "createdAt"]),
});
