import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OverviewStats {
  total_children: number;
  records_due: number;
  trust_gate_flags: number;
  unknown_overdue: number;
  open_referrals: number;
  overdue_cases: number;
  confirmed_outcomes: number;
  recent_activity: Array<{
    timestamp: string | null;
    type: string;
    description: string;
    actor: string | null;
    child_id: string | null;
  }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get<OverviewStats>('/overview');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500 font-medium">Loading POSHANLOOP dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm">
        <p className="font-semibold">Unable to connect to POSHANLOOP service</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={loadOverview}
          className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Children',
      value: data.total_children,
      desc: 'Active registered beneficiaries across 8 centres',
      link: '/children',
      badgeColor: 'bg-slate-100 text-slate-800',
    },
    {
      title: 'Records Due',
      value: data.records_due,
      desc: 'Monthly growth measurements due / upcoming',
      link: '/children',
      badgeColor: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Trust Gate Flags',
      value: data.trust_gate_flags,
      desc: 'Data quality checks requiring review',
      link: '/trust-gate',
      badgeColor: 'bg-amber-50 text-amber-800',
    },
    {
      title: 'Unknown / Overdue',
      value: data.unknown_overdue,
      desc: 'No valid record in 30+ days (BlindSpot)',
      link: '/blindspot',
      badgeColor: 'bg-orange-50 text-orange-800',
    },
    {
      title: 'Open Referrals',
      value: data.open_referrals,
      desc: 'Cases with active frontline follow-up',
      link: '/referrals',
      badgeColor: 'bg-teal-50 text-teal-800',
    },
    {
      title: 'Overdue Cases',
      value: data.overdue_cases,
      desc: 'Referral actions past due date',
      link: '/supervisor',
      badgeColor: 'bg-rose-50 text-rose-800',
    },
    {
      title: 'Confirmed Outcomes',
      value: data.confirmed_outcomes,
      desc: 'Facility-verified visits & completed closures',
      link: '/referrals?status=Outcome+recorded',
      badgeColor: 'bg-emerald-50 text-emerald-800',
    },
  ];

  // Distribution chart data
  const chartData = [
    { name: 'Panchavati 1', UpToDate: 8, Overdue: 2, Concern: 1 },
    { name: 'Panchavati 2', UpToDate: 6, Overdue: 3, Concern: 0 },
    { name: 'CIDCO Sec 4', UpToDate: 7, Overdue: 1, Concern: 1 },
    { name: 'Trimbak Rural', UpToDate: 5, Overdue: 4, Concern: 1 },
    { name: 'Girnare Village', UpToDate: 6, Overdue: 3, Concern: 2 },
    { name: 'Dugaon AWC', UpToDate: 7, Overdue: 2, Concern: 0 },
    { name: 'Sinnar Town', UpToDate: 8, Overdue: 1, Concern: 1 },
    { name: 'Musalgaon', UpToDate: 5, Overdue: 4, Concern: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-navy-900">POSHANLOOP Operational Overview</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Operational continuity for maternal and early-childhood nutrition follow-up.
            Rule: A case is complete only after the next action and receiving-side outcome are recorded.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/blindspot"
            className="px-3 py-1.5 bg-navy-900 text-white rounded text-xs font-medium hover:bg-navy-800 text-center"
          >
            View Coverage
          </Link>
          <Link
            to="/offline"
            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 text-center"
          >
            Offline Queue
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.link}
            className="bg-white border border-slate-200 rounded p-3 shadow-sm hover:border-teal-500 hover:shadow transition block"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {stat.title}
            </div>
            <div className="text-2xl font-bold text-navy-900 mt-1">{stat.value}</div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{stat.desc}</p>
          </Link>
        ))}
      </div>

      {/* Centre Status Distribution Chart */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-navy-900 text-sm">Centre-level Status Distribution</h3>
            <p className="text-xs text-slate-500">
              Aggregated counts per Anganwadi centre. No personal identifiable coordinates shown.
            </p>
          </div>
          <div className="text-xs text-slate-500 mt-1 sm:mt-0">
            <span className="inline-block w-3 h-3 bg-teal-600 rounded-sm mr-1 align-middle"></span> Up to date
            <span className="inline-block w-3 h-3 bg-amber-500 rounded-sm mx-1 ml-3 align-middle"></span> Unknown/Overdue
            <span className="inline-block w-3 h-3 bg-rose-500 rounded-sm mx-1 ml-3 align-middle"></span> Confirmed Concern
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
              />
              <Bar dataKey="UpToDate" stackId="a" fill="#0d9488" name="Up to Date" />
              <Bar dataKey="Overdue" stackId="a" fill="#f59e0b" name="Unknown / Overdue" />
              <Bar dataKey="Concern" stackId="a" fill="#ef4444" name="Confirmed Concern" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <div className="bg-white border border-slate-200 rounded shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-900 text-sm">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-500">
              Append-only audit trail entries across referral actions and Trust Gate flags
            </p>
          </div>
          <Link to="/supervisor" className="text-xs text-teal-700 font-medium hover:underline">
            View All Audit Trail &rarr;
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recent_activity.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">No recent activity recorded.</div>
          ) : (
            data.recent_activity.map((act, i) => (
              <div key={i} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                      act.type === 'case_event'
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {act.type === 'case_event' ? 'Case Action' : 'Trust Gate'}
                  </span>
                  <div>
                    <span className="font-medium text-navy-900">{act.description}</span>
                    {act.child_id && (
                      <span className="ml-2 text-slate-500 font-mono">[{act.child_id}]</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500 shrink-0">
                  <span>{act.actor || 'System'}</span>
                  <span>&bull;</span>
                  <span>{act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Recent'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

