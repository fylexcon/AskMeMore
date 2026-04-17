import { markRollupsSynced, listPendingSyncRollups } from "./local-db";
import { syncProgress } from "./api";

export async function flushPendingProgress(accessToken: string) {
  const rollups = await listPendingSyncRollups();
  if (rollups.length === 0) {
    return;
  }

  const result = await syncProgress(accessToken, rollups);
  await markRollupsSynced(result.acceptedKeys);
}
