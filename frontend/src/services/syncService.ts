import { api } from './api';
import { getPendingEvents, markSynced, markConflict } from './offlineDb';
import type { SyncEvent } from '../types';

interface SyncResponse {
  results: Array<{
    id: string;
    status: 'synced' | 'conflict' | 'error';
    message?: string;
  }>;
}

export async function syncPendingEvents(): Promise<{
  synced: number;
  conflicts: number;
  errors: number;
}> {
  const pending = await getPendingEvents();
  if (pending.length === 0) {
    return { synced: 0, conflicts: 0, errors: 0 };
  }

  const payload = pending.map((e: SyncEvent) => ({
    id: e.id,
    event_type: e.eventType,
    event_data: e.eventData,
    device_created_at: e.deviceCreatedAt,
  }));

  try {
    const result = await api.post<SyncResponse>('/sync/events', { events: payload });

    let syncedCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    for (const item of result.results || []) {
      if (item.status === 'synced') {
        await markSynced(item.id);
        syncedCount++;
      } else if (item.status === 'conflict') {
        await markConflict(item.id, { conflict: true, message: item.message });
        conflictCount++;
      } else {
        errorCount++;
      }
    }

    return {
      synced: syncedCount,
      conflicts: conflictCount,
      errors: errorCount,
    };
  } catch (err) {
    console.error('Sync failed:', err);
    throw err;
  }
}
