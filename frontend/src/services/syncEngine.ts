import { db } from '../db/db';
import { API_BASE_URL } from '../config/api';

const API_SERVER = `${API_BASE_URL}/api`;

export class SyncEngine {
  private static isSyncing = false;

  static async triggerSync(onStatusChange?: (syncing: boolean, count: number) => void) {
    // If already syncing or device is offline, do nothing
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const pendingItems = await db.syncQueue.toArray();
      if (onStatusChange) onStatusChange(true, pendingItems.length);

      for (const item of pendingItems) {
        try {
          const res = await fetch(`${API_SERVER}/sync-record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });

          if (res.ok) {
            const data = await res.json();
            // If the server merged conflicting edits, update local DB with merged record
            if (data.record) {
              await db.patients.put({
                ...data.record,
                synced: true
              });
            } else {
              await db.patients.update(item.recordId, { synced: true });
            }
            // Remove sent item from the Outbox queue
            if (item.id) await db.syncQueue.delete(item.id);
          } else {
            // Failed, increment retry count
            if (item.id) {
              await db.syncQueue.update(item.id, { retries: item.retries + 1 });
            }
          }
        } catch (err) {
          console.warn(`Sync paused for record ${item.recordId}. Network intermittent.`);
          break; // Stop loop if connection dropped mid-way
        }
      }
    } finally {
      this.isSyncing = false;
      const remaining = await db.syncQueue.count();
      if (onStatusChange) onStatusChange(false, remaining);
    }
  }

  static async getPendingCount(): Promise<number> {
    return await db.syncQueue.count();
  }
}