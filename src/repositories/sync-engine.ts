// ─────────────────────────────────────────────────────────────
// repositories/sync-engine.ts
// ─────────────────────────────────────────────────────────────
import type { ConvexReactClient } from "convex/react";
import { Directory, File, Paths } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { fetch as expoFetch } from "expo/fetch";
import { api } from "../../convex/_generated/api";
import { DataEvents } from "./events";
import { SyncMeta } from "./sync-meta";
import { SyncQueue } from "./sync-queue";

const PHOTOS_DIR = new Directory(Paths.document, "food-photos");

function stripNulls<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stripNulls) as unknown as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null) continue;
      out[k] = stripNulls(v);
    }
    return out as T;
  }
  return value;
}

// ─────────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────────
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
      console.error("[sync] run failed:", err?.message);
      return { skipped: false, error: err?.message ?? "unknown" };
    }
  },

  // ── PUSH ────────────────────────────────────────────────
  async push(db: SQLiteDatabase, convex: ConvexReactClient, deviceId: string) {
    const batch = await SyncQueue.getBatch(db, 100);
    if (batch.length === 0) return;

    console.log("[sync] push batch size:", batch.length);

    const compacted = new Map<string, (typeof batch)[number]>();
    for (const row of batch) {
      compacted.set(`${row.entity_type}:${row.entity_id}`, row);
    }

    const photoRows: typeof batch = [];
    const metaRows: typeof batch = [];

    for (const row of compacted.values()) {
      if (row.entity_type === "photo" && row.operation === "upsert") {
        photoRows.push(row);
      } else {
        metaRows.push(row);
      }
    }

    console.log(
      "[sync] meta rows:",
      metaRows.length,
      "photo rows:",
      photoRows.length,
    );

    const succeeded: string[] = [];

    // 1. Meta changes — one network call
    if (metaRows.length > 0) {
      try {
        const changes = metaRows.map((row) => {
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
        await convex.mutation(api.sync.pushChanges, { deviceId, changes });
        succeeded.push(...metaRows.map((r) => r.id));
      } catch (err: any) {
        console.error("[sync] meta push failed:", err?.message);
        for (const row of metaRows) {
          await SyncQueue.markFailed(
            db,
            row.id,
            err?.message ?? "meta push failed",
          );
        }
      }
    }

    // 2. Photo uploads — one at a time
    for (const row of photoRows) {
      try {
        await this.uploadPhoto(db, convex, row);
        succeeded.push(row.id);
      } catch (err: any) {
        console.error(
          "[sync] photo upload failed:",
          row.entity_id,
          err?.message,
        );
        await SyncQueue.markFailed(
          db,
          row.id,
          err?.message ?? "photo upload failed",
        );
      }
    }

    // 3. Remove only successes
    if (succeeded.length > 0) {
      await SyncQueue.remove(db, succeeded);
    }

    await SyncMeta.markPushed(db);
    console.log(
      "[sync] push done — succeeded:",
      succeeded.length,
      "failed:",
      batch.length - succeeded.length,
    );
  },

  // ── UPLOAD PHOTO ────────────────────────────────────────
  async uploadPhoto(
    db: SQLiteDatabase,
    convex: ConvexReactClient,
    row: {
      id: string;
      entity_id: string;
      recipe_id: string | null;
      payload: string | null;
      created_at: number;
    },
  ) {
    const payload = row.payload ? JSON.parse(row.payload) : {};
    const localUri: string | undefined = payload.uri;
    if (!localUri) return;

    const localFile = new File(localUri);
    if (!localFile.exists) return;

    const uploadUrl = await convex.mutation(api.photos.generateUploadUrl);

    const uploadResp = await expoFetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: localFile,
    });

    if (!uploadResp.ok) {
      const text = await uploadResp.text();
      throw new Error(`Upload failed: ${uploadResp.status} ${text}`);
    }

    const { storageId } = await uploadResp.json();

    await convex.mutation(api.sync.pushChanges, {
      deviceId: "local",
      changes: [
        {
          entityType: "photo",
          operation: "upsert",
          localId: row.entity_id,
          recipeLocalId: row.recipe_id ?? undefined,
          payload: stripNulls({
            storageId,
            caption: payload.caption ?? undefined,
            sortOrder: payload.sortOrder ?? 0,
            takenAt: payload.takenAt ?? Date.now(),
            updatedAt: row.created_at,
          }),
          updatedAt: row.created_at,
        },
      ],
    });

    await db.runAsync(
      `UPDATE photos SET storage_id = ?, sync_status = 'synced' WHERE id = ?`,
      storageId,
      row.entity_id,
    );
  },

  // ── PULL — network first, transaction second ────────────
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

      // ── Step 1: Prepare every row (network + file I/O happen HERE)
      const prepared: Array<{
        table: string;
        pk: string;
        data: Record<string, any>;
      }> = [];

      for (const [table, rows] of Object.entries(result.changes)) {
        for (const row of rows as any[]) {
          const entry = await prepareRemoteRow(db, convex, table, row);
          if (entry) prepared.push(entry);
        }
      }

      // ── Step 2: All SQLite writes in ONE short transaction
      if (prepared.length > 0) {
        await db.withTransactionAsync(async () => {
          for (const { table, pk, data } of prepared) {
            await upsertLocal(db, table, pk, data);
          }
        });
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore;
    }

    await SyncMeta.setCursor(db, cursor);
  },
};

