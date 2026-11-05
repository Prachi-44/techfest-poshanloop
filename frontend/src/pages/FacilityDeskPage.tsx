import React, { useState } from 'react';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';

interface LookupResult {
  id: string;
  care_receipt_ref: string;
  child_id: string;
  child_name: string;
  age_months: number | null;
  gender: string | null;
  guardian_name: string | null;
  status: string;
  destination_facility: string | null;
  visit_instruction: string | null;
  priority: string;
  barriers: string[];
  facility_status: string | null;
  facility_recorded_by: string | null;
  facility_recorded_at: string | null;
}

export default function FacilityDeskPage() {
  const { currentUser } = useRole();
  const [tokenInput, setTokenInput] = useState('PL-7K4M2');
  const [searchedRef, setSearchedRef] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outcome submission state
  const [facilityAction, setFacilityAction] = useState<string>('Attended');
  const [doctorName, setDoctorName] = useState(currentUser.name);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await api.get<LookupResult>(`/facility/lookup?ref=${encodeURIComponent(tokenInput.trim().toUpperCase())}`);
      setSearchedRef(res);
    } catch (err: any) {
      setError(err.message || 'No matching referral found for this Care Receipt reference');
      setSearchedRef(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedRef) return;

    try {
      setSubmitting(true);
      await api.post('/facility/acknowledge', {
        care_receipt_ref: searchedRef.care_receipt_ref,
        facility_status: facilityAction,
        recorded_by: doctorName,
        notes: outcomeNotes,
      });

      setSuccessMessage(
        `Facility outcome '${facilityAction}' recorded successfully for token ${searchedRef.care_receipt_ref}. Action logged to ledger.`
      );
      setOutcomeNotes('');
      // Reload updated record
      await handleLookup();
    } catch (err: any) {
      alert('Failed to record facility outcome: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Informational Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
        <h2 className="text-xl font-bold text-navy-900">Facility Desk &mdash; Receiving-Side Outcome Ledger</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          When a family arrives at a PHC, NRC, or sub-district hospital, staff verify the referral using the non-identifying
          Care Receipt token. The referral cannot be closed until this receiving-side confirmation is recorded.
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Enter Care Receipt Reference (e.g. PL-7K4M2, PL-3B8Q1, PL-9X2L5, PL-5M1N8)
        </label>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="e.g. PL-7K4M2"
            className="px-3 py-2 border border-slate-300 rounded text-sm font-mono uppercase font-bold text-teal-900 w-full max-w-sm focus:outline-none focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-navy-900 text-white rounded text-xs font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Find Referral'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
          <span>Quick Seed Tokens:</span>
          {['PL-7K4M2', 'PL-3B8Q1', 'PL-9X2L5', 'PL-5M1N8', 'PL-8R4K7', 'PL-2W6H9'].map((tok) => (
            <button
              key={tok}
              type="button"
              onClick={() => {
                setTokenInput(tok);
              }}
              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-teal-800"
            >
              {tok}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded text-xs">
          <strong>Search Result:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded text-xs font-medium">
          {successMessage}
        </div>
      )}

      {/* Matching Record Found */}
      {searchedRef && (
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {searchedRef.care_receipt_ref}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                  Status: {searchedRef.status}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-1">
                Child ID: <span className="font-mono">{searchedRef.child_id}</span> &bull; Name: {searchedRef.child_name}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold uppercase text-[10px] border border-rose-200">
                {searchedRef.priority} Priority
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <strong className="text-slate-500 block uppercase text-[10px]">Guardian &amp; Demographics</strong>
              <div className="text-navy-900 font-medium mt-0.5">
                {searchedRef.guardian_name} &bull; {searchedRef.age_months}m ({searchedRef.gender})
              </div>
            </div>
            <div>
              <strong className="text-slate-500 block uppercase text-[10px]">Facility Destination</strong>
              <div className="text-navy-900 font-medium mt-0.5">{searchedRef.destination_facility}</div>
            </div>
            <div>
              <strong className="text-slate-500 block uppercase text-[10px]">Current Facility Status</strong>
              <div className="text-navy-900 font-bold mt-0.5">
                {searchedRef.facility_status || 'Not Yet Acknowledged'}
              </div>
            </div>
          </div>

          {/* Record Receiving Outcome Form */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">Record Facility Desk Outcome</h3>
            <form onSubmit={handleRecordOutcome} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Facility Action</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { val: 'Received', label: 'Received (Admitted / Registered)' },
                    { val: 'Attended', label: 'Attended (Consultation Complete)' },
                    { val: 'Rescheduled', label: 'Rescheduled (New Date Set)' },
                    { val: 'Not reached', label: 'Not Reached (Did Not Present)' },
                    { val: 'Wrong facility', label: 'Wrong Facility (Re-route)' },
                  ].map((act) => (
                    <button
                      key={act.val}
                      type="button"
                      onClick={() => setFacilityAction(act.val)}
                      className={`p-2 rounded text-left border text-xs transition ${
                        facilityAction === act.val
                          ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Doctor / Medical Officer Name</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Facility Outcome Notes</label>
                  <input
                    type="text"
                    required
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="e.g. Completed clinical checkup; supplementary ration given for 14 days"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Updating Ledger...' : 'Confirm & Record Facility Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

