// ─────────────────────────────────────────────────────────────
// hooks/use-foods.ts
// ─────────────────────────────────────────────────────────────
import { DataEvents } from "@/repositories/events";
import { FoodRepo } from "@/repositories/food-repo";
import type { FoodItem } from "@/types";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

export const useFoods = () => {
  const db = useSQLiteContext();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await FoodRepo.getAll(db);
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
    return DataEvents.subscribe(load);
  }, [load]);

  return { items, isLoading, reload: load };
};

export const useFood = (id: string | undefined) => {
  const db = useSQLiteContext();
  const [item, setItem] = useState<FoodItem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setItem(undefined);
      setIsLoading(false);
      return;
    }
    try {
      setItem(await FoodRepo.getById(db, id));
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    load();
    return DataEvents.subscribe(load);
  }, [load]);

  return { item, isLoading, reload: load };
};
