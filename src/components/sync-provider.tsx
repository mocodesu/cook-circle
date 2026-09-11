// ─────────────────────────────────────────────────────────────
// components/sync-provider.tsx
// ─────────────────────────────────────────────────────────────
import { useSyncEngine } from "@/hooks/use-sync-engine";
import React, { FC, PropsWithChildren } from "react";

/**
 * Mounts inside SQLiteProvider + ConvexAuthProvider.
 * No UI. Its only job is to keep the sync loop alive app-wide.
 */
const SyncProvider: FC<PropsWithChildren> = ({ children }) => {
  useSyncEngine();
  return <>{children}</>;
};

export default SyncProvider;
