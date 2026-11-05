import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = 'No data available.',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }, [data, sortKey, sortDir]);

  if (data.length === 0) {
    return <p className="text-sm text-navy-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="bg-navy-50 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 font-semibold text-navy-800 whitespace-nowrap ${
                  col.sortable !== false ? 'cursor-pointer select-none hover:bg-navy-100' : ''
                }`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                aria-sort={
                  sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                }
              >
                {col.header}
                {sortKey === col.key && (
                  <span className="ml-1 text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={String(row[keyField])}
              className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'} ${
                onRowClick ? 'cursor-pointer hover:bg-teal-50' : ''
              }`}
              onClick={() => onRowClick?.(row)}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
