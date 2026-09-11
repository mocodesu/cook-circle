// ─────────────────────────────────────────────────────────────
// repositories/food-repo.ts
// ─────────────────────────────────────────────────────────────
import { DataEvents } from "@/repositories/events";
import { SyncQueue } from "@/repositories/sync-queue";
import type { CookingStep, FoodItem, FoodPhoto, Ingredient } from "@/types";
import { File } from "expo-file-system";
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
  storageId: r.storage_id ?? undefined,
  syncStatus: r.sync_status ?? "local",
});

const rowToFoodItem = async (db: SQLiteDatabase, r: any): Promise<FoodItem> => {
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
};

// ── Children insert (also enqueued for sync) ──────────────
const insertChildren = async (
  db: SQLiteDatabase,
  recipeId: string,
  item: FoodItem,
  now: number,
) => {
  for (let i = 0; i < item.ingredients.length; i++) {
    const ing = item.ingredients[i];
    await db.runAsync(
      `INSERT INTO ingredients
         (id, recipe_id, quantity, unit, name, preparation, is_optional, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ing.id,
      recipeId,
      ing.quantity ?? null,
      ing.unit ?? null,
      ing.name,
      ing.preparation ?? null,
      ing.isOptional ? 1 : 0,
      i,
    );
    await SyncQueue.enqueue(db, {
      entityType: "ingredient",
      entityId: ing.id,
      recipeId,
      operation: "upsert",
      payload: {
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        name: ing.name,
        preparation: ing.preparation ?? null,
        isOptional: ing.isOptional ?? false,
        sortOrder: i,
        updatedAt: now,
      },
    });
  }

  for (let i = 0; i < item.steps.length; i++) {
    const s = item.steps[i];
    await db.runAsync(
      `INSERT INTO steps
         (id, recipe_id, step_number, instruction, duration_minutes, target_temp_c)
       VALUES (?, ?, ?, ?, ?, ?)`,
      s.id,
      recipeId,
      i + 1,
      s.instruction,
      s.durationMinutes ?? null,
      s.targetTempC ?? null,
    );
    await SyncQueue.enqueue(db, {
      entityType: "step",
      entityId: s.id,
      recipeId,
      operation: "upsert",
      payload: {
        stepNumber: i + 1,
        instruction: s.instruction,
        durationMinutes: s.durationMinutes ?? null,
        targetTempC: s.targetTempC ?? null,
        updatedAt: now,
      },
    });
  }

  for (let i = 0; i < item.photos.length; i++) {
    const p = item.photos[i];
    await db.runAsync(
      `INSERT INTO photos (id, recipe_id, uri, caption, sort_order, taken_at, storage_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      recipeId,
      p.uri,
      p.caption ?? null,
      i,
      p.takenAt,
      p.storageId ?? null,
    );
    await SyncQueue.enqueue(db, {
      entityType: "photo",
      entityId: p.id,
      recipeId,
      operation: "upsert",
      payload: {
        uri: p.uri,
        caption: p.caption ?? null,
        sortOrder: i,
        takenAt: p.takenAt,
        updatedAt: now,
      },
    });
  }
};

// ── Public API ────────────────────────────────────────────
export const FoodRepo = {
  async getAll(db: SQLiteDatabase): Promise<FoodItem[]> {
    const recipes = await db.getAllAsync<any>(
      `SELECT * FROM recipes WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    return Promise.all(recipes.map((r) => rowToFoodItem(db, r)));
  },

  async getById(db: SQLiteDatabase, id: string): Promise<FoodItem | undefined> {
    const r = await db.getFirstAsync<any>(
      `SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL`,
      id,
    );
    if (!r) return undefined;
    return rowToFoodItem(db, r);
  },

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
      await insertChildren(db, item.id, item, now);
    });

    await SyncQueue.enqueue(db, {
      entityType: "recipe",
      entityId: item.id,
      operation: "upsert",
      payload: {
        title: item.title,
        description: item.description,
        imageUri: item.imageUri ?? null,
        source: item.source,
        servings: item.servings,
        prepTimeMinutes: item.prepTimeMinutes,
        cookTimeMinutes: item.cookTimeMinutes,
        createdAt: now,
        updatedAt: now,
      },
    });

    DataEvents.emit();
  },

  async update(db: SQLiteDatabase, id: string, item: FoodItem): Promise<void> {
    const now = Date.now();

    // Read old photo rows BEFORE deleting so we can clean up files
    const oldPhotos = await db.getAllAsync<{
      id: string;
      uri: string;
      storage_id: string | null;
    }>(`SELECT id, uri, storage_id FROM photos WHERE recipe_id = ?`, id);

    const newPhotoIds = new Set(item.photos.map((p) => p.id));

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

      await db.runAsync(`DELETE FROM ingredients WHERE recipe_id = ?`, id);
      await db.runAsync(`DELETE FROM steps WHERE recipe_id = ?`, id);
      await db.runAsync(`DELETE FROM photos WHERE recipe_id = ?`, id);

      await insertChildren(db, id, item, now);
    });

    // Delete local files for removed photos
    for (const old of oldPhotos) {
      if (!newPhotoIds.has(old.id)) {
        if (old.uri) {
          try {
            new File(old.uri).delete();
          } catch {}
        }
        // If the photo had a storageId, enqueue remote delete
        if (old.storage_id) {
          await SyncQueue.enqueue(db, {
            entityType: "photo",
            entityId: old.id,
            recipeId: id,
            operation: "delete",
          });
        }
      }
    }

    await SyncQueue.enqueue(db, {
      entityType: "recipe",
      entityId: id,
      operation: "upsert",
      payload: {
        title: item.title,
        description: item.description,
        imageUri: item.imageUri ?? null,
        source: item.source,
        servings: item.servings,
        prepTimeMinutes: item.prepTimeMinutes,
        cookTimeMinutes: item.cookTimeMinutes,
        updatedAt: now,
      },
    });

    DataEvents.emit();
  },

  async softDelete(db: SQLiteDatabase, id: string): Promise<void> {
    const now = Date.now();

    // Read photo rows BEFORE deleting so we know which local files to remove
    const photos = await db.getAllAsync<{
      uri: string;
      storage_id: string | null;
    }>(`SELECT uri, storage_id FROM photos WHERE recipe_id = ?`, id);

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE recipes SET deleted_at = ?, updated_at = ? WHERE id = ?`,
        now,
        now,
        id,
      );
      await db.runAsync(`DELETE FROM saved_recipes WHERE recipe_id = ?`, id);
    });

    // Delete local files using the new File API
    for (const photo of photos) {
      if (photo.uri) {
        try {
          new File(photo.uri).delete();
        } catch {}
      }
    }

    await SyncQueue.enqueue(db, {
      entityType: "recipe",
      entityId: id,
      operation: "delete",
    });

    DataEvents.emit();
  },
};
