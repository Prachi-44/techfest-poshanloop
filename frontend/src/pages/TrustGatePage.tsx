import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';

interface TrustFlag {
  id: string;
  measurement_id: string;
  child_id: string;
  rule_code: string;
  rule_description: string;
  severity: 'info' | 'warning' | 'critical';
  source_field: string;
  source_value: string | null;
  recommended_action: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string | null;
}

export default function TrustGatePage() {
  const { currentUser, currentRole } = useRole();
  const [flags, setFlags] = useState<TrustFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Resolution modal state
  const [selectedFlag, setSelectedFlag] = useState<TrustFlag | null>(null);
  const [newStatus, setNewStatus] = useState('Verified');
  const [resolutionNote, setResolutionNote] = useState('');
  const [correctedValue, setCorrectedValue] = useState('');
  const [correctedUnit, setCorrectedUnit] = useState('kg');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFlags();
  }, [statusFilter, severityFilter]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);

      const res = await api.get<{ total: number; items: TrustFlag[] }>(`/trust-gate/flags?${params.toString()}`);
      setFlags(res.items);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load Trust Gate flags');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlag) return;

    try {
      setSubmitting(true);
      const payload: any = {
        status: newStatus,
        reviewed_by: currentUser.name,
        resolution_note: resolutionNote,
      };

      if (newStatus === 'Corrected') {
        if (!correctedValue) {
          alert('Please enter a corrected value');
          setSubmitting(false);
          return;
        }
        payload.corrected_value = parseFloat(correctedValue);
        payload.corrected_unit = correctedUnit;
      }

      await api.post(`/trust-gate/${selectedFlag.id}/verify`, payload);
      setSelectedFlag(null);
      setResolutionNote('');
      setCorrectedValue('');
      await loadFlags();
    } catch (err: any) {
      alert('Verification failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Informational Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
        <h2 className="text-xl font-bold text-navy-900">Trust Gate &mdash; Measurement Quality &amp; Confidence</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          The Trust Gate helps frontline workers identify measurements that need checking without assigning blame or making clinical diagnoses.
          Thresholds are administrative heuristics (e.g. repeated values, missing units, large jumps between measurements).
          <strong> Key Rule:</strong> Correcting an entry preserves the original reading and creates a linked audit record.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Statuses</option>
            <option value="Needs review">Needs review</option>
            <option value="Re-measurement requested">Re-measurement requested</option>
            <option value="Verified">Verified</option>
            <option value="Corrected">Corrected</option>
            <option value="Clear">Clear</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-teal-600"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="ml-auto text-slate-500 self-end pb-1.5">
          Showing <strong>{flags.length}</strong> alerts
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Checking data quality rules...</div>
        ) : error ? (
          <div className="p-4 text-xs text-red-600 bg-red-50">{error}</div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No Trust Gate alerts matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Child ID</th>
                  <th className="py-2.5 px-3">Rule Violation</th>
                  <th className="py-2.5 px-3">Field &amp; Source Value</th>
                  <th className="py-2.5 px-3">Recommended Next Step</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flags.map((fl) => (
                  <tr key={fl.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          fl.severity === 'critical'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : fl.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {fl.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-navy-900">
                      <Link to={`/children/${fl.child_id}`} className="hover:underline text-teal-800">
                        {fl.child_id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-navy-900">{fl.rule_code}</div>
                      <div className="text-slate-500 text-[11px] max-w-xs">{fl.rule_description}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <div>{fl.source_field}</div>
                      <div className="text-slate-500 font-bold">
                        {fl.source_value !== null && fl.source_value !== '' ? fl.source_value : '<empty>'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                      {fl.recommended_action}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          fl.status === 'Needs review'
                            ? 'bg-amber-50 text-amber-900 border border-amber-300'
                            : fl.status === 'Corrected'
                            ? 'bg-blue-50 text-blue-900 border border-blue-300'
                            : fl.status === 'Verified'
                            ? 'bg-teal-50 text-teal-900 border border-teal-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {fl.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedFlag(fl);
                          setNewStatus('Verified');
                          setResolutionNote('');
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 shadow-sm"
                      >
                        Verify / Correct
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 w-full max-w-lg p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">Review Trust Gate Alert</h3>
                <span className="text-xs text-slate-500">Child: {selectedFlag.child_id}</span>
              </div>
              <button
                onClick={() => setSelectedFlag(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
              <div>
                <strong className="text-navy-900">Rule Code:</strong> {selectedFlag.rule_code}
              </div>
              <div>
                <strong className="text-navy-900">Description:</strong> {selectedFlag.rule_description}
              </div>
              <div>
                <strong className="text-navy-900">Source Field / Value:</strong> {selectedFlag.source_field} ={' '}
                <span className="font-mono">{selectedFlag.source_value || 'None'}</span>
              </div>
            </div>

            <form onSubmit={handleResolve} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Administrative Decision</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-navy-900"
                >
                  <option value="Verified">Verified (Confirmed correct after manual inspection)</option>
                  <option value="Corrected">Corrected (Enter correct value; preserves original)</option>
                  <option value="Re-measurement requested">Re-measurement requested (Frontline worker follow-up)</option>
                  <option value="Clear">Clear (Dismiss flag)</option>
                </select>
              </div>

              {newStatus === 'Corrected' && (
                <div className="grid grid-cols-2 gap-2 bg-teal-50 p-3 rounded border border-teal-200">
                  <div>
                    <label className="block text-teal-950 font-medium mb-1">Corrected Value</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={correctedValue}
                      onChange={(e) => setCorrectedValue(e.target.value)}
                      placeholder="e.g. 9.5"
                      className="w-full px-2.5 py-1.5 border border-teal-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 font-medium mb-1">Unit</label>
                    <input
                      type="text"
                      value={correctedUnit}
                      onChange={(e) => setCorrectedUnit(e.target.value)}
                      placeholder="kg or cm"
                      className="w-full px-2.5 py-1.5 border border-teal-300 rounded bg-white"
                    />
                  </div>
                  <div className="col-span-2 text-[11px] text-teal-800">
                    &bull; A new linked measurement record will be created. The original record remains in the historical audit trail.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Resolution Note / Explanation</label>
                <textarea
                  rows={2}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Document why this value was verified or corrected..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFlag(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving Resolution...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

