// ─────────────────────────────────────────────────────────────
// convex/sync.ts
// ─────────────────────────────────────────────────────────────
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────
// convex/sync.ts — top of file, replace requireUser
// ─────────────────────────────────────────────────────────────

import { getAuthUserId } from "@convex-dev/auth/server";

async function requireUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return { _id: userId };
}

// ─── Register (or refresh) this device ─────────────────────
export const registerDevice = mutation({
  args: { deviceId: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { deviceId, name }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now(), name });
    } else {
      await ctx.db.insert("devices", {
        userId: user._id,
        deviceId,
        name,
        lastSeenAt: Date.now(),
      });
    }
    return { userId: user._id };
  },
});

// ─── Push: batch upsert from local outbox ──────────────────
export const pushChanges = mutation({
  args: {
    deviceId: v.string(),
    changes: v.array(
      v.object({
        entityType: v.union(
          v.literal("recipe"),
          v.literal("ingredient"),
          v.literal("step"),
          v.literal("photo"),
          v.literal("saved"),
        ),
        operation: v.union(v.literal("upsert"), v.literal("delete")),
        localId: v.string(),
        recipeLocalId: v.optional(v.string()),
        payload: v.optional(v.any()),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, { deviceId, changes }) => {
    const user = await requireUser(ctx);

    for (const change of changes) {
      const table = tableForEntity(change.entityType);
      const keyField = change.entityType === "recipe" ? "localId" : "localId";
      const keyValue = change.localId;

      // Find existing remote row by (userId, localId)
      const existing = await (ctx.db.query(table as any) as any)
        .withIndex("by_user_local", (q: any) =>
          q.eq("userId", user._id).eq(keyField, keyValue),
        )
        .unique();

      if (change.operation === "delete") {
        if (existing) await ctx.db.delete(existing._id);
        continue;
      }

      if (existing) {
        // Last-write-wins: only apply if remote is older
        if ((existing.updatedAt ?? 0) > change.updatedAt) continue;
        await ctx.db.patch(existing._id, {
          ...change.payload,
          updatedAt: change.updatedAt,
          originDevice: deviceId,
        });
      } else {
        await ctx.db.insert(table as any, {
          userId: user._id,
          localId: change.localId,
          recipeLocalId: change.recipeLocalId,
          ...change.payload,
          updatedAt: change.updatedAt,
          originDevice: deviceId,
        });
      }
    }

    return { applied: changes.length, serverTime: Date.now() };
  },
});

// ─── Pull: everything changed since `cursor` ───────────────
export const pullChanges = query({
  args: { cursor: v.number(), deviceId: v.string() },
  handler: async (ctx, { cursor, deviceId }) => {
    const user = await requireUser(ctx);
    const LIMIT = 200;

    const tables = [
      "recipes",
      "ingredients",
      "steps",
      "photos",
      "savedRecipes",
    ] as const;

    const result: Record<string, any[]> = {};
    let maxUpdated = cursor;

    for (const t of tables) {
      const rows = await ctx.db
        .query(t)
        .withIndex("by_user_updated", (q) =>
          q.eq("userId", user._id).gt("updatedAt", cursor),
        )
        .take(LIMIT);

      // Don't echo back rows this device wrote
      result[t] = rows.filter((r) => r.originDevice !== deviceId);

      for (const r of rows) {
        if (r.updatedAt > maxUpdated) maxUpdated = r.updatedAt;
      }
    }

    return {
      changes: result,
      nextCursor: maxUpdated,
      hasMore: Object.values(result).some((rows) => rows.length === LIMIT),
    };
  },
});

// ─── Photo upload URL (client uploads binary separately) ───
export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

// ─── Entity → table name ──────────────────────────────────
function tableForEntity(entity: string) {
  switch (entity) {
    case "recipe":
      return "recipes";
    case "ingredient":
      return "ingredients";
    case "step":
      return "steps";
    case "photo":
      return "photos";
    case "saved":
      return "savedRecipes";
    default:
      throw new Error(`Unknown entity: ${entity}`);
  }
}
