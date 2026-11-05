import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SyncEvent, SyncStatus } from '../types';

interface OfflineDB extends DBSchema {
  'offline-events': {
    key: string;
    value: SyncEvent;
    indexes: { 'by-status': SyncStatus };
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('poshanloop-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('offline-events', { keyPath: 'id' });
        store.createIndex('by-status', 'syncStatus');
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineEvent(
  eventType: string,
  eventData: Record<string, unknown>
): Promise<SyncEvent> {
  const db = await getDB();
  const event: SyncEvent = {
    id: generateId(),
    eventType,
    eventData,
    deviceCreatedAt: new Date().toISOString(),
    syncStatus: 'pending',
    syncedAt: null,
    conflictData: null,
  };
  await db.put('offline-events', event);
  return event;
}

export async function getAllEvents(): Promise<SyncEvent[]> {
  const db = await getDB();
  return db.getAll('offline-events');
}

export async function getPendingEvents(): Promise<SyncEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex('offline-events', 'by-status', 'pending');
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  const event = await db.get('offline-events', id);
  if (event) {
    event.syncStatus = 'synced';
    event.syncedAt = new Date().toISOString();
    await db.put('offline-events', event);
  }
}

export async function markConflict(
  id: string,
  conflictData: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const event = await db.get('offline-events', id);
  if (event) {
    event.syncStatus = 'conflict';
    event.conflictData = conflictData;
    await db.put('offline-events', event);
  }
}

export async function getConflicts(): Promise<SyncEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex('offline-events', 'by-status', 'conflict');
}

export async function resolveConflict(
  id: string,
  resolution: 'accept_server' | 'accept_local' | 'manual_merge',
  mergedData?: Record<string, unknown>
): Promise<void> {
  const db = await getDB();
  const event = await db.get('offline-events', id);
  if (event) {
    event.syncStatus = 'synced';
    event.syncedAt = new Date().toISOString();
    event.conflictData = null;
    if (resolution === 'manual_merge' && mergedData) {
      event.eventData = mergedData;
    }
    await db.put('offline-events', event);
  }
}
