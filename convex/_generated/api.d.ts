/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as announcements from "../announcements.js";
import type * as billing from "../billing.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as exports from "../exports.js";
import type * as growthMap from "../growthMap.js";
import type * as health from "../health.js";
import type * as lib_conversationTitle from "../lib/conversationTitle.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_goalLimits from "../lib/goalLimits.js";
import type * as lib_identityHash from "../lib/identityHash.js";
import type * as lib_ownedData from "../lib/ownedData.js";
import type * as lib_serverAuth from "../lib/serverAuth.js";
import type * as operator from "../operator.js";
import type * as privacy from "../privacy.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  admin: typeof admin;
  announcements: typeof announcements;
  billing: typeof billing;
  crons: typeof crons;
  email: typeof email;
  exports: typeof exports;
  growthMap: typeof growthMap;
  health: typeof health;
  "lib/conversationTitle": typeof lib_conversationTitle;
  "lib/email": typeof lib_email;
  "lib/entitlements": typeof lib_entitlements;
  "lib/goalLimits": typeof lib_goalLimits;
  "lib/identityHash": typeof lib_identityHash;
  "lib/ownedData": typeof lib_ownedData;
  "lib/serverAuth": typeof lib_serverAuth;
  operator: typeof operator;
  privacy: typeof privacy;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
