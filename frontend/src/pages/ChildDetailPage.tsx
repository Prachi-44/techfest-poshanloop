import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

interface ChildDetail {
  id: string;
  name: string;
  age_months: number;
  gender: string;
  centre_id: string;
  centre_name: string;
  block_id: string;
  block_name: string;
  district: string;
  guardian_name: string;
  status: string;
  measurements: Array<{
    id: string;
    measurement_type: string;
    value: number;
    unit: string | null;
    measurement_date: string | null;
    recorded_by: string;
    recorded_at: string | null;
    is_corrected: boolean;
    correction_reason: string | null;
  }>;
  trust_gate_flags: Array<{
    id: string;
    rule_code: string;
    rule_description: string;
    severity: string;
    source_field: string;
    source_value: string | null;
    recommended_action: string;
    status: string;
  }>;
  referrals: Array<{
    id: string;
    care_receipt_ref: string;
    status: string;
    priority: string;
    destination_facility: string | null;
    assigned_to_role: string | null;
    next_action: string | null;
    due_date: string | null;
  }>;
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add measurement form state
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [measType, setMeasType] = useState('weight');
  const [measValue, setMeasValue] = useState('');
  const [measUnit, setMeasUnit] = useState('kg');
  const [measDate, setMeasDate] = useState(new Date().toISOString().split('T')[0]);
  const [measNotes, setMeasNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadChild();
  }, [id]);

  const loadChild = async () => {
    try {
      setLoading(true);
      const res = await api.get<ChildDetail>(`/children/${id}`);
      setChild(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load child details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!measValue || isNaN(Number(measValue))) {
      alert('Please enter a valid numeric value');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post<{ flags_triggered: number }>(`/children/${id}/measurements`, {
        measurement_type: measType,
        value: parseFloat(measValue),
        unit: measUnit,
        measurement_date: measDate,
        notes: measNotes,
      });

      setSaveMessage(
        res.flags_triggered > 0
          ? `Measurement saved. Note: ${res.flags_triggered} Trust Gate alert(s) triggered for review.`
          : 'Measurement recorded successfully with clean Trust Gate check.'
      );
      setShowAddMeasurement(false);
      setMeasValue('');
      setMeasNotes('');
      await loadChild();
    } catch (err: any) {
      alert('Failed to save measurement: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading child details...</div>;
  }

  if (error || !child) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded text-xs border border-red-200">
        <p className="font-semibold">Child record not found</p>
        <p className="mt-1">{error}</p>
        <Link to="/children" className="mt-3 inline-block font-medium text-navy-900 underline">
          &larr; Back to registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/children" className="hover:underline">
            Children Registry
          </Link>
          <span>/</span>
          <span className="text-navy-900 font-semibold">{child.id}</span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/cause-finder?child_id=${child.id}`}
            className="px-3 py-1.5 bg-navy-900 text-white rounded text-xs font-medium hover:bg-navy-800"
          >
            Guided Conversation (Cause Finder)
          </Link>
          <button
            onClick={() => setShowAddMeasurement(true)}
            className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700"
          >
            + Record Measurement
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded text-xs flex justify-between">
          <span>{saveMessage}</span>
          <button onClick={() => setSaveMessage(null)} className="font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Child ID &amp; Name
          </span>
          <div className="text-sm font-bold text-navy-900 mt-0.5">{child.name}</div>
          <div className="font-mono text-slate-500 text-[11px]">{child.id}</div>
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Age &amp; Gender
          </span>
          <div className="text-sm font-bold text-navy-900 mt-0.5">
            {child.age_months} months &bull; {child.gender === 'M' ? 'Male' : 'Female'}
          </div>
          <div className="text-slate-500 text-[11px]">Guardian: {child.guardian_name}</div>
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Enrolled Centre
          </span>
          <div className="text-sm font-bold text-navy-900 mt-0.5">{child.centre_name}</div>
          <div className="text-slate-500 text-[11px]">{child.centre_id}</div>
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Administrative Area
          </span>
          <div className="text-sm font-bold text-navy-900 mt-0.5">{child.block_name}</div>
          <div className="text-slate-500 text-[11px]">District: {child.district}</div>
        </div>
      </div>

      {/* Record Measurement Modal */}
      {showAddMeasurement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-md p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">Record New Growth Reading</h3>
              <button
                onClick={() => setShowAddMeasurement(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddMeasurement} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Measurement Type</label>
                <select
                  value={measType}
                  onChange={(e) => {
                    setMeasType(e.target.value);
                    setMeasUnit(e.target.value === 'weight' ? 'kg' : 'cm');
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="weight">Weight</option>
                  <option value="height">Height</option>
                  <option value="muac">Mid-Upper Arm Circumference (MUAC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Measured Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={measValue}
                    onChange={(e) => setMeasValue(e.target.value)}
                    placeholder="e.g. 9.4"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={measUnit}
                    onChange={(e) => setMeasUnit(e.target.value)}
                    placeholder="kg or cm"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Measurement Date</label>
                <input
                  type="date"
                  value={measDate}
                  onChange={(e) => setMeasDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes / Context</label>
                <input
                  type="text"
                  value={measNotes}
                  onChange={(e) => setMeasNotes(e.target.value)}
                  placeholder="e.g. Taken during monthly AWC village check"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                <span className="font-semibold text-navy-900">Trust Gate Confidence Check:</span>{' '}
                Entry will be validated for missing fields, duplicates, and large jumps before saving.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurement(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Validating & Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trust Gate Flags Section */}
      {child.trust_gate_flags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Trust Gate Quality Alerts ({child.trust_gate_flags.length})
            </h3>
            <Link to="/trust-gate" className="text-xs text-amber-800 font-medium underline">
              Manage in Trust Gate &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {child.trust_gate_flags.map((fl) => (
              <div
                key={fl.id}
                className="bg-white border border-amber-200 rounded p-2.5 text-xs flex flex-col sm:flex-row justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-navy-900">
                    [{fl.rule_code}] {fl.rule_description}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    Recommended action: <span className="font-medium">{fl.recommended_action}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase">
                    {fl.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Measurement History Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-navy-900 text-sm">Measurement History</h3>
          <span className="text-xs text-slate-500">{child.measurements.length} records on file</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {child.measurements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">
                    No measurements on file for this child.
                  </td>
                </tr>
              ) : (
                child.measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {m.measurement_date ? new Date(m.measurement_date).toLocaleDateString() : 'Missing Date'}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-medium text-navy-900">{m.measurement_type}</td>
                    <td className="py-2.5 px-3 font-bold text-navy-900">{m.value}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.unit || <span className="text-amber-600 font-bold">None</span>}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.recorded_by}</td>
                    <td className="py-2.5 px-3">
                      {m.is_corrected ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium line-through">
                          Superseded (Corrected)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-medium">
                          Active Valid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Referrals */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-navy-900 text-sm">Referrals &amp; Action Ledger Cases</h3>
          <span className="text-xs text-slate-500">{child.referrals.length} case(s)</span>
        </div>
        <div className="divide-y divide-slate-100">
          {child.referrals.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No referrals initiated for this child.</div>
          ) : (
            child.referrals.map((ref) => (
              <div key={ref.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {ref.care_receipt_ref}
                    </span>
                    <span className="font-semibold text-navy-900">{ref.status}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="capitalize text-slate-600">Priority: {ref.priority}</span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Facility: {ref.destination_facility || 'Primary Health Centre'} &bull; Assigned to:{' '}
                    {ref.assigned_to_role}
                  </div>
                  {ref.next_action && (
                    <div className="text-navy-900 font-medium text-[11px] mt-0.5">
                      Next Step: {ref.next_action}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <Link
                    to={`/referrals/${ref.id}`}
                    className="px-3 py-1 bg-navy-900 text-white rounded text-xs font-medium hover:bg-navy-800 inline-block"
                  >
                    Open Case Ledger &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