// ─────────────────────────────────────────────────────────────
// PREPARE — does all network/file work OUTSIDE any transaction
// ─────────────────────────────────────────────────────────────
async function prepareRemoteRow(
  db: SQLiteDatabase,
  convex: ConvexReactClient,
  table: string,
  row: any,
): Promise<{ table: string; pk: string; data: Record<string, any> } | null> {
  switch (table) {
    case "recipes":
      return {
        table: "recipes",
        pk: "id",
        data: {
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
        },
      };

    case "ingredients":
      return {
        table: "ingredients",
        pk: "id",
        data: {
          id: row.localId,
          recipe_id: row.recipeLocalId,
          quantity: row.quantity ?? null,
          unit: row.unit ?? null,
          name: row.name,
          preparation: row.preparation ?? null,
          is_optional: row.isOptional ? 1 : 0,
          sort_order: row.sortOrder,
          sync_status: "synced",
        },
      };

    case "steps":
      return {
        table: "steps",
        pk: "id",
        data: {
          id: row.localId,
          recipe_id: row.recipeLocalId,
          step_number: row.stepNumber,
          instruction: row.instruction,
          duration_minutes: row.durationMinutes ?? null,
          target_temp_c: row.targetTempC ?? null,
          sync_status: "synced",
        },
      };

    case "photos": {
      // ← network + file IO happens here, before any transaction starts
      const localUri = await resolvePhotoUri(db, convex, row);
      return {
        table: "photos",
        pk: "id",
        data: {
          id: row.localId,
          recipe_id: row.recipeLocalId,
          uri: localUri,
          caption: row.caption ?? null,
          sort_order: row.sortOrder,
          taken_at: row.takenAt,
          storage_id: row.storageId ?? null,
          sync_status: "synced",
        },
      };
    }

    case "savedRecipes":
      return {
        table: "saved_recipes",
        pk: "recipe_id",
        data: {
          recipe_id: row.recipeLocalId,
          saved_at: row.savedAt,
          sync_status: "synced",
        },
      };

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// PHOTO RESOLVER — downloads the file if needed, no transaction
// ─────────────────────────────────────────────────────────────
async function resolvePhotoUri(
  db: SQLiteDatabase,
  convex: ConvexReactClient,
  row: any,
): Promise<string> {
  // Already have a local file? Use it.
  const existing = await db.getFirstAsync<{ uri: string | null }>(
    `SELECT uri FROM photos WHERE id = ?`,
    row.localId,
  );
  if (existing?.uri && existing.uri.startsWith("file://")) {
    return existing.uri;
  }

  if (!row.storageId) return "";

  try {
    const remoteUrl = await convex.query(api.sync.getPhotoUrl, {
      storageId: row.storageId,
    });
    if (!remoteUrl) return "";

    if (!PHOTOS_DIR.exists) {
      PHOTOS_DIR.create({ intermediates: true });
    }
    const destFile = new File(PHOTOS_DIR, `${row.localId}.jpg`);
    const downloaded = await File.downloadFileAsync(remoteUrl, destFile);
    return downloaded.exists ? downloaded.uri : "";
  } catch (err) {
    console.warn("[sync] photo download failed:", err);
    return "";
  }
}

// ─────────────────────────────────────────────────────────────
// UPSERT — pure SQLite write, called inside the short transaction
// ─────────────────────────────────────────────────────────────
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
