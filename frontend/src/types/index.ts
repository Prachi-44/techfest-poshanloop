// ── Role ────────────────────────────────────────────
export type Role = 'AWW' | 'ASHA_ANM' | 'Facility' | 'Supervisor';

// ── Demo user ───────────────────────────────────────
export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  centre?: string;
  block?: string;
}

// ── Child ───────────────────────────────────────────
export type DataFreshness = 'Up to date' | 'Overdue' | 'No data';

export interface Child {
  id: string;
  name: string;
  age_months: number;
  gender: 'M' | 'F';
  mother_name: string;
  centre_id: string;
  centre_name: string;
  block: string;
  registered_at: string;
  last_measurement_date: string | null;
  data_freshness: DataFreshness;
  active_referrals: number;
  trust_gate_flags: number;
}

// ── Measurement ─────────────────────────────────────
export type MeasurementType = 'weight' | 'height' | 'muac';

export interface Measurement {
  id: string;
  child_id: string;
  measurement_type: MeasurementType;
  value: number;
  unit: string;
  recorded_by: string;
  recorded_at: string;
  device_id: string | null;
  trust_gate_status: TrustGateStatus;
  is_correction: boolean;
  original_measurement_id: string | null;
}

// ── Trust Gate ──────────────────────────────────────
export type TrustGateStatus = 'Clear' | 'Needs review' | 'Re-measurement requested' | 'Verified' | 'Corrected';

export type TrustGateSeverity = 'low' | 'medium' | 'high';

export interface TrustGateFlag {
  id: string;
  measurement_id: string;
  child_id: string;
  child_name: string;
  measurement_type: MeasurementType;
  rule: string;
  reason: string;
  source_value: number;
  flagged_at: string;
  status: TrustGateStatus;
  severity: TrustGateSeverity;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

// ── Referral / Case ─────────────────────────────────
export type ReferralStatus =
  | 'created'
  | 'acknowledged'
  | 'in_progress'
  | 'attended'
  | 'rescheduled'
  | 'not_reached'
  | 'wrong_facility'
  | 'outcome_recorded'
  | 'closed';

export type ReferralPriority = 'routine' | 'urgent' | 'emergency';

export interface Referral {
  id: string;
  child_id: string;
  child_name: string;
  care_receipt_ref: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  owner_role: Role;
  owner_name: string;
  destination_facility: string;
  visit_instruction: string;
  barriers: string[];
  barrier_notes: string;
  due_date: string;
  next_action: string;
  created_at: string;
  updated_at: string;
  facility_outcome: string | null;
  closure_reason: string | null;
}

// ── Case Events ─────────────────────────────────────
export interface CaseEvent {
  id: string;
  referral_id: string;
  actor: string;
  actor_role: Role;
  action: string;
  note: string;
  created_at: string;
}

// ── Sync / Offline ──────────────────────────────────
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error';

export interface SyncEvent {
  id: string;
  eventType: string;
  eventData: Record<string, unknown>;
  deviceCreatedAt: string;
  syncStatus: SyncStatus;
  syncedAt: string | null;
  conflictData: Record<string, unknown> | null;
}

// ── Cause Finder ────────────────────────────────────
export type CauseItemKey =
  | 'ration_access'
  | 'recent_illness'
  | 'feeding_difficulty'
  | 'caregiver_concern'
  | 'travel_barrier'
  | 'followup_preference';

export type CauseAnswer = 'yes' | 'no' | 'not_discussed';

export interface CauseItem {
  key: CauseItemKey;
  answer: CauseAnswer;
  note: string;
}

export interface CauseFinderSession {
  id: string;
  child_id: string;
  child_name: string;
  items: CauseItem[];
  created_by: string;
  created_at: string;
}

// ── Dashboard / Overview ────────────────────────────
export interface OverviewData {
  total_children: number;
  records_due: number;
  trust_gate_flags: number;
  unknown_overdue: number;
  open_referrals: number;
  overdue_cases: number;
  confirmed_outcomes: number;
  recent_events: CaseEvent[];
  status_distribution: { centre: string; up_to_date: number; overdue: number; no_data: number }[];
}

// ── Coverage ────────────────────────────────────────
export interface CoverageCenter {
  centre_id: string;
  centre_name: string;
  block: string;
  total_children: number;
  up_to_date: number;
  overdue: number;
  no_data: number;
  confirmed_concern: number;
  days_since_oldest_overdue: number;
  status: 'green' | 'amber' | 'red';
}

export interface CoverageData {
  centres: CoverageCenter[];
  blocks: string[];
  age_bands: string[];
  summary: {
    total_centres: number;
    green: number;
    amber: number;
    red: number;
  };
}

// ── Supervisor ──────────────────────────────────────
export interface WorkerLoad {
  name: string;
  role: Role;
  active_cases: number;
  overdue_cases: number;
}

// ── Facility lookup ─────────────────────────────────
export interface FacilityAction {
  id: string;
  referral_id: string;
  care_receipt_ref: string;
  child_name: string;
  action: string;
  recorded_at: string;
}
