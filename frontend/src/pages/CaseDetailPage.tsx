import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';
import TimelineView from '../components/TimelineView';
import CareReceiptPrint from '../components/CareReceiptPrint';

interface CaseDetail {
  id: string;
  child_id: string;
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
  facility_recorded_by: string | null;
  facility_recorded_at: string | null;
  closure_reason: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  child: {
    id: string;
    name: string;
    age_months: number;
    gender: string;
    centre_id: string;
    guardian_name: string;
  } | null;
  events: Array<{
    id: string;
    referral_id: string;
    actor_role: string;
    actor_name: string;
    action: string;
    note: string | null;
    timestamp: string | null;
    event_data: any;
  }>;
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, currentRole } = useRole();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionName, setActionName] = useState('Home Visit Follow-up');
  const [actionStatus, setActionStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionNextStep, setActionNextStep] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const res = await api.get<CaseDetail>(`/referrals/${id}`);
      setCaseData(res);
      setActionStatus(res.status);
      setActionNextStep(res.next_action || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load case ledger details');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    try {
      setSubmittingAction(true);
      setActionError(null);

      const payload: any = {
        action: actionName,
        actor_role: currentRole,
        actor_name: currentUser.name,
        note: actionNote,
        new_status: actionStatus || undefined,
        next_action: actionNextStep || undefined,
        closure_reason: closureReason || undefined,
      };

      await api.post(`/referrals/${caseData.id}/actions`, payload);
      setShowActionModal(false);
      setActionNote('');
      setClosureReason('');
      await loadCase();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading Action-to-Closure ledger...</div>;
  }

  if (error || !caseData) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded text-xs border border-red-200">
        <p className="font-semibold">Case record not found</p>
        <p className="mt-1">{error}</p>
        <Link to="/referrals" className="mt-3 inline-block font-medium text-navy-900 underline">
          &larr; Back to referrals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/referrals" className="hover:underline">
            Referral Worklist
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-navy-900">{caseData.care_receipt_ref}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrintSlip(true)}
            className="px-3 py-1.5 border border-slate-300 text-slate-800 bg-white rounded text-xs font-medium hover:bg-slate-50 shadow-sm"
          >
            Print Care Receipt Slip
          </button>
          <button
            onClick={() => {
              setActionName('Case Update');
              setActionStatus(caseData.status);
              setShowActionModal(true);
            }}
            className="px-3.5 py-1.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 shadow-sm"
          >
            + Record Action on Ledger
          </button>
        </div>
      </div>

      {/* Case Overview Card */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col md:flex-row justify-between items-start gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {caseData.care_receipt_ref}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold uppercase text-[11px]">
                {caseData.status}
              </span>
              <span className="text-[11px] font-bold uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {caseData.priority} Priority
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mt-1.5">
              Case ID: <span className="font-mono text-slate-700">{caseData.id}</span> &bull; Issued:{' '}
              {caseData.date_issued ? new Date(caseData.date_issued).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-slate-500 text-[11px]">Assigned Owner</div>
            <div className="font-bold text-navy-900 text-sm">{caseData.assigned_to_name || 'Unassigned'}</div>
            <div className="text-teal-700 font-medium text-[11px]">{caseData.assigned_to_role}</div>
          </div>
        </div>

        {/* Child Context & Facility Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Beneficiary Context</span>
            <div className="font-bold text-navy-900 mt-0.5">{caseData.child?.name || 'Child'}</div>
            <div className="text-slate-600 text-[11px] mt-0.5">
              ID: {caseData.child_id} &bull; {caseData.child?.age_months}m &bull; Guardian:{' '}
              {caseData.child?.guardian_name}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Destination Facility</span>
            <div className="font-bold text-navy-900 mt-0.5">{caseData.destination_facility || 'Health Facility'}</div>
            <div className="text-slate-600 text-[11px] mt-0.5">
              Instruction: {caseData.visit_instruction || 'Bring MCP card.'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Next Action &amp; Target</span>
            <div className="font-bold text-navy-900 mt-0.5">{caseData.next_action || 'Pending action'}</div>
            <div className="text-slate-600 text-[11px] mt-0.5">
              Due Date: {caseData.due_date ? new Date(caseData.due_date).toLocaleDateString() : 'Immediate'}
            </div>
          </div>
        </div>

        {/* Family Barriers Section */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded space-y-1.5">
          <div className="flex items-center justify-between">
            <strong className="text-amber-950 font-semibold">Captured Family Barriers</strong>
            <span className="text-[10px] text-amber-800">Operational continuity focus</span>
          </div>
          {caseData.barriers && caseData.barriers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {caseData.barriers.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 bg-white text-amber-950 border border-amber-300 rounded font-medium text-[11px]"
                >
                  {b.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 italic text-[11px]">No specific family barriers recorded yet.</div>
          )}
          {caseData.barrier_notes && (
            <div className="text-slate-700 text-[11px] pt-1">
              <strong>Notes:</strong> {caseData.barrier_notes}
            </div>
          )}
        </div>

        {/* Receiving Side Status */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-slate-500 font-semibold uppercase text-[10px] block">Receiving-Side Outcome</span>
            <div className="font-bold text-navy-900 mt-0.5">
              {caseData.facility_status ? (
                <span className="text-teal-800 font-semibold">{caseData.facility_status}</span>
              ) : (
                <span className="text-slate-500 italic">Awaiting presentation at destination facility</span>
              )}
            </div>
            {caseData.facility_recorded_by && (
              <div className="text-[11px] text-slate-500">
                Recorded by: {caseData.facility_recorded_by} on{' '}
                {caseData.facility_recorded_at ? new Date(caseData.facility_recorded_at).toLocaleDateString() : ''}
              </div>
            )}
          </div>
          {caseData.closure_reason && (
            <div className="text-left sm:text-right">
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Closure Reason</span>
              <div className="text-navy-900 font-medium text-[11px]">{caseData.closure_reason}</div>
            </div>
          )}
        </div>
      </div>

      {/* Message Preview (Non-sensitive) */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-xs space-y-2">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-navy-900 text-xs uppercase tracking-wide">
            Caregiver Mobile Message Preview
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            Preview Only &bull; Message Not Sent
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
          &ldquo;Namaskar. Your Anganwadi worker has scheduled support for your child at {caseData.destination_facility}.
          Reference Code: <strong>{caseData.care_receipt_ref}</strong>. Please show this code on arrival. For help with travel,
          contact your Anganwadi centre.&rdquo;
        </div>
        <p className="text-[10px] text-slate-500">
          Privacy Protection: No diagnostic terminology, illness codes, or personal health records are sent in plain text.
        </p>
      </div>

      {/* Append-Only Action Ledger Timeline */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-navy-900 text-sm">Action-to-Closure Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Append-only chronological record of frontline visits, barrier support, facility acknowledgements, and closure.
          </p>
        </div>

        <TimelineView
          events={caseData.events.map((ev) => ({
            id: ev.id,
            referral_id: ev.referral_id,
            actor: ev.actor_name,
            actor_role: ev.actor_role as any,
            action: ev.action,
            note: ev.note || '',
            created_at: ev.timestamp || new Date().toISOString(),
          }))}
        />
      </div>

      {/* Action / Status Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">Record Action on Case Ledger</h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                <strong>Action Blocked:</strong> {actionError}
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Action Description</label>
                <input
                  type="text"
                  required
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="e.g. Home Visit Completed / Transport Arranged"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Advance Case Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-navy-900"
                >
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Family contacted">Family contacted</option>
                  <option value="Barrier support arranged">Barrier support arranged</option>
                  <option value="Referred">Referred</option>
                  <option value="Facility acknowledged">Facility acknowledged</option>
                  <option value="Outcome recorded">Outcome recorded</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Not reached">Not reached</option>
                  <option value="Closed">Closed (Requires outcome or supervisor reason)</option>
                </select>
              </div>

              {actionStatus === 'Closed' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-950 space-y-2">
                  <div className="font-semibold">Closure Rule Verification:</div>
                  <p>
                    A case cannot be closed because a reminder was sent. It strictly requires either an Attended facility outcome
                    OR an authorized Supervisor closure reason.
                  </p>
                  <div>
                    <label className="block font-medium mb-1">Supervisor Closure Justification:</label>
                    <textarea
                      rows={2}
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      placeholder="Explain verified outcome or alternative resolution..."
                      className="w-full px-2 py-1 border border-amber-300 rounded bg-white text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Next Action Step</label>
                <input
                  type="text"
                  value={actionNextStep}
                  onChange={(e) => setActionNextStep(e.target.value)}
                  placeholder="What is the next operational step?"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes / Field Details</label>
                <textarea
                  rows={2}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Context, family response, or transport coordination details..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Append to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Care Receipt Modal */}
      {showPrintSlip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">Printable Referral Slip</h3>
              <button onClick={() => setShowPrintSlip(false)} className="text-slate-400 font-bold text-lg hover:text-slate-700">
                &times;
              </button>
            </div>
            <CareReceiptPrint
              careReceiptRef={caseData.care_receipt_ref}
              destinationFacility={caseData.destination_facility || 'Primary Health Centre'}
              visitInstruction={caseData.visit_instruction || 'Bring MCP card and report during OPD hours (9 AM - 1 PM).'}
              dateIssued={caseData.date_issued ? new Date(caseData.date_issued).toLocaleDateString() : new Date().toLocaleDateString()}
              helpContact="Anganwadi / ASHA Health Help Desk: 1800-111-222"
            />
          </div>
        </div>
      )}
    </div>
  );
}
