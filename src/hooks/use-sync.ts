// ─────────────────────────────────────────────────────────────
// hooks/use-sync.ts
// ─────────────────────────────────────────────────────────────
import { SyncMeta } from "@/repositories/sync-meta";
import { SyncQueue } from "@/repositories/sync-queue";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * Local-only sync state. Reads from SQLite, subscribes to app
 * foreground events. Does NOT import Convex, does NOT run network
 * calls — those belong to the Settings screen.
 */
export const useSync = () => {
  const db = useSQLiteContext();

  const [enabled, setEnabledState] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    // console.log(
    //   "[useSync] db:",
    //   typeof db,
    //   "SyncMeta.get:",
    //   typeof SyncMeta?.get,
    //   "SyncQueue.count:",
    //   typeof SyncQueue?.count,
    // );
    try {
      const meta = await SyncMeta.get(db);
      setEnabledState(Boolean(meta?.enabled));
      setLastSyncAt(meta?.last_pull_at ?? null);
      setPending(await SyncQueue.count(db));
    } catch (err) {
      console.warn("[useSync] refresh failed:", err);
    } finally {
      setHydrated(true);
    }
  }, [db]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      setEnabledState(next);
      try {
        await SyncMeta.setEnabled(db, next);
      } catch (err) {
        console.warn("[useSync] setEnabled failed:", err);
        setEnabledState(!next);
      }
    },
    [db],
  );

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return {
    enabled,
    setEnabled,
    pending,
    lastSyncAt,
    lastError,
    hydrated,
    refresh,
  };
};
