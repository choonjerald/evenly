import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

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

// Helper (server-side) to require auth and fetch user doc
export async function requireUser(ctx: any) {
  const me = await ctx.runQuery(getMe, {});
  if (!me) {
    throw new Error("Unauthorized");
  }
  return me;
}
