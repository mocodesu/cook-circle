// ─────────────────────────────────────────────────────────────
// types/index.ts
// ─────────────────────────────────────────────────────────────
//
// Single source of truth for every domain type used across the app.
// These mirror the SQLite schema in `db/client.ts` — when you add a
// column, add the field here.
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
//  RECIPE DOMAIN
// ═══════════════════════════════════════════════════════════

/** One line in a recipe's ingredient list. */
export interface Ingredient {
  id: string;
  /** e.g. 1.5, 0.33. Undefined means "to taste". */
  quantity?: number;
  /** e.g. "cup", "tbsp", "g", "head". Undefined for countable items (3 bay leaves). */
  unit?: string;
  /** e.g. "chicken thighs", "soy sauce". */
  name: string;
  /** e.g. "diced", "sifted", "room temperature". */
  preparation?: string;
  /** True for salt, pepper, garnish — items that don't scale linearly. */
  isOptional?: boolean;
}

/** One step in a recipe's instructions. */
export interface CookingStep {
  id: string;
  instruction: string;
  /** Timer duration shown in cooking mode. */
  durationMinutes?: number;
  /** Target temperature for steps like "cook until 165°C". */
  targetTempC?: number;
}

/** A photo attached to a recipe. Stored in the app's document directory. */
export interface FoodPhoto {
  id: string;
  /** file:// path from expo-file-system. */
  uri: string;
  caption?: string;
  /** Unix ms — used to preserve ordering across edits. */
  takenAt: number;
}

/** A complete recipe with all its children hydrated. */
export interface FoodItem {
  id: string;
  title: string;
  description: string;
  /** Convenience: the first photo. Kept in sync with `photos[0].uri`. */
  imageUri?: string;
  /** "created" = user made it. "forked" = copied from a shared recipe. */
  source: "created" | "forked";
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  photos: FoodPhoto[];
}

// ═══════════════════════════════════════════════════════════
//  FORM / PICKER
// ═══════════════════════════════════════════════════════════

/**
 * A photo the user just picked but hasn't saved yet.
 * Once saved, it becomes a `FoodPhoto` with a `takenAt` timestamp.
 */
export interface PickedPhoto {
  id: string;
  uri: string;
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Generates a collision-resistant id for a new recipe or child row.
 * Timestamp prefix keeps ids roughly sortable; random suffix prevents
 * collisions when creating multiple rows in the same millisecond
 * (e.g. an ingredient + a step in a single save).
 */
export const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Blank FoodItem for the create form.
 * Not persisted — the form calls FoodRepo.insert with the filled version.
 */
export const createEmptyFoodItem = (): FoodItem => ({
  id: "",
  title: "",
  description: "",
  imageUri: undefined,
  source: "created",
  servings: 2,
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  ingredients: [],
  steps: [],
  photos: [],
});
