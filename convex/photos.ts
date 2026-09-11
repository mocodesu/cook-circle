// ─────────────────────────────────────────────────────────────
// convex/photos.ts
// ─────────────────────────────────────────────────────────────
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

async function requireUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return { _id: userId };
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteStorageFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireUser(ctx);
    try {
      await ctx.storage.delete(storageId);
    } catch {
      // Already gone
    }
  },
});

export const deleteRecipeStorage = mutation({
  args: { recipeLocalId: v.string() },
  handler: async (ctx, { recipeLocalId }) => {
    const user = await requireUser(ctx);

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_recipe", (q) =>
        q.eq("userId", user._id).eq("recipeLocalId", recipeLocalId),
      )
      .collect();

    for (const photo of photos) {
      if (photo.storageId) {
        try {
          await ctx.storage.delete(photo.storageId);
        } catch {}
      }
      await ctx.db.delete(photo._id);
    }

    return { deleted: photos.length };
  },
});
