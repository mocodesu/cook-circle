// ─────────────────────────────────────────────────────────────
// repositories/sync-queue.ts
// ─────────────────────────────────────────────────────────────
import { createId } from "@/types";
import type { SQLiteDatabase } from "expo-sqlite";

export type SyncEntity = "recipe" | "ingredient" | "step" | "photo" | "saved";
export type SyncOperation = "upsert" | "delete";

export interface SyncQueueRow {
  id: string;
  entity_type: SyncEntity;
  entity_id: string;
  recipe_id: string | null;
  operation: SyncOperation;
  payload: string | null;
  created_at: number;
  attempts: number;
  last_error: string | null;
}

export const SyncQueue = {
  async enqueue(
    db: SQLiteDatabase,
    entry: {
      entityType: SyncEntity;
      entityId: string;
      recipeId?: string;
      operation: SyncOperation;
      payload?: unknown;
    },
  ): Promise<void> {
    const meta = await db.getFirstAsync<{ enabled: number }>(
      `SELECT enabled FROM sync_meta WHERE id = 'global'`,
    );
    if (!meta?.enabled) return;

    await db.runAsync(
      `INSERT INTO sync_queue
         (id, entity_type, entity_id, recipe_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      createId(),
      entry.entityType,
      entry.entityId,
      entry.recipeId ?? null,
      entry.operation,
      entry.payload ? JSON.stringify(entry.payload) : null,
      Date.now(),
    );
  },

  async getBatch(db: SQLiteDatabase, limit = 100): Promise<SyncQueueRow[]> {
    return db.getAllAsync<SyncQueueRow>(
      `SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?`,
      limit,
    );
  },

  async remove(db: SQLiteDatabase, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `DELETE FROM sync_queue WHERE id IN (${placeholders})`,
      ...ids,
    );
  },

  async markFailed(
    db: SQLiteDatabase,
    id: string,
    error: string,
  ): Promise<void> {
    await db.runAsync(
      `UPDATE sync_queue
       SET attempts = attempts + 1, last_error = ?
       WHERE id = ?`,
      error,
      id,
    );
  },

  async count(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM sync_queue`,
    );
    return row?.c ?? 0;
  },

  async clear(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(`DELETE FROM sync_queue`);
  },
};
