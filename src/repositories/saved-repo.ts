// ─────────────────────────────────────────────────────────────
// repositories/saved-repo.ts
// ─────────────────────────────────────────────────────────────
import { DataEvents } from "@/repositories/events";
import type { FoodItem } from "@/types";
import type { SQLiteDatabase } from "expo-sqlite";
import { FoodRepo } from "./food-repo";

export const SavedRepo = {
  async getAllIds(db: SQLiteDatabase): Promise<string[]> {
    const rows = await db.getAllAsync<{ recipe_id: string }>(
      `SELECT recipe_id FROM saved_recipes ORDER BY saved_at DESC`,
    );
    return rows.map((r) => r.recipe_id);
  },

  async getSavedItems(db: SQLiteDatabase): Promise<FoodItem[]> {
    const ids = await this.getAllIds(db);
    const items = await Promise.all(ids.map((id) => FoodRepo.getById(db, id)));
    return items.filter((x): x is FoodItem => Boolean(x));
  },

  async isSaved(db: SQLiteDatabase, recipeId: string): Promise<boolean> {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM saved_recipes WHERE recipe_id = ?`,
      recipeId,
    );
    return (row?.count ?? 0) > 0;
  },

  async save(db: SQLiteDatabase, recipeId: string): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO saved_recipes (recipe_id, saved_at) VALUES (?, ?)`,
      recipeId,
      Date.now(),
    );
    DataEvents.emit();
  },

  async unsave(db: SQLiteDatabase, recipeId: string): Promise<void> {
    await db.runAsync(
      `DELETE FROM saved_recipes WHERE recipe_id = ?`,
      recipeId,
    );
    DataEvents.emit();
  },

  async toggle(db: SQLiteDatabase, recipeId: string): Promise<boolean> {
    const saved = await this.isSaved(db, recipeId);
    if (saved) await this.unsave(db, recipeId);
    else await this.save(db, recipeId);
    return !saved;
  },
};
