// ─────────────────────────────────────────────────────────────
// store/saved-recipes.ts
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";

/**
 * Static seed — replace with a SQLite read on boot.
 * Later: hydrate from `saved_recipes` table, and write on every toggle.
 */
const INITIAL_SAVED_IDS: string[] = ["1", "3"];

interface SavedRecipesState {
  /** Array (not Set) — Zustand reactivity works best with new references. */
  savedIds: string[];
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedRecipes = create<SavedRecipesState>((set, get) => ({
  savedIds: INITIAL_SAVED_IDS,

  toggle: (id) =>
    set((state) => ({
      savedIds: state.savedIds.includes(id)
        ? state.savedIds.filter((x) => x !== id)
        : [...state.savedIds, id],
      // Later: SQLite write here
      // SavedRepo.toggle(id);
    })),

  isSaved: (id) => get().savedIds.includes(id),
}));
