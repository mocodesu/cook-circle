// ─────────────────────────────────────────────────────────────
// db/client.ts
// ─────────────────────────────────────────────────────────────
import * as SQLite from "expo-sqlite";

/**
 * Creates the schema on first launch. There are no migrations —
 * the app is new, so this is the single source of truth.
 * If you ever change the schema, bump the app version and
 * handle the transition explicitly in a rebuild path.
 */
export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.execAsync(`
    -- ── Recipes ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS recipes (
      id                TEXT PRIMARY KEY NOT NULL,
      title             TEXT NOT NULL,
      description       TEXT NOT NULL DEFAULT '',
      image_uri         TEXT,
      source            TEXT NOT NULL DEFAULT 'created',
      servings          INTEGER NOT NULL DEFAULT 2,
      prep_time_minutes INTEGER NOT NULL DEFAULT 0,
      cook_time_minutes INTEGER NOT NULL DEFAULT 0,
      created_at        INTEGER NOT NULL,
      updated_at        INTEGER NOT NULL,
      deleted_at        INTEGER,
      remote_id         TEXT,
      sync_status       TEXT NOT NULL DEFAULT 'pending',
      last_synced_at    INTEGER,
      origin_device     TEXT
    );

    -- ── Ingredients ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ingredients (
      id          TEXT PRIMARY KEY NOT NULL,
      recipe_id   TEXT NOT NULL,
      quantity    REAL,
      unit        TEXT,
      name        TEXT NOT NULL,
      preparation TEXT,
      is_optional INTEGER NOT NULL DEFAULT 0,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    -- ── Steps ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS steps (
      id               TEXT PRIMARY KEY NOT NULL,
      recipe_id        TEXT NOT NULL,
      step_number      INTEGER NOT NULL,
      instruction      TEXT NOT NULL,
      duration_minutes INTEGER,
      target_temp_c    REAL,
      sync_status      TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    -- ── Photos ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS photos (
      id          TEXT PRIMARY KEY NOT NULL,
      recipe_id   TEXT NOT NULL,
      uri         TEXT NOT NULL,
      caption     TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      taken_at    INTEGER NOT NULL,
      storage_id  TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    -- ── Saved recipes ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS saved_recipes (
      recipe_id   TEXT PRIMARY KEY NOT NULL,
      saved_at    INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    -- ── Sync outbox ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sync_queue (
      id          TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      recipe_id   TEXT,
      operation   TEXT NOT NULL,
      payload     TEXT,
      created_at  INTEGER NOT NULL,
      attempts    INTEGER NOT NULL DEFAULT 0,
      last_error  TEXT
    );

    -- ── Sync state (single row) ────────────────────────────
    CREATE TABLE IF NOT EXISTS sync_meta (
      id           TEXT PRIMARY KEY NOT NULL,
      device_id    TEXT NOT NULL,
      user_id      TEXT,
      cursor       INTEGER NOT NULL DEFAULT 0,
      last_push_at INTEGER,
      last_pull_at INTEGER,
      enabled      INTEGER NOT NULL DEFAULT 0
    );

    -- ── Registered devices ─────────────────────────────────
    CREATE TABLE IF NOT EXISTS sync_devices (
      device_id     TEXT PRIMARY KEY NOT NULL,
      device_name   TEXT,
      registered_at INTEGER NOT NULL
    );

    -- ── Indexes ────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_steps_recipe       ON steps(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_photos_recipe      ON photos(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_deleted    ON recipes(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);

    -- ── Seed sync_meta ─────────────────────────────────────
    INSERT OR IGNORE INTO sync_meta (id, device_id, cursor, enabled)
    VALUES ('global', lower(hex(randomblob(16))), 0, 0);
  `);
}
