/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as expenses from "../expenses.js";
import type * as groups from "../groups.js";
import type * as invites from "../invites.js";
import type * as lib_splits from "../lib/splits.js";
import type * as members from "../members.js";
import type * as notifications from "../notifications.js";
import type * as settlements from "../settlements.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  categories: typeof categories;
  expenses: typeof expenses;
  groups: typeof groups;
  invites: typeof invites;
  "lib/splits": typeof lib_splits;
  members: typeof members;
  notifications: typeof notifications;
  settlements: typeof settlements;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
