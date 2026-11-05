import React from 'react';

type Variant = 'green' | 'amber' | 'orange' | 'red' | 'blue' | 'gray' | 'teal';

const variantClasses: Record<Variant, string> = {
  green: 'bg-green-50 text-green-800 border-green-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  orange: 'bg-orange-50 text-orange-800 border-orange-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
};

interface Props {
  label: string;
  variant?: Variant;
}

const STATUS_VARIANT_MAP: Record<string, Variant> = {
  Clear: 'green',
  Verified: 'green',
  'Up to date': 'green',
  synced: 'green',
  'Needs review': 'amber',
  pending: 'amber',
  'Re-measurement requested': 'orange',
  Corrected: 'blue',
  Overdue: 'red',
  'No data': 'gray',
  conflict: 'red',
  error: 'red',
  created: 'blue',
  acknowledged: 'teal',
  in_progress: 'teal',
  attended: 'green',
  rescheduled: 'amber',
  not_reached: 'orange',
  wrong_facility: 'red',
  outcome_recorded: 'green',
  closed: 'gray',
  routine: 'blue',
  urgent: 'orange',
  emergency: 'red',
  low: 'blue',
  medium: 'amber',
  high: 'red',
};

export default function StatusBadge({ label, variant }: Props) {
  const v = variant || STATUS_VARIANT_MAP[label] || 'gray';
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${variantClasses[v]}`}
    >
      {label}
    </span>
  );
}
