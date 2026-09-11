// ─────────────────────────────────────────────────────────────
// repositories/sync-engine.ts
// ─────────────────────────────────────────────────────────────
import type { ConvexReactClient } from "convex/react";
import type { SQLiteDatabase } from "expo-sqlite";
import { api } from "../../convex/_generated/api";
import { DataEvents } from "./events";
import { SyncMeta } from "./sync-meta";
import { SyncQueue } from "./sync-queue";

/**
 * Recursively removes null-valued keys.
 * Convex `v.optional()` accepts missing keys but rejects explicit nulls.
 * Every payload we push goes through this before hitting the wire.
 */
function stripNulls<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => stripNulls(v)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null) continue; // skip null, let v.optional handle it
      out[k] = stripNulls(v);
    }
    return out as T;
  }
  return value;
}

export const SyncEngine = {
  async run(db: SQLiteDatabase, convex: ConvexReactClient) {
    const meta = await SyncMeta.get(db);
    if (!meta?.enabled) return { skipped: true };

    try {
      await this.push(db, convex, meta.device_id);
      await this.pull(db, convex, meta.device_id);
      DataEvents.emit();
      return { skipped: false };
    } catch (err: any) {
      return { skipped: false, error: err?.message ?? "unknown" };
    }
  },

  async push(db: SQLiteDatabase, convex: ConvexReactClient, deviceId: string) {
    const batch = await SyncQueue.getBatch(db, 100);
    if (batch.length === 0) return;

    // Compact: for the same entity, keep only the latest operation
    const compacted = new Map<string, (typeof batch)[number]>();
    for (const row of batch) {
      compacted.set(`${row.entity_type}:${row.entity_id}`, row);
    }

    const changes = [...compacted.values()].map((row) => {
      const raw = row.payload ? JSON.parse(row.payload) : undefined;
      return {
        entityType: row.entity_type,
        operation: row.operation,
        localId: row.entity_id,
        recipeLocalId: row.recipe_id ?? undefined,
        payload: raw ? stripNulls(raw) : undefined,
        updatedAt: row.created_at,
      };
    });

    try {
      await convex.mutation(api.sync.pushChanges, { deviceId, changes });
      await SyncQueue.remove(
        db,
        batch.map((r) => r.id),
      );
      await SyncMeta.markPushed(db);
    } catch (err: any) {
      for (const row of batch) {
        await SyncQueue.markFailed(db, row.id, err?.message ?? "push failed");
      }
      throw err;
    }
  },

  async pull(db: SQLiteDatabase, convex: ConvexReactClient, deviceId: string) {
    const meta = await SyncMeta.get(db);
    if (!meta) return;

    let cursor = meta.cursor;
    let hasMore = true;

    while (hasMore) {
      const result = await convex.query(api.sync.pullChanges, {
        cursor,
        deviceId,
      });

      await db.withTransactionAsync(async () => {
        for (const [table, rows] of Object.entries(result.changes)) {
          for (const row of rows as any[]) {
            await applyRemoteRow(db, table, row);
          }
        }
      });

      cursor = result.nextCursor;
      hasMore = result.hasMore;
    }

    await SyncMeta.setCursor(db, cursor);
  },
};

// ── Apply a remote row to local SQLite ────────────────────
async function applyRemoteRow(db: SQLiteDatabase, table: string, row: any) {
  switch (table) {
    case "recipes":
      await upsertLocal(db, "recipes", "id", {
        id: row.localId,
        title: row.title,
        description: row.description ?? "",
        image_uri: row.imageUri ?? null,
        source: row.source,
        servings: row.servings,
        prep_time_minutes: row.prepTimeMinutes,
        cook_time_minutes: row.cookTimeMinutes,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        deleted_at: row.deletedAt ?? null,
        remote_id: row._id,
        sync_status: "synced",
        last_synced_at: row.updatedAt,
        origin_device: row.originDevice,
      });
      return;

    case "ingredients":
      await upsertLocal(db, "ingredients", "id", {
        id: row.localId,
        recipe_id: row.recipeLocalId,
        quantity: row.quantity ?? null,
        unit: row.unit ?? null,
        name: row.name,
        preparation: row.preparation ?? null,
        is_optional: row.isOptional ? 1 : 0,
        sort_order: row.sortOrder,
        sync_status: "synced",
      });
      return;

    case "steps":
      await upsertLocal(db, "steps", "id", {
        id: row.localId,
        recipe_id: row.recipeLocalId,
        step_number: row.stepNumber,
        instruction: row.instruction,
        duration_minutes: row.durationMinutes ?? null,
        target_temp_c: row.targetTempC ?? null,
        sync_status: "synced",
      });
      return;

    case "photos":
      await upsertLocal(db, "photos", "id", {
        id: row.localId,
        recipe_id: row.recipeLocalId,
        uri: "",
        caption: row.caption ?? null,
        sort_order: row.sortOrder,
        taken_at: row.takenAt,
        storage_id: row.storageId ?? null,
        sync_status: "synced",
      });
      return;

    case "savedRecipes":
      await upsertLocal(db, "saved_recipes", "recipe_id", {
        recipe_id: row.recipeLocalId,
        saved_at: row.savedAt,
        sync_status: "synced",
      });
      return;
  }
}

async function upsertLocal(
  db: SQLiteDatabase,
  table: string,
  pk: string,
  data: Record<string, any>,
) {
  const cols = Object.keys(data);
  const placeholders = cols.map(() => "?").join(", ");
  const updates = cols
    .filter((c) => c !== pk)
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  await db.runAsync(
    `INSERT INTO ${table} (${cols.join(", ")})
     VALUES (${placeholders})
     ON CONFLICT(${pk}) DO UPDATE SET ${updates}`,
    ...cols.map((c) => data[c]),
  );
}
