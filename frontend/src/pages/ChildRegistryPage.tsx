import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface ChildListItem {
  id: string;
  name: string;
  age_months: number;
  gender: string;
  centre_id: string;
  centre_name: string;
  guardian_name: string;
  status: string;
  last_measurement_date: string | null;
  days_since_last_measurement: number | null;
  data_freshness: 'Up to date' | 'Overdue' | 'No data';
}

interface BlockItem {
  id: string;
  name: string;
  district: string;
}

interface CentreItem {
  id: string;
  name: string;
  block_id: string;
}

export default function ChildRegistryPage() {
  const [children, setChildren] = useState<ChildListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedFreshness, setSelectedFreshness] = useState('');
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [centres, setCentres] = useState<CentreItem[]>([]);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadGeography();
  }, []);

  useEffect(() => {
    loadChildren();
  }, [search, selectedBlock, selectedCentre, page]);

  const loadGeography = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        api.get<BlockItem[]>('/blocks'),
        api.get<CentreItem[]>('/centres'),
      ]);
      setBlocks(bRes);
      setCentres(cRes);
    } catch (e) {
      console.error('Failed to load geography filters', e);
    }
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCentre) params.append('centre_id', selectedCentre);
      else if (selectedBlock) params.append('block_id', selectedBlock);
      params.append('skip', (page * limit).toString());
      params.append('limit', limit.toString());

      const res = await api.get<{ total: number; items: ChildListItem[] }>(`/children?${params.toString()}`);
      setChildren(res.items);
      setTotal(res.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load children records');
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = selectedFreshness
    ? children.filter((c) => c.data_freshness === selectedFreshness)
    : children;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Child &amp; Measurement Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthetic registered children across Anganwadi centres with real-time data freshness tracking.
          </p>
        </div>
        <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200">
          Total Registered: <span className="font-bold text-navy-900">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Search ID / Name / Guardian</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="e.g. CH-0005 or Aarav"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Filter Block</label>
          <select
            value={selectedBlock}
            onChange={(e) => {
              setSelectedBlock(e.target.value);
              setSelectedCentre('');
              setPage(0);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-teal-600 bg-white"
          >
            <option value="">All Blocks</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Filter Anganwadi Centre</label>
          <select
            value={selectedCentre}
            onChange={(e) => {
              setSelectedCentre(e.target.value);
              setPage(0);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-teal-600 bg-white"
          >
            <option value="">All Centres</option>
            {centres
              .filter((c) => !selectedBlock || c.block_id === selectedBlock)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Data Freshness</label>
          <select
            value={selectedFreshness}
            onChange={(e) => setSelectedFreshness(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-teal-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Up to date">Up to date (&le; 30 days)</option>
            <option value="Overdue">Overdue (&gt; 30 days)</option>
            <option value="No data">No valid record</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading child records...</div>
        ) : error ? (
          <div className="p-4 text-xs text-red-600 bg-red-50 border-b border-red-200">{error}</div>
        ) : filteredChildren.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No child records matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Child ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Age (Mo)</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Centre</th>
                  <th className="py-2.5 px-3">Guardian</th>
                  <th className="py-2.5 px-3">Last Checked</th>
                  <th className="py-2.5 px-3">Freshness</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChildren.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-medium text-navy-900">{c.id}</td>
                    <td className="py-2.5 px-3 font-medium text-navy-900">{c.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.age_months}m</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.gender}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.centre_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.guardian_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {c.last_measurement_date
                        ? new Date(c.last_measurement_date).toLocaleDateString()
                        : 'Never'}
                      {c.days_since_last_measurement !== null && (
                        <span className="text-[11px] text-slate-400 ml-1">
                          ({c.days_since_last_measurement}d ago)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          c.data_freshness === 'Up to date'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : c.data_freshness === 'Overdue'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {c.data_freshness}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/children/${c.id}`}
                        className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded border border-teal-200 transition font-medium"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {Math.min(page * limit + 1, total)} to {Math.min((page + 1) * limit, total)} of {total} records
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

