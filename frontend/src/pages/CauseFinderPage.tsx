import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../contexts/RoleContext';

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  info_card: string;
}

interface CauseFinderChecklistResponse {
  items: ChecklistItem[];
  disclaimer: string;
}

interface SessionRecord {
  id: string;
  child_id: string;
  worker_role: string;
  worker_name: string;
  checklist_responses: Record<string, boolean>;
  suggested_actions: string[];
  disclaimer_shown: boolean;
  created_at: string;
}

export default function CauseFinderPage() {
  const [searchParams] = useSearchParams();
  const initialChildId = searchParams.get('child_id') || 'CH-0030';
  const { currentUser, currentRole } = useRole();

  const [childId, setChildId] = useState(initialChildId);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const [savedSession, setSavedSession] = useState<SessionRecord | null>(null);

  useEffect(() => {
    loadChecklist();
  }, []);

  useEffect(() => {
    if (childId) loadSessions();
  }, [childId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const res = await api.get<CauseFinderChecklistResponse>('/cause-finder/checklist');
      setChecklist(res.items);
      setDisclaimer(res.disclaimer);

      // Initialize default responses as false
      const initial: Record<string, boolean> = {};
      res.items.forEach((item) => {
        initial[item.id] = false;
      });
      setResponses(initial);
    } catch (e) {
      console.error('Failed to load checklist', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get<SessionRecord[]>(`/cause-finder/sessions/${childId}`);
      setPastSessions(res);
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  const handleResponseChange = (id: string, val: boolean) => {
    setResponses((prev) => ({ ...prev, [id]: val }));
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId.trim()) return;

    try {
      setSaving(true);
      const res = await api.post<SessionRecord>('/cause-finder/session', {
        child_id: childId.trim(),
        worker_role: currentRole,
        worker_name: currentUser.name,
        checklist_responses: responses,
      });

      setSavedSession(res);
      await loadSessions();
    } catch (err: any) {
      alert('Failed to save guided conversation session: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Pre-approved guidance matching active responses
  const activeGuidance = checklist.filter((item) => responses[item.id]);

  return (
    <div className="space-y-5">
      {/* Informational Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-2">
        <h2 className="text-xl font-bold text-navy-900">Cause Finder &mdash; Guided Family Conversation</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Cause Finder organizes a supportive, empathetic frontline conversation to uncover practical household and care barriers.
          It provides pre-approved administrative and social guidance.
        </p>

        {/* Mandatory Non-Clinical Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded text-xs flex items-start gap-2.5">
          <span className="text-amber-600 font-bold text-sm shrink-0 mt-0.5">&#9888;</span>
          <div>
            <strong>Important Public-Service Notice:</strong> This is NOT a diagnosis or treatment recommendation.
            Clinical care decisions belong exclusively to qualified medical doctors and health professionals.
            Never recommend medicines, dosages, emergency treatments or clinical diagnoses.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Checklist */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Conversational Checklist</h3>
              <p className="text-slate-500">Ask the caregiver gently about routine household practices</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Child ID:</label>
              <input
                type="text"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-teal-900"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading checklist items...</div>
          ) : (
            <form onSubmit={handleSaveSession} className="space-y-4">
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border transition ${
                      responses[item.id]
                        ? 'border-teal-300 bg-teal-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                          {item.category}
                        </span>
                        <div className="font-medium text-navy-900 text-xs mt-0.5">{item.question}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`resp-${item.id}`}
                            checked={responses[item.id] === true}
                            onChange={() => handleResponseChange(item.id, true)}
                            className="text-teal-600"
                          />
                          <span className="text-xs font-semibold text-navy-900">Yes / Barrier</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer ml-1">
                          <input
                            type="radio"
                            name={`resp-${item.id}`}
                            checked={responses[item.id] === false}
                            onChange={() => handleResponseChange(item.id, false)}
                            className="text-slate-400"
                          />
                          <span className="text-xs text-slate-500">No / Normal</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Guided Conversation Session'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Pre-Approved Guidance Cards */}
        <div className="space-y-4 text-xs">
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">Suggested Supportive Next Steps</h3>
            <p className="text-slate-500 text-[11px]">
              Pre-written, admin-approved guidance cards dynamically generated based on caregiver responses.
            </p>

            {activeGuidance.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-500 text-center italic">
                Select applicable checklist items to view approved supportive suggestions.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeGuidance.map((g) => (
                  <div key={g.id} className="p-3 bg-teal-50 border border-teal-200 rounded text-teal-950 space-y-1">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      {g.category} Guidance
                    </span>
                    <p className="text-[11px] leading-relaxed">{g.info_card}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions History */}
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">Previous Sessions ({pastSessions.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pastSessions.length === 0 ? (
                <div className="text-slate-400 text-center py-2 italic text-[11px]">No prior sessions recorded.</div>
              ) : (
                pastSessions.map((s) => (
                  <div key={s.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      <span className="font-medium text-navy-900">{s.worker_name} ({s.worker_role})</span>
                    </div>
                    <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                      {s.suggested_actions.slice(0, 2).map((a, idx) => (
                        <li key={idx} className="line-clamp-2">{a}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

