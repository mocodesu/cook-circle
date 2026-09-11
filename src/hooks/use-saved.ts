// ─────────────────────────────────────────────────────────────
// hooks/use-saved.ts
// ─────────────────────────────────────────────────────────────
import { DataEvents } from "@/repositories/events";
import { SavedRepo } from "@/repositories/saved-repo";
import type { FoodItem } from "@/types";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export const useSavedItems = () => {
  const db = useSQLiteContext();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await SavedRepo.getSavedItems(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
      return DataEvents.subscribe(load);
    }, [load]),
  );

  return { items, isLoading, reload: load };
};

export const useIsSaved = (recipeId: string) => {
  const db = useSQLiteContext();
  const [isSaved, setIsSaved] = useState(false);

  const load = useCallback(async () => {
    setIsSaved(await SavedRepo.isSaved(db, recipeId));
  }, [db, recipeId]);

  useFocusEffect(
    useCallback(() => {
      load();
      return DataEvents.subscribe(load);
    }, [load]),
  );

  return isSaved;
};
