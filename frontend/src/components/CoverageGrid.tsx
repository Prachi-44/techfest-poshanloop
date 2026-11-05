import React from 'react';
import type { CoverageCenter } from '../types';

interface Props {
  centres: CoverageCenter[];
  onCentreClick?: (centre: CoverageCenter) => void;
}

const statusColor: Record<string, string> = {
  green: 'bg-green-100 border-green-400 text-green-900',
  amber: 'bg-amber-100 border-amber-400 text-amber-900',
  red: 'bg-red-100 border-red-400 text-red-900',
};

export default function CoverageGrid({ centres, onCentreClick }: Props) {
  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-400 inline-block" aria-hidden="true" />
          <span>Up to date — Recent measurement recorded, no current flag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400 inline-block" aria-hidden="true" />
          <span>Unknown/overdue — No valid recent measurement on file</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-400 inline-block" aria-hidden="true" />
          <span>Confirmed concern — Only records explicitly flagged by authorised input</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {centres.map((c) => (
          <button
            key={c.centre_id}
            className={`border rounded px-3 py-2 text-left transition-shadow hover:shadow-md ${
              statusColor[c.status] || statusColor.amber
            } ${onCentreClick ? 'cursor-pointer' : ''}`}
            onClick={() => onCentreClick?.(c)}
            aria-label={`${c.centre_name}: ${c.status}`}
          >
            <p className="font-semibold text-sm truncate">{c.centre_name}</p>
            <p className="text-xs mt-0.5">{c.total_children} children</p>
            <p className="text-xs">
              {c.up_to_date}✓ / {c.overdue}? / {c.confirmed_concern}✗
            </p>
          </button>
        ))}
      </div>

      {centres.length === 0 && (
        <p className="text-sm text-navy-500 py-4">No coverage data available.</p>
      )}
    </div>
  );
}
