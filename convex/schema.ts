// ─────────────────────────────────────────────────────────────
// convex/schema.ts
// ─────────────────────────────────────────────────────────────
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  devices: defineTable({
    userId: v.id("users"),
    deviceId: v.string(),
    name: v.optional(v.string()),
    lastSeenAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"]),

  recipes: defineTable({
    userId: v.id("users"),
    localId: v.string(),
    title: v.string(),
    description: v.string(),
    imageUri: v.optional(v.string()),
    source: v.union(v.literal("created"), v.literal("forked")),
    servings: v.number(),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    originDevice: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_local", ["userId", "localId"]),

  ingredients: defineTable({
    userId: v.id("users"),
    recipeLocalId: v.string(),
    localId: v.string(),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    name: v.string(),
    preparation: v.optional(v.string()),
    isOptional: v.boolean(),
    sortOrder: v.number(),
    updatedAt: v.number(),
    originDevice: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_local", ["userId", "localId"]),

  steps: defineTable({
    userId: v.id("users"),
    recipeLocalId: v.string(),
    localId: v.string(),
    stepNumber: v.number(),
    instruction: v.string(),
    durationMinutes: v.optional(v.number()),
    targetTempC: v.optional(v.number()),
    updatedAt: v.number(),
    originDevice: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_local", ["userId", "localId"]),

  photos: defineTable({
    userId: v.id("users"),
    recipeLocalId: v.string(),
    localId: v.string(),
    storageId: v.optional(v.id("_storage")),
    caption: v.optional(v.string()),
    sortOrder: v.number(),
    takenAt: v.number(),
    updatedAt: v.number(),
    originDevice: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_local", ["userId", "localId"])
    .index("by_recipe", ["userId", "recipeLocalId"]), // ← for cascade delete

  savedRecipes: defineTable({
    userId: v.id("users"),
    localId: v.string(),
    recipeLocalId: v.string(),
    savedAt: v.number(),
    updatedAt: v.number(),
    originDevice: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_local", ["userId", "localId"]),
});
