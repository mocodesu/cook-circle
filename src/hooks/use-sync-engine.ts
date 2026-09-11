// ─────────────────────────────────────────────────────────────
// hooks/use-sync-engine.ts
// ─────────────────────────────────────────────────────────────
import { SyncEngine } from "@/repositories/sync-engine";
import { SyncMeta } from "@/repositories/sync-meta";
import { useConvex, useConvexAuth } from "convex/react";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

const FOREGROUND_INTERVAL_MS = 30_000;

/**
 * Mounts once at the app root. Runs the sync loop whenever the app
 * is foregrounded and the user is signed in + has sync enabled.
 */
export const useSyncEngine = () => {
  const db = useSQLiteContext();
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  const runningRef = useRef(false);

  const runOnce = useCallback(async () => {
    if (runningRef.current) return;
    const meta = await SyncMeta.get(db);
    if (!meta?.enabled || !isAuthenticated) return;

    runningRef.current = true;
    try {
      await SyncEngine.run(db, convex);
    } catch {
      // SyncEngine.run already swallows errors internally; this is belt-and-suspenders
    } finally {
      runningRef.current = false;
    }
  }, [db, convex, isAuthenticated]);

  // Run on mount + when auth/enabled change
  useEffect(() => {
    runOnce();
  }, [runOnce]);

  // Run on every foreground transition
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runOnce();
    });
    return () => sub.remove();
  }, [runOnce]);

  // Periodic loop while active
  useEffect(() => {
    const interval = setInterval(runOnce, FOREGROUND_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runOnce]);

  return { runOnce };
};
