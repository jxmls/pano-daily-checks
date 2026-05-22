"use client";

import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { Submission } from "@/types";
import { KpiCard, StatusPill, PageHeader } from "@/components/ui";

const MODULES = ["solarwinds", "vsan", "veeam", "checkpoint"];

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  solarwinds: { bg: "rgba(251,146,60,0.12)", color: "#ea580c" },
  vsan:       { bg: "rgba(139,92,246,0.12)", color: "#7c3aed" },
  veeam:      { bg: "rgba(0,130,130,0.12)",  color: "#008282" },
  checkpoint: { bg: "rgba(20,184,166,0.12)", color: "#0d9488" },
};

function ModulePill({ module }: { module: string }) {
  const s = MODULE_COLORS[module] ?? { bg: "rgba(107,114,128,0.12)", color: "#6b7280" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize"
      style={{ background: s.bg, color: s.color }}>
      {module}
    </span>
  );
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

export default function AdminPortal() {
  const [all, setAll] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inspect, setInspect] = useState<Submission | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/submissions")
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then((data: Submission[]) => setAll(data))
      .catch(() => setError("Could not load submissions. Check your database connection."))
      .finally(() => setLoading(false));
  }, []);

  const engineers = useMemo(() =>
    Array.from(new Set(all.map((s) => s.engineer).filter(Boolean))).sort(), [all]);

  const filtered = useMemo(() => {
    let r = all;
    if (moduleFilter !== "all") r = r.filter((s) => s.module === moduleFilter);
    if (engineerFilter !== "all") r = r.filter((s) => s.engineer === engineerFilter);
    if (from) r = r.filter((s) => s.createdAt >= from);
    if (to)   r = r.filter((s) => s.createdAt <= to + "T23:59:59");
    if (search) r = r.filter((s) =>
      s.engineer.toLowerCase().includes(search.toLowerCase()) ||
      s.module.toLowerCase().includes(search.toLowerCase()) ||
      s.checkDate.includes(search));
    return r;
  }, [all, moduleFilter, engineerFilter, from, to, search]);

  const pages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAll = all.filter((s) => s.createdAt.startsWith(todayStr));
  const todayPassed = todayAll.filter((s) => s.passed);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Admin Portal"
        subtitle="Submission history and daily compliance"
      />

      {error && (
        <p className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          {error}
        </p>
      )}

      {/* Today's module completion */}
      <div>
        <p className="label mb-3">Today&apos;s checks</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MODULES.map((m) => {
            const done = todayAll.some((s) => s.module === m);
            return (
              <div key={m} className="stat-card"
                style={done
                  ? { borderColor: "rgba(0,180,180,0.3)", background: "rgba(0,180,180,0.04)" }
                  : { borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.03)" }}>
                <div className="flex items-center justify-between">
                  <ModulePill module={m} />
                  <span className="text-xs font-black" style={{ color: done ? "#22c55e" : "#f59e0b" }}>
                    {done ? "+" : "—"}
                  </span>
                </div>
                <p className="text-sm font-bold mt-2" style={{ color: done ? "#22c55e" : "#f59e0b" }}>
                  {done ? "Complete" : "Pending"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Today's submissions" value={todayAll.length} accent />
        <KpiCard label="Passed today" value={todayPassed.length}
          sub={todayAll.length > 0 ? `${Math.round(todayPassed.length / todayAll.length * 100)}% pass rate` : undefined} />
        <KpiCard label="All time" value={all.length} sub="stored in database" />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="label">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4" style={{ color: "#64748b" }} />
              <input className="input pl-9" placeholder="Engineer, module, date…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div>
            <label className="label">Module</label>
            <select className="input" value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
              <option value="all">All modules</option>
              {MODULES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Engineer</label>
            <select className="input" value={engineerFilter}
              onChange={(e) => { setEngineerFilter(e.target.value); setPage(1); }}>
              <option value="all">All engineers</option>
              {engineers.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-flush">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {["Module", "Engineer", "Check Date", "Submitted", "Status", ""].map((h) => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-td py-16 text-center font-medium" style={{ color: "#64748b" }}>
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td py-16 text-center font-medium"
                  style={{ color: "#64748b" }}>
                  No submissions found.
                </td>
              </tr>
            ) : paged.map((s) => (
              <tr key={s.id}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                style={{ transition: "background 0.1s" }}>
                <td className="table-td"><ModulePill module={s.module} /></td>
                <td className="table-td font-semibold" style={{ color: "#e2e8f0" }}>{s.engineer}</td>
                <td className="table-td font-mono text-xs" style={{ color: "#64748b" }}>{s.checkDate}</td>
                <td className="table-td text-xs" style={{ color: "#64748b" }}>{fmtDate(s.createdAt)}</td>
                <td className="table-td">
                  <StatusPill label={s.passed ? "Passed" : "Issues"} />
                </td>
                <td className="table-td">
                  <button onClick={() => setInspect(s)}
                    className="text-xs font-bold transition-colors"
                    style={{ color: "#00b4b4", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#00cccc")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#00b4b4")}>
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "#64748b" }}>
            {filtered.length} results · page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-30">← Prev</button>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      {/* Inspect modal */}
      {inspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInspect(null)} />
          <div className="relative w-full max-w-2xl rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #1e293b", background: "rgba(0,180,180,0.05)" }}>
              <div className="flex items-center gap-3">
                <ModulePill module={inspect.module} />
                <span className="font-bold" style={{ color: "#e2e8f0" }}>{inspect.engineer}</span>
              </div>
              <button onClick={() => setInspect(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-lg font-bold"
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                x
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Check date", inspect.checkDate],
                  ["Submitted", fmtDate(inspect.createdAt)],
                  ["Status", inspect.passed ? "Passed" : "Issues found"],
                  ["Module", inspect.module],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="label mb-0.5">{k}</p>
                    <p className="font-semibold" style={{ color: "#e2e8f0" }}>{v}</p>
                  </div>
                ))}
              </div>
              <details className="mt-4 group">
                <summary className="cursor-pointer text-sm font-bold select-none" style={{ color: "#00b4b4" }}>
                  Raw payload
                </summary>
                <pre className="mt-3 rounded-lg p-4 text-xs overflow-x-auto font-mono"
                  style={{ background: "#0a0f1e", border: "1px solid #1e293b", color: "#e2e8f0" }}>
                  {JSON.stringify(inspect.payload, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
