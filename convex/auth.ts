import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- READ: getMe (no writes allowed in queries)
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return existing ?? null;
  },
});

// --- WRITE: ensureUser (safe to insert in a mutation)
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing;

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? identity.nickname ?? "User",
      email: identity.email ?? undefined,
      avatarUrl: identity.profileUrl ?? undefined,
      createdAt: Date.now(),
    });
    return await ctx.db.get(userId);
  },
});

// Helper for server functions: require an existing user (no creation)
export async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const me = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!me) throw new Error("User not provisioned"); // client should call ensureUser once after sign-in
  return me;
}
