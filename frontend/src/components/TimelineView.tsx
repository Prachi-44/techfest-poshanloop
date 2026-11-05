import React from 'react';
import type { CaseEvent } from '../types';

interface Props {
  events: CaseEvent[];
}

export default function TimelineView({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-navy-500 py-2">No events recorded yet.</p>;
  }

  return (
    <div className="relative pl-6" role="list" aria-label="Case timeline">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-300" aria-hidden="true" />

      {events.map((evt, i) => (
        <div key={evt.id} className="relative mb-4 last:mb-0" role="listitem">
          {/* Dot */}
          <div
            className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-teal-500 bg-white"
            aria-hidden="true"
          />

          <div className="bg-white border border-gray-100 rounded px-3 py-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm text-navy-900">{evt.actor}</span>
              <span className="text-xs text-navy-400">({evt.actor_role.replace('_', '/')})</span>
              <span className="text-xs text-navy-400 ml-auto">
                {new Date(evt.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm font-medium text-teal-700 mt-0.5">{evt.action}</p>
            {evt.note && <p className="text-sm text-navy-600 mt-0.5">{evt.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
