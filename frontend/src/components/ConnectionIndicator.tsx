import React from 'react';
import { useOnlineStatus } from '../contexts/OnlineContext';

export default function ConnectionIndicator() {
  const { isOnline, toggleOnline, isDemoOffline } = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
        aria-hidden="true"
      />
      <span className="text-sm text-navy-700">{isOnline ? 'Online' : 'Offline'}</span>
      <button
        onClick={toggleOnline}
        className="ml-1 text-xs px-2 py-0.5 rounded border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
        aria-label={isDemoOffline ? 'Go Online' : 'Simulate Offline'}
      >
        {isDemoOffline ? 'Go Online' : 'Simulate Offline'}
      </button>
    </div>
  );
}
