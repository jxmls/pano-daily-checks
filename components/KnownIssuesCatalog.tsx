"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { KnownIssue } from "@/types";

interface Props { engineer: string; }

const blank = (): Omit<KnownIssue, "id" | "createdAt" | "updatedAt"> => ({
  title: "", systems: [], summary: "", workaroundUrl: "", owner: "Infra",
  acceptedUntil: "", lastReviewed: new Date().toISOString(), lastReviewedBy: "",
  reviewHistory: [], status: "active", risk: "low",
});

const SYSTEMS = ["SolarWinds", "VMware vSAN", "Veeam", "Checkpoint", "Active Directory", "Azure", "Network", "Other"];

function daysFromNow(d?: string): number {
  if (!d) return Infinity;
  return Math.floor((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
}

function RiskBadge({ risk }: { risk: string }) {
  const style = risk === "high"
    ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
    : risk === "medium"
    ? { background: "rgba(245,158,11,0.1)", color: "#f59e0b" }
    : { background: "rgba(34,197,94,0.1)", color: "#22c55e" };
  return <span className="px-2 py-0.5 rounded text-xs font-bold capitalize" style={style}>{risk}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return status === "active"
    ? <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(0,180,180,0.1)", color: "#00b4b4" }}>Active</span>
    : <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>Retired</span>;
}

export default function KnownIssuesCatalog({ engineer }: Props) {
  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<KnownIssue> & { id?: string } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "retired">("active");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/known-issues");
      if (!res.ok) throw new Error("Failed to load known issues");
      setIssues(await res.json());
    } catch {
      setError("Could not load known issues. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(blank()); setIsNew(true); };
  const openEdit = (issue: KnownIssue) => { setEditing({ ...issue }); setIsNew(false); };

  const commitEdit = async () => {
    if (!editing?.title?.trim() || saving) return;
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch("/api/known-issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editing.title ?? "",
            systems: editing.systems ?? [],
            summary: editing.summary ?? "",
            workaroundUrl: editing.workaroundUrl || null,
            owner: editing.owner ?? "Infra",
            acceptedUntil: editing.acceptedUntil || null,
            lastReviewedBy: editing.lastReviewedBy ?? null,
            reviewHistory: [],
            status: editing.status ?? "active",
            risk: editing.risk ?? "low",
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const issue: KnownIssue = await res.json();
        setIssues((prev) => [issue, ...prev]);
      } else {
        const res = await fetch(`/api/known-issues/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        });
        if (!res.ok) throw new Error("Failed to update");
        const issue: KnownIssue = await res.json();
        setIssues((prev) => prev.map((i) => i.id === issue.id ? issue : i));
      }
      setEditing(null);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const markReviewed = async (id: string) => {
    if (saving) return;
    setSaving(true);
    const now = new Date().toISOString();
    const issue = issues.find((i) => i.id === id);
    if (!issue) { setSaving(false); return; }
    try {
      const res = await fetch(`/api/known-issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastReviewed: now,
          lastReviewedBy: engineer,
          reviewHistory: [...(issue.reviewHistory ?? []), { at: now, by: engineer }],
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: KnownIssue = await res.json();
      setIssues((prev) => prev.map((i) => i.id === id ? updated : i));
    } catch {
      setError("Failed to mark as reviewed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    if (saving) return;
    setSaving(true);
    const issue = issues.find((i) => i.id === id);
    if (!issue) { setSaving(false); return; }
    const newStatus = issue.status === "active" ? "retired" : "active";
    try {
      const res = await fetch(`/api/known-issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: KnownIssue = await res.json();
      setIssues((prev) => prev.map((i) => i.id === id ? updated : i));
    } catch {
      setError("Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const deleteIssue = async (id: string) => {
    if (!confirm("Delete this known issue?") || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/known-issues/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIssues((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to delete issue.");
    } finally {
      setSaving(false);
    }
  };

  const active = issues.filter((i) => i.status === "active");
  const retired = issues.filter((i) => i.status === "retired");
  const overdue = active.filter((i) => daysFromNow(i.acceptedUntil) < 0);
  const shown = filter === "active" ? active : filter === "retired" ? retired : issues;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e2e8f0" }}>Known Issues</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {active.length} active · {retired.length} retired
            {overdue.length > 0 && <span className="ml-2 font-medium" style={{ color: "#ef4444" }}>· {overdue.length} review overdue</span>}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary gap-1"><PlusIcon className="h-4 w-4" /> New issue</button>
      </div>

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          {error}
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid #1e293b" }}>
        {(["active", "retired", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px", fontSize: 14, fontWeight: 500,
              borderBottom: filter === f ? "2px solid #00b4b4" : "2px solid transparent",
              color: filter === f ? "#00b4b4" : "#64748b",
              background: "transparent", border: "none",
              borderBottomStyle: "solid", borderBottomWidth: 2,
              borderBottomColor: filter === f ? "#00b4b4" : "transparent",
              cursor: "pointer", transition: "color 0.15s",
              textTransform: "capitalize",
            }}
            onMouseEnter={(e) => { if (filter !== f) (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
            onMouseLeave={(e) => { if (filter !== f) (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
            {f === "all" ? "All" : f === "active" ? `Active (${active.length})` : `Retired (${retired.length})`}
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-12" style={{ color: "#64748b" }}>Loading...</p>
        ) : shown.length === 0 ? (
          <p className="text-center py-12" style={{ color: "#64748b" }}>No issues in this view.</p>
        ) : shown.map((issue) => {
          const days = daysFromNow(issue.acceptedUntil);
          const reviewDue = days < 0;
          const reviewSoon = days >= 0 && days <= 7;
          return (
            <div key={issue.id} className="card" style={reviewDue ? { borderColor: "rgba(239,68,68,0.3)" } : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" style={{ color: "#e2e8f0" }}>{issue.title}</span>
                    <StatusBadge status={issue.status} />
                    <RiskBadge risk={issue.risk} />
                    {reviewDue && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Review overdue</span>}
                    {reviewSoon && !reviewDue && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Review in {days}d</span>}
                  </div>
                  {issue.systems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.systems.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{issue.summary}</p>
                  {issue.workaroundUrl && (
                    <a href={issue.workaroundUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline mt-0.5 block" style={{ color: "#00b4b4" }}>
                      Workaround →
                    </a>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    Last reviewed: {issue.lastReviewedBy ? `${issue.lastReviewedBy} · ` : ""}{new Date(issue.lastReviewed).toLocaleDateString()}
                    {issue.acceptedUntil && ` · Review by: ${new Date(issue.acceptedUntil).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => markReviewed(issue.id)} title="Mark reviewed" className="btn-secondary px-2 py-1.5" disabled={saving}>
                    <CheckIcon className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(issue)} title="Edit" className="btn-secondary px-2 py-1.5" disabled={saving}>
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(issue.id)} title={issue.status === "active" ? "Retire" : "Re-activate"}
                    className="btn-secondary px-2 py-1.5 text-xs" disabled={saving}>
                    {issue.status === "active" ? "Retire" : "Activate"}
                  </button>
                  <button onClick={() => deleteIssue(issue.id)} title="Delete" className="btn-danger px-2 py-1.5" disabled={saving}>
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <h2 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>{isNew ? "New Known Issue" : "Edit Issue"}</h2>

            <div>
              <label className="label">Title *</label>
              <input className="input" value={editing.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, title: e.target.value }))} />
            </div>

            <div>
              <label className="label">Summary</label>
              <textarea className="input" rows={3} value={editing.summary ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, summary: e.target.value }))} />
            </div>

            <div>
              <label className="label">Systems affected</label>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "#e2e8f0" }}>
                    <input type="checkbox" className="accent-[#00b4b4]"
                      checked={(editing.systems ?? []).includes(s)}
                      onChange={(e) => {
                        const cur = editing.systems ?? [];
                        setEditing((p) => ({ ...p!, systems: e.target.checked ? [...cur, s] : cur.filter((x) => x !== s) }));
                      }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Risk</label>
                <select className="input" value={editing.risk ?? "low"} onChange={(e) => setEditing((p) => ({ ...p!, risk: e.target.value as "low" | "medium" | "high" }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={editing.status ?? "active"} onChange={(e) => setEditing((p) => ({ ...p!, status: e.target.value as "active" | "retired" }))}>
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Owner</label>
                <input className="input" value={editing.owner ?? "Infra"} onChange={(e) => setEditing((p) => ({ ...p!, owner: e.target.value }))} />
              </div>
              <div>
                <label className="label">Review by</label>
                <input type="date" className="input" value={editing.acceptedUntil ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, acceptedUntil: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label">Workaround URL</label>
              <input className="input" value={editing.workaroundUrl ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, workaroundUrl: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={commitEdit} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
