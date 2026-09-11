// ─────────────────────────────────────────────────────────────
// db/client.ts
// ─────────────────────────────────────────────────────────────
import * as SQLite from "expo-sqlite";

export const SCHEMA_VERSION = 1;

/**
 * Opens (or creates) the database and runs migrations.
 * Called once by <SQLiteProvider onInit={...}>.
 */
export async function migrateIfNeeded(db: SQLite.SQLiteDatabase) {
  // Enable WAL for better read/write concurrency
  await db.execAsync("PRAGMA journal_mode = WAL;");
  // Foreign keys MUST be enabled before every connection for CASCADE to work
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  const from = row?.user_version ?? 0;

  if (from === SCHEMA_VERSION) return;
  if (from > SCHEMA_VERSION) {
    throw new Error(`DB version ${from} > app version ${SCHEMA_VERSION}`);
  }

  await db.withTransactionAsync(async () => {
    for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
      await runMigration(db, v);
      await db.execAsync(`PRAGMA user_version = ${v};`);
    }
  });
}

async function runMigration(db: SQLite.SQLiteDatabase, toVersion: number) {
  switch (toVersion) {
    case 1:
      await db.execAsync(`
        -- ── Recipes ────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS recipes (
          id                TEXT PRIMARY KEY NOT NULL,
          title             TEXT NOT NULL,
          description       TEXT NOT NULL DEFAULT '',
          image_uri         TEXT,
          source            TEXT NOT NULL DEFAULT 'created',  -- 'created' | 'forked'
          servings          INTEGER NOT NULL DEFAULT 2,
          prep_time_minutes INTEGER NOT NULL DEFAULT 0,
          cook_time_minutes INTEGER NOT NULL DEFAULT 0,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL,
          deleted_at        INTEGER                                  -- soft delete
        );

        -- ── Ingredients ────────────────────────────────────
        CREATE TABLE IF NOT EXISTS ingredients (
          id          TEXT PRIMARY KEY NOT NULL,
          recipe_id   TEXT NOT NULL,
          quantity    REAL,
          unit        TEXT,
          name        TEXT NOT NULL,
          preparation TEXT,
          is_optional INTEGER NOT NULL DEFAULT 0,
          sort_order  INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        -- ── Steps ──────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS steps (
          id               TEXT PRIMARY KEY NOT NULL,
          recipe_id        TEXT NOT NULL,
          step_number      INTEGER NOT NULL,
          instruction      TEXT NOT NULL,
          duration_minutes INTEGER,
          target_temp_c    REAL,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        -- ── Photos ─────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS photos (
          id         TEXT PRIMARY KEY NOT NULL,
          recipe_id  TEXT NOT NULL,
          uri        TEXT NOT NULL,
          caption    TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          taken_at   INTEGER NOT NULL,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        -- ── Saved Recipes ──────────────────────────────────
        CREATE TABLE IF NOT EXISTS saved_recipes (
          recipe_id  TEXT PRIMARY KEY NOT NULL,
          saved_at   INTEGER NOT NULL,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        -- ── Indexes ────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_steps_recipe      ON steps(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_photos_recipe     ON photos(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_recipes_deleted   ON recipes(deleted_at);
      `);
      return;
    default:
      throw new Error(`Missing migration for version ${toVersion}`);
  }
}
