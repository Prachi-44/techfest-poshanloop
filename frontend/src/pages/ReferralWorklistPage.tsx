import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';

interface ReferralListItem {
  id: string;
  child_id: string;
  child_name: string;
  care_receipt_ref: string;
  status: string;
  destination_facility: string | null;
  visit_instruction: string | null;
  date_issued: string | null;
  expiry_date: string | null;
  barriers: string[];
  barrier_notes: string | null;
  assigned_to_role: string | null;
  assigned_to_name: string | null;
  priority: string;
  next_action: string | null;
  due_date: string | null;
  facility_status: string | null;
  created_at: string | null;
}

export default function ReferralWorklistPage() {
  const { currentUser, currentRole } = useRole();
  const [referrals, setReferrals] = useState<ReferralListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createChildId, setCreateChildId] = useState('CH-0001');
  const [createFacility, setCreateFacility] = useState('Primary Health Centre (PHC)');
  const [createPriority, setCreatePriority] = useState('routine');
  const [createBarriers, setCreateBarriers] = useState<string[]>([]);
  const [createBarrierNotes, setCreateBarrierNotes] = useState('');
  const [createNextAction, setCreateNextAction] = useState('Contact family and verify visit readiness');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, [statusFilter, priorityFilter, roleFilter, search]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (roleFilter) params.append('assigned_to_role', roleFilter);
      if (search) params.append('search', search);

      const res = await api.get<{ total: number; items: ReferralListItem[] }>(`/referrals?${params.toString()}`);
      setReferrals(res.items);
      setTotal(res.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load referral worklist');
    } finally {
      setLoading(false);
    }
  };

  const toggleBarrier = (code: string) => {
    if (createBarriers.includes(code)) {
      setCreateBarriers(createBarriers.filter((b) => b !== code));
    } else {
      setCreateBarriers([...createBarriers, code]);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/referrals', {
        child_id: createChildId,
        destination_facility: createFacility,
        priority: createPriority,
        barriers: createBarriers,
        barrier_notes: createBarrierNotes,
        next_action: createNextAction,
        actor_role: currentRole,
        actor_name: currentUser.name,
      });

      setShowCreateModal(false);
      setCreateBarrierNotes('');
      setCreateBarriers([]);
      await loadReferrals();
    } catch (err: any) {
      alert('Failed to create referral: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Referral Worklist &mdash; Action-to-Closure Ledger</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Every referral tracks family barriers, an assigned next owner, a non-sensitive Care Receipt token, and receiving-side facility outcome.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 shadow-sm shrink-0"
        >
          + Open New Referral
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Search Care Receipt / Child ID</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. PL-7K4M2 or CH-0030"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Case Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="Family contacted">Family contacted</option>
            <option value="Barrier support arranged">Barrier support arranged</option>
            <option value="Referred">Referred</option>
            <option value="Facility acknowledged">Facility acknowledged</option>
            <option value="Outcome recorded">Outcome recorded</option>
            <option value="Closed">Closed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Not reached">Not reached</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Assigned Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Roles</option>
            <option value="AWW">Anganwadi Worker (AWW)</option>
            <option value="ASHA_ANM">ASHA / ANM</option>
            <option value="Facility">Facility Staff</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      {/* Referral Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading active cases...</div>
        ) : error ? (
          <div className="p-4 text-xs text-red-600 bg-red-50">{error}</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No referrals found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Care Receipt Token</th>
                  <th className="py-2.5 px-3">Child</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Assigned Owner</th>
                  <th className="py-2.5 px-3">Barriers Captured</th>
                  <th className="py-2.5 px-3">Next Action Due</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                      <span className="bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {r.care_receipt_ref}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-navy-900">{r.child_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{r.child_id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          r.status === 'Outcome recorded' || r.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : r.status === 'Facility acknowledged' || r.status === 'Referred'
                            ? 'bg-blue-50 text-blue-800 border border-blue-300'
                            : r.status === 'Rescheduled' || r.status === 'Not reached'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300'
                            : 'bg-amber-50 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.priority === 'high' || r.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium text-navy-900">{r.assigned_to_name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-500">{r.assigned_to_role}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                      {r.barriers && r.barriers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.barriers.map((b) => (
                            <span
                              key={b}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]"
                            >
                              {b.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None recorded</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="text-[11px] font-medium text-navy-900">{r.next_action || 'Pending action'}</div>
                      <div className="text-[10px] text-slate-500">
                        {r.due_date ? `Due: ${new Date(r.due_date).toLocaleDateString()}` : 'No date'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/referrals/${r.id}`}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-800 font-medium hover:bg-slate-50 shadow-sm"
                      >
                        Ledger &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Referral Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">Open New Referral &amp; Care Receipt</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Subject Child ID</label>
                <input
                  type="text"
                  required
                  value={createChildId}
                  onChange={(e) => setCreateChildId(e.target.value)}
                  placeholder="e.g. CH-0001"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Destination Facility</label>
                <input
                  type="text"
                  required
                  value={createFacility}
                  onChange={(e) => setCreateFacility(e.target.value)}
                  placeholder="e.g. Nashik District Hospital NRC"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Workflow Ordering Priority</label>
                <select
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Priority orders queue sequence only &mdash; never denies a service.
                </span>
              </div>

              {/* Family Barrier Checklist */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Family Barrier Checklist (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {[
                    { code: 'travel_distance', label: 'Travel Distance' },
                    { code: 'transport_cost', label: 'Transport Cost' },
                    { code: 'no_accompanying_adult', label: 'No Accompanying Adult' },
                    { code: 'childcare_responsibility', label: 'Childcare Responsibility' },
                    { code: 'migration_moved', label: 'Seasonal Migration / Moved' },
                    { code: 'facility_timing', label: 'Facility Timing Conflict' },
                    { code: 'unclear_instructions', label: 'Unclear Instructions' },
                    { code: 'not_yet_known', label: 'Not Yet Known' },
                  ].map((item) => (
                    <label key={item.code} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                      <input
                        type="checkbox"
                        checked={createBarriers.includes(item.code)}
                        onChange={() => toggleBarrier(item.code)}
                        className="rounded text-teal-600"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Barrier Notes (Non-sensitive)</label>
                <textarea
                  rows={2}
                  value={createBarrierNotes}
                  onChange={(e) => setCreateBarrierNotes(e.target.value)}
                  placeholder="Record practical context (e.g. lives 14km away, mother works morning shift)..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Initial Next Action</label>
                <input
                  type="text"
                  value={createNextAction}
                  onChange={(e) => setCreateNextAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3.5 py-1.5 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {creating ? 'Generating Token...' : 'Open Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

