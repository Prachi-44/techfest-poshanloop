import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';

interface OverdueCase {
  id: string;
  child_id: string;
  child_name: string;
  care_receipt_ref: string;
  status: string;
  priority: string;
  assigned_to_role: string;
  assigned_to_name: string;
  next_action: string;
  due_date: string | null;
}

interface AuditEvent {
  id: string;
  referral_id: string;
  care_receipt_ref: string | null;
  child_id: string | null;
  actor_role: string;
  actor_name: string;
  action: string;
  note: string | null;
  timestamp: string | null;
}

export default function SupervisorViewPage() {
  const { currentUser, currentRole } = useRole();
  const [referrals, setReferrals] = useState<OverdueCase[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supervisor closure modal state
  const [selectedCase, setSelectedCase] = useState<OverdueCase | null>(null);
  const [supervisorReason, setSupervisorReason] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    loadSupervisorData();
  }, []);

  const loadSupervisorData = async () => {
    try {
      setLoading(true);
      const [refRes, auditRes] = await Promise.all([
        api.get<{ total: number; items: OverdueCase[] }>('/referrals?limit=100'),
        api.get<{ total: number; items: AuditEvent[] }>('/audit?limit=25'),
      ]);

      setReferrals(refRes.items);
      setAuditEvents(auditRes.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load supervisor records');
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisorClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !supervisorReason.trim()) return;

    try {
      setClosing(true);
      await api.post(`/referrals/${selectedCase.id}/actions`, {
        action: 'Supervisor Administrative Closure',
        actor_role: 'Supervisor',
        actor_name: currentUser.name,
        new_status: 'Closed',
        closure_reason: supervisorReason,
        note: `Closed by Supervisor: ${supervisorReason}`,
      });

      setSelectedCase(null);
      setSupervisorReason('');
      await loadSupervisorData();
    } catch (err: any) {
      alert('Supervisor closure failed: ' + err.message);
    } finally {
      setClosing(false);
    }
  };

  // Group cases
  const overdueCases = referrals.filter(
    (r) => r.status !== 'Closed' && r.status !== 'Cancelled' && r.due_date && new Date(r.due_date) < new Date()
  );

  const escalationQueue = referrals.filter(
    (r) => r.status === 'Escalated' || r.status === 'Not reached' || r.status === 'Rescheduled'
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Supervisor Command &mdash; Escalation &amp; Quality Audit</h2>
          <p className="text-slate-600 mt-0.5">
            Area-level supervision of pending follow-ups, overdue referrals, and append-only audit trail verification.
          </p>
        </div>
        <div className="px-3 py-1 bg-navy-900 text-white rounded font-medium text-xs">
          Role: Supervisor (CDPO / Block Lead)
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      {/* Overdue Referrals & Escalations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Escalation Queue */}
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
            <div>
              <h3 className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                Escalation &amp; Review Queue ({escalationQueue.length})
              </h3>
              <p className="text-[11px] text-slate-500">Cases flagged Not Reached, Rescheduled, or Escalated</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {escalationQueue.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No escalated cases in queue.</div>
            ) : (
              escalationQueue.map((item) => (
                <div key={item.id} className="p-3 hover:bg-slate-50 flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] border border-teal-200">
                        {item.care_receipt_ref}
                      </span>
                      <span className="font-bold text-navy-900">{item.child_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Assigned: {item.assigned_to_name} ({item.assigned_to_role}) &bull; Step: {item.next_action}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCase(item);
                        setSupervisorReason(
                          'Verified through village visit / alternative support. Authorized administrative closure.'
                        );
                      }}
                      className="px-2 py-1 bg-navy-900 text-white rounded text-[11px] font-medium hover:bg-navy-800 shadow-sm"
                    >
                      Authorize Close
                    </button>
                    <Link
                      to={`/referrals/${item.id}`}
                      className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-medium hover:bg-slate-50"
                    >
                      Ledger &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Cases */}
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
            <div>
              <h3 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Overdue Follow-up Actions ({overdueCases.length})
              </h3>
              <p className="text-[11px] text-slate-500">Referrals with target due date in the past</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {overdueCases.length === 0 ? (
              <div className="p-4 text-center text-slate-400">All referral follow-ups are within due dates.</div>
            ) : (
              overdueCases.map((item) => (
                <div key={item.id} className="p-3 hover:bg-slate-50 flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] border border-teal-200">
                        {item.care_receipt_ref}
                      </span>
                      <span className="font-bold text-navy-900">{item.child_name}</span>
                      <span className="text-amber-800 font-semibold text-[10px]">
                        Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Owner: {item.assigned_to_name} &bull; Next: {item.next_action}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCase(item);
                        setSupervisorReason('Supervisor review completed with frontline worker.');
                      }}
                      className="px-2 py-1 bg-teal-600 text-white rounded text-[11px] font-medium hover:bg-teal-700"
                    >
                      Close Case
                    </button>
                    <Link
                      to={`/referrals/${item.id}`}
                      className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-medium hover:bg-slate-50"
                    >
                      Ledger &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System-wide Audit Ledger */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">System Audit Ledger &mdash; Append-Only Trail</h3>
            <p className="text-slate-500">Every recorded action across all frontline roles is permanently logged.</p>
          </div>
          <span className="text-slate-500 text-[11px]">Last 25 system events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Token &amp; Child</th>
                <th className="py-2.5 px-3">Actor &amp; Role</th>
                <th className="py-2.5 px-3">Action Recorded</th>
                <th className="py-2.5 px-3">Notes / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-teal-800 font-bold">
                    {ev.care_receipt_ref || 'N/A'}
                    {ev.child_id && <span className="text-slate-400 font-normal ml-1">({ev.child_id})</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-navy-900">{ev.actor_name}</span>{' '}
                    <span className="text-[10px] text-slate-500">({ev.actor_role})</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-navy-900">{ev.action}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">{ev.note || '&mdash;'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisor Closure Justification Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">Supervisor Case Closure Authority</h3>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 font-bold text-lg">
                &times;
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded text-xs space-y-1">
              <div>
                <strong>Care Receipt:</strong> {selectedCase.care_receipt_ref}
              </div>
              <div>
                <strong>Child:</strong> {selectedCase.child_name} ({selectedCase.child_id})
              </div>
              <p className="text-[11px] pt-1">
                A case cannot be closed solely because a reminder or message was sent.
                As an authorized Supervisor, you must document the verified outcome or administrative reason below.
              </p>
            </div>

            <form onSubmit={handleSupervisorClose} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Required Supervisor Closure Reason:
                </label>
                <textarea
                  rows={3}
                  required
                  value={supervisorReason}
                  onChange={(e) => setSupervisorReason(e.target.value)}
                  placeholder="Document why this case is complete..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="px-3.5 py-1.5 bg-navy-900 text-white rounded font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {closing ? 'Closing Case...' : 'Authorize Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

