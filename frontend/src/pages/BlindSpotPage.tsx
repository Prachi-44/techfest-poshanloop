import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CentreCoverage {
  centre_id: string;
  centre_name: string;
  block_id: string;
  block_name: string;
  district: string;
  total_children: number;
  up_to_date: number;
  unknown_overdue: number;
  confirmed_concern: number;
  days_since_oldest_overdue: number;
  coverage_pct: number;
}

interface CoveragePayload {
  summary: {
    total_children: number;
    up_to_date: number;
    unknown_overdue: number;
    confirmed_concern: number;
    coverage_rate_pct: number;
  };
  legend: {
    up_to_date: string;
    unknown_overdue: string;
    confirmed_concern: string;
  };
  centres: CentreCoverage[];
}

export default function BlindSpotPage() {
  const [data, setData] = useState<CoveragePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [blockFilter, setBlockFilter] = useState('');
  const [ageBandFilter, setAgeBandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCoverage();
  }, [blockFilter, ageBandFilter, statusFilter]);

  const loadCoverage = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (blockFilter) params.append('block_id', blockFilter);
      if (ageBandFilter) params.append('age_band', ageBandFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get<CoveragePayload>(`/blindspot/coverage?${params.toString()}`);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load BlindSpot coverage visibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Informational Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-navy-900">
            BlindSpot &mdash; Unknown-versus-Risk Coverage View
          </h2>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            Privacy: Aggregate centre counts only. No personal coordinates.
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Key Rule:</strong> Missing data is <em>never</em> assumed to be healthy. When children have no recent measurement on file,
          they are tracked as <strong>Unknown / Overdue</strong> rather than assumed normal. This separates what we know from what we don't.
        </p>
      </div>

      {/* Legend Card */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-start gap-2.5 p-2 bg-white rounded border border-slate-200">
          <div className="w-3.5 h-3.5 rounded-full bg-teal-600 shrink-0 mt-0.5"></div>
          <div>
            <strong className="text-teal-900 block font-semibold">Up to Date</strong>
            <span className="text-slate-600 text-[11px]">Valid growth measurement recorded within the last 30 days; no active flags.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 bg-white rounded border border-amber-200">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 mt-0.5"></div>
          <div>
            <strong className="text-amber-900 block font-semibold">Unknown / Overdue</strong>
            <span className="text-slate-600 text-[11px]">No measurement in 30+ days. Requires frontline worker home visit or check.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 bg-white rounded border border-rose-200">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-600 shrink-0 mt-0.5"></div>
          <div>
            <strong className="text-rose-900 block font-semibold">Confirmed Concern</strong>
            <span className="text-slate-600 text-[11px]">Explicitly flagged by authorized clinical referral or critical trust alert.</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Administrative Block</label>
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Blocks</option>
            <option value="BLK-01">Nashik Urban</option>
            <option value="BLK-02">Nashik Rural</option>
            <option value="BLK-03">Sinnar</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Age Band</label>
          <select
            value={ageBandFilter}
            onChange={(e) => setAgeBandFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Ages (0-60m)</option>
            <option value="0-6m">0 - 6 Months (Infancy)</option>
            <option value="6-12m">6 - 12 Months (Complementary Feeding)</option>
            <option value="12-24m">12 - 24 Months (Toddler)</option>
            <option value="24-60m">24 - 60 Months (Early Childhood)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Statuses</option>
            <option value="Up to date">Up to Date Only</option>
            <option value="Unknown / overdue">Unknown / Overdue Only</option>
            <option value="Confirmed concern">Confirmed Concern Only</option>
          </select>
        </div>
      </div>

      {/* Aggregate Centre Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded border border-slate-200">
          Calculating coverage distribution...
        </div>
      ) : error || !data ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded border border-red-200">{error}</div>
      ) : (
        <div className="space-y-4">
          {/* Visual Centre Coverage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {data.centres.map((c) => (
              <div
                key={c.centre_id}
                className={`bg-white border rounded p-3.5 shadow-sm space-y-2.5 ${
                  c.confirmed_concern > 0
                    ? 'border-l-4 border-l-rose-500'
                    : c.unknown_overdue > 2
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-teal-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-navy-900 text-xs leading-tight">{c.centre_name}</h4>
                    <span className="text-[10px] text-slate-500">{c.block_name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    {c.coverage_pct}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-100 text-[11px]">
                  <div className="bg-teal-50 text-teal-900 p-1.5 rounded">
                    <div className="font-bold">{c.up_to_date}</div>
                    <div className="text-[9px] text-teal-700 uppercase">Up to date</div>
                  </div>
                  <div className="bg-amber-50 text-amber-900 p-1.5 rounded">
                    <div className="font-bold">{c.unknown_overdue}</div>
                    <div className="text-[9px] text-amber-700 uppercase">Unknown</div>
                  </div>
                  <div className="bg-rose-50 text-rose-900 p-1.5 rounded">
                    <div className="font-bold">{c.confirmed_concern}</div>
                    <div className="text-[9px] text-rose-700 uppercase">Concern</div>
                  </div>
                </div>

                {c.days_since_oldest_overdue > 0 && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/60 px-2 py-0.5 rounded flex justify-between">
                    <span>Oldest overdue record:</span>
                    <span className="font-bold">{c.days_since_oldest_overdue} days</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Centre Table */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center text-xs">
              <h3 className="font-semibold text-navy-900">Centre Coverage Aggregate Ledger</h3>
              <span className="text-slate-500">Summary: {data.summary.total_children} active children tracked</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Centre Name</th>
                    <th className="py-2.5 px-3">Block / District</th>
                    <th className="py-2.5 px-3 text-center">Total Children</th>
                    <th className="py-2.5 px-3 text-center">Up to Date</th>
                    <th className="py-2.5 px-3 text-center">Unknown / Overdue</th>
                    <th className="py-2.5 px-3 text-center">Confirmed Concern</th>
                    <th className="py-2.5 px-3 text-center">Oldest Overdue</th>
                    <th className="py-2.5 px-3 text-right">Coverage Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.centres.map((c) => (
                    <tr key={c.centre_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-navy-900">{c.centre_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {c.block_name}, {c.district}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-navy-900">{c.total_children}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-teal-800 bg-teal-50/50">
                        {c.up_to_date}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-amber-900 bg-amber-50/50">
                        {c.unknown_overdue}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-rose-900 bg-rose-50/50">
                        {c.confirmed_concern}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {c.days_since_oldest_overdue > 0 ? `${c.days_since_oldest_overdue}d` : '&mdash;'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-navy-900">{c.coverage_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

