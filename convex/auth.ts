import { query, mutation } from "./_generated/server";

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

    const name = identity.name ?? identity.nickname ?? "User";
    const email = identity.email ?? undefined;
    // ✅ Clerk/Convex identity exposes `pictureUrl` (avatar)
    const avatarUrl = identity.pictureUrl ?? identity.profileUrl ?? undefined;

    if (existing) {
      const updates: any = {};
      if (existing.name !== name) updates.name = name;
      if (existing.email !== email) updates.email = email;
      if (existing.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;
      if (Object.keys(updates).length) {
        await ctx.db.patch(existing._id, updates);
      }
      return await ctx.db.get(existing._id);
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name,
      email,
      avatarUrl,        // <-- saved here
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
