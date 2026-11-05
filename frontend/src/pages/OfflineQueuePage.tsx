import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useOnlineStatus } from '../contexts/OnlineContext';
import { useRole } from '../contexts/RoleContext';
import {
  saveOfflineEvent,
  getAllEvents,
  markSynced,
  resolveConflict,
} from '../services/offlineDb';
import { syncPendingEvents } from '../services/syncService';
import type { SyncEvent } from '../types';

interface ServerSyncEvent {
  id: string;
  event_type: string;
  event_data: any;
  device_created_at: string | null;
  server_received_at: string | null;
  sync_status: string;
  conflict_data: any;
  resolved_by: string | null;
  resolved_at: string | null;
}

export default function OfflineQueuePage() {
  const { isOnline, toggleOnline, isDemoOffline } = useOnlineStatus();
  const { currentUser } = useRole();
  const [localEvents, setLocalEvents] = useState<SyncEvent[]>([]);
  const [serverEvents, setServerEvents] = useState<ServerSyncEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Quick offline test event creator
  const [testNote, setTestNote] = useState('Home visit completed: mother provided dietary card.');

  useEffect(() => {
    loadLocalEvents();
    if (isOnline) loadServerEvents();
  }, [isOnline]);

  const loadLocalEvents = async () => {
    try {
      const items = await getAllEvents();
      setLocalEvents(items.reverse());
    } catch (e) {
      console.error('Failed to load IndexedDB events', e);
    }
  };

  const loadServerEvents = async () => {
    try {
      const res = await api.get<ServerSyncEvent[]>('/sync/events');
      setServerEvents(res);
    } catch (e) {
      console.error('Failed to load server sync events', e);
    }
  };

  const handleCreateOfflineEvent = async () => {
    if (!testNote.trim()) return;
    try {
      await saveOfflineEvent('case_action', {
        referral_id: 'PL-7K4M2',
        child_id: 'CH-0030',
        action: 'Offline Field Check',
        actor_role: currentUser.role,
        actor_name: currentUser.name,
        note: testNote,
      });
      setTestNote('');
      await loadLocalEvents();
    } catch (e: any) {
      alert('Failed to save to local IndexedDB: ' + e.message);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert('Cannot synchronise while offline. Please toggle Online mode first.');
      return;
    }

    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await syncPendingEvents();
      setSyncResult(`Sync completed: ${res.synced} events uploaded, ${res.conflicts} conflicts detected.`);
      await loadLocalEvents();
      await loadServerEvents();
    } catch (err: any) {
      setSyncResult('Sync error: ' + (err.message || 'Network error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (eventId: string, choice: 'keep_server' | 'keep_device') => {
    try {
      await api.post(`/sync/events/${eventId}/resolve`, {
        resolved_by: currentUser.name,
        resolution: choice,
      });
      await loadServerEvents();
      alert(`Conflict resolved by keeping ${choice === 'keep_server' ? 'Server Version' : 'Device Version'}.`);
    } catch (err: any) {
      alert('Conflict resolution failed: ' + err.message);
    }
  };

  const conflicts = serverEvents.filter((ev) => ev.sync_status === 'conflict');

  return (
    <div className="space-y-5">
      {/* Informational Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Poshan Passport &mdash; Offline Event Journal</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Reliable last-mile event journaling using browser IndexedDB storage and client-generated UUID idempotency.
          </p>
        </div>

        {/* Demo Online/Offline Toggle */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
          <span
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          ></span>
          <span className="text-xs font-bold text-navy-900">{isOnline ? 'ONLINE' : 'OFFLINE (Simulated)'}</span>
          <button
            onClick={toggleOnline}
            className={`px-3 py-1 rounded text-xs font-semibold shadow-sm transition ${
              isDemoOffline
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {isDemoOffline ? 'Go Online' : 'Simulate Offline Mode'}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded text-xs font-medium flex justify-between">
          <span>{syncResult}</span>
          <button onClick={() => setSyncResult(null)} className="font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Offline Action Simulation Card */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-xs space-y-3">
        <h3 className="font-bold text-navy-900 text-sm">Simulate Offline Field Action</h3>
        <p className="text-slate-500">
          Even without internet connectivity, frontline workers can record home visits and barrier notes.
          Entries are assigned a unique UUID in local IndexedDB.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testNote}
            onChange={(e) => setTestNote(e.target.value)}
            placeholder="Type a field visit note..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-teal-600"
          />
          <button
            onClick={handleCreateOfflineEvent}
            className="px-3.5 py-1.5 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 shrink-0"
          >
            Save to Local Journal (IndexedDB)
          </button>
          <button
            onClick={handleSyncNow}
            disabled={!isOnline || syncing}
            className="px-4 py-1.5 bg-teal-600 text-white rounded font-bold hover:bg-teal-700 disabled:opacity-40 shrink-0 shadow-sm"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Sync Conflict Resolution Section */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded p-4 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <h3 className="font-bold text-rose-950 text-sm">
              Sync Conflicts Requiring Human Review ({conflicts.length})
            </h3>
          </div>
          <p className="text-slate-600">
            <strong>Key Rule:</strong> When server records and local records diverge, POSHANLOOP never silently overwrites.
            Both versions are presented side by side for authorized worker resolution.
          </p>

          <div className="space-y-3">
            {conflicts.map((conf) => (
              <div key={conf.id} className="bg-white border border-rose-200 rounded p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 border-b pb-1.5">
                  <span className="font-mono">Event UUID: {conf.id}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold uppercase text-[10px]">
                    Conflict
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <strong className="text-navy-900 block text-[11px] uppercase tracking-wider mb-1">
                      Server Stored Version
                    </strong>
                    <pre className="text-[10px] text-slate-700 overflow-x-auto">
                      {JSON.stringify(conf.event_data, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-amber-50/70 p-2.5 rounded border border-amber-200">
                    <strong className="text-amber-950 block text-[11px] uppercase tracking-wider mb-1">
                      Incoming Device Version
                    </strong>
                    <pre className="text-[10px] text-amber-900 overflow-x-auto">
                      {JSON.stringify(conf.conflict_data, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleResolveConflict(conf.id, 'keep_server')}
                    className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 rounded font-medium hover:bg-slate-200 text-xs"
                  >
                    Keep Server Version
                  </button>
                  <button
                    onClick={() => handleResolveConflict(conf.id, 'keep_device')}
                    className="px-3 py-1 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 text-xs shadow-sm"
                  >
                    Keep Device Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local IndexedDB Events Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden text-xs">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-navy-900">Local Device Journal (IndexedDB)</h3>
          <span className="text-slate-500">{localEvents.length} local event(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Local Idempotency UUID</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Device Created Time</th>
                <th className="py-2.5 px-3">Payload Details</th>
                <th className="py-2.5 px-3">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No offline events pending in local device storage.
                  </td>
                </tr>
              ) : (
                localEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{ev.id}</td>
                    <td className="py-2.5 px-3 font-medium text-navy-900">{ev.eventType}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(ev.deviceCreatedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(ev.eventData)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.syncStatus === 'synced'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : ev.syncStatus === 'conflict'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ev.syncStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server Synchronised Events Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden text-xs">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-navy-900">Server Event Journal (Synchronized)</h3>
          <span className="text-slate-500">{serverEvents.length} synchronized event(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Event UUID</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Device Time Preserved</th>
                <th className="py-2.5 px-3">Server Received Time</th>
                <th className="py-2.5 px-3">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serverEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No synchronized server events found.
                  </td>
                </tr>
              ) : (
                serverEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{ev.id}</td>
                    <td className="py-2.5 px-3 font-medium text-navy-900">{ev.event_type}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ev.device_created_at ? new Date(ev.device_created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {ev.server_received_at ? new Date(ev.server_received_at).toLocaleTimeString() : 'Pending'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.sync_status === 'synced'
                            ? 'bg-teal-50 text-teal-800'
                            : ev.sync_status === 'conflict'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.sync_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

