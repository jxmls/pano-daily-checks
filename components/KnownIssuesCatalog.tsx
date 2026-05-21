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
  const cls = risk === "high" ? "bg-red-100 text-red-700" : risk === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{risk}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return status === "active"
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Retired</span>;
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
          <h1 className="text-xl font-bold text-gray-800">Known Issues</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} active · {retired.length} retired
            {overdue.length > 0 && <span className="ml-2 text-red-600 font-medium">· {overdue.length} review overdue</span>}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary gap-1"><PlusIcon className="h-4 w-4" /> New issue</button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["active", "retired", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${filter === f ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {f === "all" ? "All" : f === "active" ? `Active (${active.length})` : `Retired (${retired.length})`}
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No issues in this view.</p>
        ) : shown.map((issue) => {
          const days = daysFromNow(issue.acceptedUntil);
          const reviewDue = days < 0;
          const reviewSoon = days >= 0 && days <= 7;
          return (
            <div key={issue.id} className={`card ${reviewDue ? "border-red-300 bg-red-50/40" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{issue.title}</span>
                    <StatusBadge status={issue.status} />
                    <RiskBadge risk={issue.risk} />
                    {reviewDue && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Review overdue</span>}
                    {reviewSoon && !reviewDue && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Review in {days}d</span>}
                  </div>
                  {issue.systems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.systems.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{issue.summary}</p>
                  {issue.workaroundUrl && (
                    <a href={issue.workaroundUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block">
                      Workaround →
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
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
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">{isNew ? "New Known Issue" : "Edit Issue"}</h2>

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
                  <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-blue-600"
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
