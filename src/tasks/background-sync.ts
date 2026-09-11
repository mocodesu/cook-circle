// ─────────────────────────────────────────────────────────────
// tasks/background-sync.ts
// ─────────────────────────────────────────────────────────────
import { SyncEngine } from "@/repositories/sync-engine";
import { SyncMeta } from "@/repositories/sync-meta";
import { ConvexReactClient } from "convex/react";
import * as BackgroundTask from "expo-background-task";
import * as SQLite from "expo-sqlite";
import * as TaskManager from "expo-task-manager";

export const BACKGROUND_SYNC_TASK = "cook-circle-background-sync";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const db = await SQLite.openDatabaseAsync("cook-circle.db");
    const meta = await SyncMeta.get(db);
    if (!meta?.enabled || !meta?.user_id)
      return BackgroundTask.BackgroundTaskResult.Success;

    const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

    // Note: Convex Auth tokens are in SecureStore, not available here.
    // For a fully background-capable flow you'd need to also persist a
    // long-lived refresh token. For now, skip sync if no session can be
    // established — the foreground provider will pick it up.
    await SyncEngine.run(db, convex);
    await db.closeAsync();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (err) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync() {
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;

  await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15, // minutes — iOS may delay further
  });
}

export async function unregisterBackgroundSync() {
  await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}
