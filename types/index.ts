// ─── Alert row shapes ──────────────────────────────────────────────────────

export interface SolarWindsAlertRow {
  alertType: string;
  name: string;
  details: string;
  time: string;
  ticket: string;
  notes: string;
  selected: boolean;
}

export interface VeeamAlertRow {
  type: string;
  vbrHost: string;
  details: string;
  ticket: string;
  notes: string;
  selected: boolean;
}

export interface VmwareAlertRow {
  alertType: string;
  host: string;
  details: string;
  ticket: string;
  notes: string;
  selected: boolean;
}

export interface CheckpointAlertRow {
  severity: string;
  name: string;
  machine: string;
  details: string;
  ticket: string;
  notes: string;
  selected: boolean;
}

// ─── Form data shapes ──────────────────────────────────────────────────────

export interface SolarWindsFormData {
  engineer: string;
  date: string;
  solarwinds: {
    servicesRunning: string;
    client: string;
    serviceDownTicket: string;
    alertsGenerated: string;
    alerts: SolarWindsAlertRow[];
  };
}

export interface VeeamFormData {
  engineer: string;
  date: string;
  alertsGenerated: string;
  alerts: VeeamAlertRow[];
  selectAll: boolean;
  localAlertsGenerated: string;
  localAlerts: VeeamAlertRow[];
  selectAllLocal: boolean;
}

export type VmwareOrg = "clarion" | "panoptics" | "volac";

export interface VmwareBucket {
  alert: string;
  rows: VmwareAlertRow[];
  selectAll: boolean;
}

export interface VmwareFormData {
  engineer: string;
  date: string;
  vsan: {
    alerts: Record<VmwareOrg, VmwareBucket>;
  };
}

export interface CheckpointSection {
  alertsGenerated: string;
  alerts: CheckpointAlertRow[];
  selectAll: boolean;
}

export interface CheckpointFormData {
  engineer: string;
  date: string;
  panoptics: CheckpointSection;
  brewery: CheckpointSection;
}

// ─── Submission ────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  createdAt: string;
  module: string;
  engineer: string;
  checkDate: string;
  passed: boolean;
  payload: unknown;
  pdfName?: string;
}

// ─── Known Issue ───────────────────────────────────────────────────────────

export interface ReviewEntry {
  at: string;
  by: string;
}

export interface KnownIssue {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  systems: string[];
  summary: string;
  workaroundUrl?: string;
  owner: string;
  acceptedUntil?: string;
  lastReviewed: string;
  lastReviewedBy?: string;
  reviewHistory: ReviewEntry[];
  status: "active" | "retired";
  risk: "low" | "medium" | "high";
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export type AuthMode = "local" | "sso" | "both";

export interface SessionUser {
  name: string;
  checkDate: string;
}

// ─── Nav ───────────────────────────────────────────────────────────────────

export type Screen =
  | "dashboard"
  | "solarwinds"
  | "vsan"
  | "veeam"
  | "checkpoint"
  | "knownissues"
  | "admin";
