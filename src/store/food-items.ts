// ─────────────────────────────────────────────────────────────
// store/food-items.ts
// ─────────────────────────────────────────────────────────────
import { FOOD_ITEMS, type FoodItem } from "@/data/food-items";
import { useSavedRecipes } from "@/store/saved-recipes";
import { create } from "zustand";

interface FoodItemsState {
  items: FoodItem[];
  addItem: (item: FoodItem) => void;
  removeItem: (id: string) => void;
  getById: (id: string) => FoodItem | undefined;
  updateItem: (id: string, patch: Partial<FoodItem>) => void;
}

export const useFoodItems = create<FoodItemsState>((set, get) => ({
  items: FOOD_ITEMS,

  addItem: (item) =>
    set((state) => ({
      items: [item, ...state.items],
      // Later: await FoodRepo.insert(item);
    })),

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      // Later: await FoodRepo.delete(id);
    }));
    // Also remove from saved — otherwise Saved screen renders a ghost
    const { savedIds, toggle } = useSavedRecipes.getState();
    if (savedIds.includes(id)) toggle(id);
  },
  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
      // Later: await FoodRepo.update(id, patch);
    })),
  getById: (id) => get().items.find((item) => item.id === id),
}));

export const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
