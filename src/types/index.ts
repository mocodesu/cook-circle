// ─────────────────────────────────────────────────────────────
// types/index.ts
// ─────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  quantity?: number;
  unit?: string;
  name: string;
  preparation?: string;
  isOptional?: boolean;
}

export interface CookingStep {
  id: string;
  instruction: string;
  durationMinutes?: number;
  targetTempC?: number;
}

export interface FoodPhoto {
  id: string;
  /** Local file path. Empty string when the photo is remote-only. */
  uri: string;
  caption?: string;
  takenAt: number;
  /** Convex `_storage` id once uploaded. Undefined until sync. */
  storageId?: string;
  /**
   * Sync state for this photo:
   *  - "local"   → not uploaded, no storageId
   *  - "pending" → in sync_queue, waiting for push
   *  - "synced"  → storageId set, remote file exists
   */
  syncStatus: "local" | "pending" | "synced";
}

export interface FoodItem {
  id: string;
  title: string;
  description: string;
  imageUri?: string;
  source: "created" | "forked";
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  photos: FoodPhoto[];
}

export interface PickedPhoto {
  id: string;
  uri: string;
}

export const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
