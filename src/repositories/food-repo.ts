// ─────────────────────────────────────────────────────────────
// repositories/food-repo.ts
// ─────────────────────────────────────────────────────────────
import type { CookingStep, FoodItem, FoodPhoto, Ingredient } from "@/types";
import type { SQLiteDatabase } from "expo-sqlite";

// ── Row → Domain mappers ─────────────────────────────────
const rowToIngredient = (r: any): Ingredient => ({
  id: r.id,
  quantity: r.quantity ?? undefined,
  unit: r.unit ?? undefined,
  name: r.name,
  preparation: r.preparation ?? undefined,
  isOptional: r.is_optional === 1,
});

const rowToStep = (r: any): CookingStep => ({
  id: r.id,
  instruction: r.instruction,
  durationMinutes: r.duration_minutes ?? undefined,
  targetTempC: r.target_temp_c ?? undefined,
});

const rowToPhoto = (r: any): FoodPhoto => ({
  id: r.id,
  uri: r.uri,
  caption: r.caption ?? undefined,
  takenAt: r.taken_at,
});

// ── Public API ──────────────────────────────────────────
export const FoodRepo = {
  /** Full list — excludes soft-deleted. Newest first. */
  async getAll(db: SQLiteDatabase): Promise<FoodItem[]> {
    const recipes = await db.getAllAsync<any>(
      `SELECT * FROM recipes WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );

    const items: FoodItem[] = [];
    for (const r of recipes) {
      const [ingredients, steps, photos] = await Promise.all([
        db.getAllAsync<any>(
          `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order`,
          r.id,
        ),
        db.getAllAsync<any>(
          `SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_number`,
          r.id,
        ),
        db.getAllAsync<any>(
          `SELECT * FROM photos WHERE recipe_id = ? ORDER BY sort_order`,
          r.id,
        ),
      ]);

      items.push({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUri: r.image_uri ?? undefined,
        source: r.source,
        servings: r.servings,
        prepTimeMinutes: r.prep_time_minutes,
        cookTimeMinutes: r.cook_time_minutes,
        ingredients: ingredients.map(rowToIngredient),
        steps: steps.map(rowToStep),
        photos: photos.map(rowToPhoto),
      });
    }
    return items;
  },

  /** Single recipe — returns undefined if soft-deleted or missing. */
  async getById(db: SQLiteDatabase, id: string): Promise<FoodItem | undefined> {
    const r = await db.getFirstAsync<any>(
      `SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL`,
      id,
    );
    if (!r) return undefined;

    const [ingredients, steps, photos] = await Promise.all([
      db.getAllAsync<any>(
        `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order`,
        id,
      ),
      db.getAllAsync<any>(
        `SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_number`,
        id,
      ),
      db.getAllAsync<any>(
        `SELECT * FROM photos WHERE recipe_id = ? ORDER BY sort_order`,
        id,
      ),
    ]);

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      imageUri: r.image_uri ?? undefined,
      source: r.source,
      servings: r.servings,
      prepTimeMinutes: r.prep_time_minutes,
      cookTimeMinutes: r.cook_time_minutes,
      ingredients: ingredients.map(rowToIngredient),
      steps: steps.map(rowToStep),
      photos: photos.map(rowToPhoto),
    };
  },

  /** Insert a full recipe + all children in one transaction. */
  async insert(db: SQLiteDatabase, item: FoodItem): Promise<void> {
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO recipes
           (id, title, description, image_uri, source,
            servings, prep_time_minutes, cook_time_minutes,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.title,
        item.description,
        item.imageUri ?? null,
        item.source,
        item.servings,
        item.prepTimeMinutes,
        item.cookTimeMinutes,
        now,
        now,
      );

      for (let i = 0; i < item.ingredients.length; i++) {
        const ing = item.ingredients[i];
        await db.runAsync(
          `INSERT INTO ingredients
             (id, recipe_id, quantity, unit, name, preparation, is_optional, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ing.id,
          item.id,
          ing.quantity ?? null,
          ing.unit ?? null,
          ing.name,
          ing.preparation ?? null,
          ing.isOptional ? 1 : 0,
          i,
        );
      }

      for (let i = 0; i < item.steps.length; i++) {
        const s = item.steps[i];
        await db.runAsync(
          `INSERT INTO steps
             (id, recipe_id, step_number, instruction, duration_minutes, target_temp_c)
           VALUES (?, ?, ?, ?, ?, ?)`,
          s.id,
          item.id,
          i + 1,
          s.instruction,
          s.durationMinutes ?? null,
          s.targetTempC ?? null,
        );
      }

      for (let i = 0; i < item.photos.length; i++) {
        const p = item.photos[i];
        await db.runAsync(
          `INSERT INTO photos (id, recipe_id, uri, caption, sort_order, taken_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          p.id,
          item.id,
          p.uri,
          p.caption ?? null,
          i,
          p.takenAt,
        );
      }
    });
  },

  /** Replace all children + update the parent. Used for edits. */
  async update(db: SQLiteDatabase, id: string, item: FoodItem): Promise<void> {
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE recipes SET
           title = ?, description = ?, image_uri = ?, source = ?,
           servings = ?, prep_time_minutes = ?, cook_time_minutes = ?,
           updated_at = ?
         WHERE id = ?`,
        item.title,
        item.description,
        item.imageUri ?? null,
        item.source,
        item.servings,
        item.prepTimeMinutes,
        item.cookTimeMinutes,
        now,
        id,
      );

      // Delete + re-insert children (simplest correct approach for edits)
      await db.runAsync(`DELETE FROM ingredients WHERE recipe_id = ?`, id);
      await db.runAsync(`DELETE FROM steps WHERE recipe_id = ?`, id);
      await db.runAsync(`DELETE FROM photos WHERE recipe_id = ?`, id);

      for (let i = 0; i < item.ingredients.length; i++) {
        const ing = item.ingredients[i];
        await db.runAsync(
          `INSERT INTO ingredients
             (id, recipe_id, quantity, unit, name, preparation, is_optional, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ing.id,
          id,
          ing.quantity ?? null,
          ing.unit ?? null,
          ing.name,
          ing.preparation ?? null,
          ing.isOptional ? 1 : 0,
          i,
        );
      }
      for (let i = 0; i < item.steps.length; i++) {
        const s = item.steps[i];
        await db.runAsync(
          `INSERT INTO steps
             (id, recipe_id, step_number, instruction, duration_minutes, target_temp_c)
           VALUES (?, ?, ?, ?, ?, ?)`,
          s.id,
          id,
          i + 1,
          s.instruction,
          s.durationMinutes ?? null,
          s.targetTempC ?? null,
        );
      }
      for (let i = 0; i < item.photos.length; i++) {
        const p = item.photos[i];
        await db.runAsync(
          `INSERT INTO photos (id, recipe_id, uri, caption, sort_order, taken_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          p.id,
          id,
          p.uri,
          p.caption ?? null,
          i,
          p.takenAt,
        );
      }
    });
  },

  /** Soft delete — keeps the row for future sync propagation. */
  async softDelete(db: SQLiteDatabase, id: string): Promise<void> {
    await db.runAsync(
      `UPDATE recipes SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      Date.now(),
      Date.now(),
      id,
    );
    // ON DELETE CASCADE on saved_recipes means the saved row is removed
    // automatically when we hard-delete. For soft-delete we must clean it here.
    await db.runAsync(`DELETE FROM saved_recipes WHERE recipe_id = ?`, id);
  },
};
