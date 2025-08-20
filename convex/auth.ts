import { customCtx, customQuery } from "convex-helpers/server/customFunctions";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES, Role } from "./schema";
import { v } from "convex/values";

// --- User Helpers ---

export const requireUser = customCtx(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkUser.id" as any, identity.subject))
    .unique();

  return { user: user!, clerkIdentity: identity };
});

// --- Membership & Role Helpers ---

export const getMembership = async (
  ctx: QueryCtx | MutationCtx,
  groupId: string,
  userId: string
) => {
  return await ctx.db
    .query("members")
    .withIndex("by_group_and_user", (q) =>
      q.eq("groupId", groupId as any).eq("userId", userId as any)
    )
    .unique();
};

export const isMember = customQuery(
  async (ctx, { groupId }: { groupId: string }) => {
    const { user } = await requireUser(ctx);
    if (!user) return false;
    const membership = await getMembership(ctx, groupId, user._id);
    return !!membership;
  },
  {
    args: { groupId: v.id("groups") },
  }
);

export const assertMemberRole = async (
  ctx: QueryCtx | MutationCtx,
  groupId: string,
  options: { requiredRoles: Role[] }
) => {
  const { user } = await requireUser(ctx as any);
  const membership = await getMembership(ctx, groupId, user._id);

  if (!membership || !options.requiredRoles.includes(membership.role)) {
    throw new Error("Permission denied: Insufficient role");
  }
  return { membership, user };
};
