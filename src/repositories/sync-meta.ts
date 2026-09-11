// ─────────────────────────────────────────────────────────────
// repositories/sync-meta.ts
// ─────────────────────────────────────────────────────────────
import type { SQLiteDatabase } from "expo-sqlite";

export interface SyncMetaRow {
  id: string;
  device_id: string;
  user_id: string | null;
  cursor: number;
  last_push_at: number | null;
  last_pull_at: number | null;
  enabled: number;
}

export const SyncMeta = {
  async get(db: SQLiteDatabase): Promise<SyncMetaRow | null> {
    return db.getFirstAsync<SyncMetaRow>(
      `SELECT * FROM sync_meta WHERE id = 'global'`,
    );
  },

  async setEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
    await db.runAsync(
      `UPDATE sync_meta SET enabled = ? WHERE id = 'global'`,
      enabled ? 1 : 0,
    );
  },

  async setUser(db: SQLiteDatabase, userId: string | null): Promise<void> {
    await db.runAsync(
      `UPDATE sync_meta SET user_id = ? WHERE id = 'global'`,
      userId,
    );
  },

  async setCursor(db: SQLiteDatabase, cursor: number): Promise<void> {
    await db.runAsync(
      `UPDATE sync_meta SET cursor = ?, last_pull_at = ? WHERE id = 'global'`,
      cursor,
      Date.now(),
    );
  },

  async markPushed(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(
      `UPDATE sync_meta SET last_push_at = ? WHERE id = 'global'`,
      Date.now(),
    );
  },

  async reset(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(
      `UPDATE sync_meta
       SET cursor = 0, user_id = NULL, last_push_at = NULL, last_pull_at = NULL
       WHERE id = 'global'`,
    );
  },
};
