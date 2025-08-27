import React, { useEffect, useMemo, useState } from "react";

/* -------------------------
   Storage helpers (local)
------------------------- */
const SUBMISSIONS_KEY = "pano.submissions.v1";
const REQUIRED_MODULES = ["veeam", "vsan", "solarwinds", "checkpoint"];

function loadSubmissions() {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveAll(subs) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs || []));
}

/* -------------------------
   Utilities
------------------------- */
function toCsv(rows) {
  if (!rows?.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replaceAll(`"`, `""`).replaceAll(/\n/g, " ")}"`;
  return [cols.map(esc).join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
}
function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function startOfLocalDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfLocalDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function dateKeyLocal(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth()+1).padStart(2,"0");
  const dd = String(x.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
function prettyLocal(dateStr) {
  const d = new Date(dateStr + "T12:00:00"); // avoid TZ edge cases
  return d.toLocaleDateString();
}
function submissionHasAlerts(s) {
  if (!s) return false;
  if (s.passed === false) return true;
  const p = s.payload || {};
  const yes = (v) => String(v || "").toLowerCase() === "yes";
  const anyYes = yes(p.alertsGenerated) || yes(p.localAlertsGenerated);
  const anyRows = (Array.isArray(p.alerts) ? p.alerts.length : 0) + (Array.isArray(p.localAlerts) ? p.localAlerts.length : 0) > 0;
  return anyYes || anyRows;
}

/* -------------------------
   Component
------------------------- */
export default function AdminPortal({ onBackToDashboard }) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inspect, setInspect] = useState(null);
  const [page, setPage] = useState(1);
  const [quick, setQuick] = useState(null); // null | "today" | "todayNoAlerts" | "todayAlerts"
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  useEffect(() => setAll(loadSubmissions()), []);

  // today circles
  const today = new Date();
  const todayStart = startOfLocalDay(today).getTime();
  const todayEnd = endOfLocalDay(today).getTime();
  const todayItems = useMemo(
    () => all.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= todayStart && t <= todayEnd;
    }),
    [all, todayStart, todayEnd]
  );
  const todayWithAlerts = useMemo(() => todayItems.filter(submissionHasAlerts), [todayItems]);
  const todayNoAlerts = useMemo(() => todayItems.filter((s) => !submissionHasAlerts(s)), [todayItems]);

  // dropdown sources
  const engineers = useMemo(
    () => Array.from(new Set(all.map((s) => s.engineer).filter(Boolean))).sort(),
    [all]
  );
  const modules = useMemo(
    () => Array.from(new Set(all.map((s) => s.module).filter(Boolean))).sort(),
    [all]
  );

  // record-level filtered list (for the table)
  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs   = to   ? new Date(to   + "T23:59:59").getTime() : null;

    return all.filter((s) => {
      const t = new Date(s.createdAt).getTime();

      // quick filters
      if (quick === "today" || quick === "todayNoAlerts" || quick === "todayAlerts") {
        if (t < todayStart || t > todayEnd) return false;
        if (quick === "todayNoAlerts" && submissionHasAlerts(s)) return false;
        if (quick === "todayAlerts" && !submissionHasAlerts(s)) return false;
      } else {
        if (fromTs && t < fromTs) return false;
        if (toTs && t > toTs) return false;
      }

      if (moduleFilter !== "all" && s.module !== moduleFilter) return false;
      if (engineerFilter !== "all" && s.engineer !== engineerFilter) return false;

      if (q) {
        const hay = `${s.engineer || ""} ${s.module || ""} ${(s.meta?.clients || []).join(" ")} ${JSON.stringify(s.payload || {})}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, q, moduleFilter, engineerFilter, from, to, quick, todayStart, todayEnd]);

  // day-based aggregation for pass/fail (ignore moduleFilter so we evaluate completeness)
  const filteredForDays = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs   = to   ? new Date(to   + "T23:59:59").getTime() : null;
    return all.filter((s) => {
      const t = new Date(s.createdAt).getTime();

      if (quick === "today" || quick === "todayNoAlerts" || quick === "todayAlerts") {
        if (t < todayStart || t > todayEnd) return false;
        if (quick === "todayNoAlerts" && submissionHasAlerts(s)) return false;
        if (quick === "todayAlerts" && !submissionHasAlerts(s)) return false;
      } else {
        if (fromTs && t < fromTs) return false;
        if (toTs && t > toTs) return false;
      }

      if (engineerFilter !== "all" && s.engineer !== engineerFilter) return false;

      if (q) {
        const hay = `${s.engineer || ""} ${s.module || ""} ${(s.meta?.clients || []).join(" ")} ${JSON.stringify(s.payload || {})}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, q, engineerFilter, from, to, quick, todayStart, todayEnd]);

  const dayAgg = useMemo(() => {
    // map: dateKey -> Set(modules), raw list
    const map = new Map();
    const raw = new Map(); // dateKey -> submissions[]
    for (const s of filteredForDays) {
      const key = dateKeyLocal(s.createdAt);
      const mod = String(s.module || "").toLowerCase();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(mod);

      if (!raw.has(key)) raw.set(key, []);
      raw.get(key).push(s);
    }

    const summaries = [];
    let passDays = 0, failDays = 0;

    for (const [key, mods] of map.entries()) {
      const missing = REQUIRED_MODULES.filter((m) => !mods.has(m));
      const submittedCount = mods.size;
      const items = raw.get(key) || [];
      const passed = missing.length === 0 && submittedCount > 0;
      const failed = missing.length > 0 && submittedCount > 0; // ignore days with zero submissions entirely
      if (passed) passDays++;
      if (failed) failDays++;

      summaries.push({
        dateKey: key,
        submittedCount,
        missingModules: missing,
        items,
        passed,
        failed,
      });
    }

    summaries.sort((a,b) => (a.dateKey < b.dateKey ? 1 : -1)); // newest first
    const passRate = (passDays + failDays) ? Math.round((passDays / (passDays + failDays)) * 100) : 0;

    return { summaries, passDays, failDays, passRate };
  }, [filteredForDays]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function exportCsv() {
    const rows = filtered.map((s) => ({
      id: s.id,
      module: s.module,
      engineer: s.engineer,
      createdAt: s.createdAt,
      passed: s.passed,
      clients: Array.isArray(s.meta?.clients) ? s.meta.clients.join("; ") : "",
      notes: s.meta?.notes || "",
    }));
    download(`submissions_${new Date().toISOString().slice(0,10)}.csv`, toCsv(rows));
  }

  function seedDemo() {
    const now = new Date();
    const mk = (offsetDays, set) => set.map((mod, i) => ({
      id: `${Math.random().toString(36).slice(2,10)}-${i}`,
      module: mod,
      engineer: localStorage.getItem("engineerName") || "Engineer",
      createdAt: new Date(now.getTime() - offsetDays*86400000).toISOString(),
      passed: true,
      meta: { clients: ["Clarion"], notes: "Demo" },
      payload: { sample: true }
    }));
    // Day 0: all 4 (pass), Day 1: 3 mods (fail), Day 2: 1 mod (fail)
    const demo = [
      ...mk(0, ["veeam", "vsan", "solarwinds", "checkpoint"]),
      ...mk(1, ["veeam", "vsan", "solarwinds"]),
      ...mk(2, ["checkpoint"]),
    ];
    const merged = [...demo, ...all];
    setAll(merged);
    saveAll(merged);
  }

  function applyQuick(mode) {
    setQuick(mode);
    setPage(1);
    const iso = (d) => d.toISOString().slice(0,10);
    setFrom(iso(startOfLocalDay(new Date())));
    setTo(iso(endOfLocalDay(new Date())));
  }
  function clearQuick() {
    setQuick(null);
    setPage(1);
  }

  // jump to a specific day (sets From/To to that day, clears quick)
  function jumpToDay(dayKey) {
    setQuick(null);
    setFrom(dayKey);
    setTo(dayKey);
    setPage(1);
    // scroll to table (nice UX)
    setTimeout(() => {
      const el = document.getElementById("submissions-table");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // chips for compact toolbar
  const chips = [
    moduleFilter === "all" ? "Module: All" : `Module: ${moduleFilter}`,
    engineerFilter === "all" ? "Engineer: All" : `Engineer: ${engineerFilter}`,
    from || to ? `Date: ${from || "…"} → ${to || "…"}` : "Date: Any",
    q ? `Search: “${q}”` : "Search: –",
  ];

  return (
    <div className="min-h-screen w-full mx-auto max-w-6xl p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">Admin Portal</h1>
        <div className="flex items-center gap-2">
          {quick && (
            <button onClick={clearQuick} className="text-xs px-3 py-1 rounded-full border bg-white">
              Clear quick filter
            </button>
          )}
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} className="border px-3 py-2 rounded-lg">
              ⬅ Back
            </button>
          )}
          <button onClick={exportCsv} className="border px-3 py-2 rounded-lg">
            ⭳ Export CSV
          </button>
        </div>
      </header>

      {/* TODAY — Circle stats */}
      <section className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CircleCard label="Submitted today" value={todayItems.length} active={quick === "today"} onClick={() => applyQuick("today")} />
          <CircleCard label="No alerts (today)" value={todayNoAlerts.length} active={quick === "todayNoAlerts"} onClick={() => applyQuick("todayNoAlerts")} />
          <CircleCard label="With alerts (today)" value={todayWithAlerts.length} active={quick === "todayAlerts"} onClick={() => applyQuick("todayAlerts")} />
        </div>
      </section>

      {/* Compact filter toolbar */}
      <section className="mb-3">
        <div className="flex items-center justify-between bg-white border rounded-2xl p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span key={i} className="text-xs bg-gray-100 border rounded-full px-2 py-1">{c}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {all.length === 0 && (
              <button onClick={seedDemo} className="border px-3 py-2 rounded-lg text-sm">➕ Seed demo</button>
            )}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="border px-3 py-2 rounded-lg text-sm"
            >
              {showFilters ? "Hide filters" : "Filters"}
            </button>
          </div>
        </div>

        {/* Collapsible full filters */}
        {showFilters && (
          <div className="mt-2 bg-white border rounded-2xl p-3 md:p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Module</label>
                <select value={moduleFilter} onChange={(e)=>{setPage(1); setModuleFilter(e.target.value);}} className="w-full border rounded-lg p-2">
                  <option value="all">All</option>
                  {modules.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Engineer</label>
                <select value={engineerFilter} onChange={(e)=>{setPage(1); setEngineerFilter(e.target.value);}} className="w-full border rounded-lg p-2">
                  <option value="all">All</option>
                  {engineers.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input type="date" value={from} onChange={(e)=>{setPage(1); setFrom(e.target.value);}} className="w-full border rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input type="date" value={to} onChange={(e)=>{setPage(1); setTo(e.target.value);}} className="w-full border rounded-lg p-2"/>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Search</label>
                <input value={q} onChange={(e)=>{setPage(1); setQ(e.target.value);}} placeholder="client, detail, json…" className="w-full border rounded-lg p-2"/>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* KPIs (day-based pass/fail) */}
      <section className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total submissions" value={filtered.length}/>
          <KpiCard label="Pass rate (days)" value={`${dayAgg.passRate}%`}/>
          <KpiCard label="Days passed" value={dayAgg.passDays}/>
          <KpiCard label="Days failed" value={dayAgg.failDays}/>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          A “passed” day has submissions for all modules: {REQUIRED_MODULES.join(", ")}.
        </p>
      </section>

      {/* ✨ Daily compliance summary (failed days + missing modules) */}
      {dayAgg.summaries.some(s => s.failed) && (
        <section className="mb-4 bg-white border rounded-2xl p-3 md:p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <span>⚠️</span>
            <h3 className="font-semibold">Daily compliance summary</h3>
            <span className="text-xs text-gray-500">(days within current filters that are missing modules)</span>
          </div>

          <div className="flex flex-col gap-2">
            {dayAgg.summaries.filter(s => s.failed).map((s) => (
              <div key={s.dateKey} className="flex flex-wrap items-center justify-between gap-2 border rounded-xl p-2">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">{prettyLocal(s.dateKey)}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    {s.submittedCount} / {REQUIRED_MODULES.length} submitted
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {s.missingModules.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Missing: {m}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => jumpToDay(s.dateKey)}
                  className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  View day
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Submissions table */}
      <section id="submissions-table" className="bg-white border rounded-2xl shadow-sm">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-700">Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <Th>Created</Th>
                <Th>Module</Th>
                <Th>Engineer</Th>
                <Th>Clients</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td>{new Date(s.createdAt).toLocaleString()}</Td>
                  <Td className="capitalize">{s.module}</Td>
                  <Td>{s.engineer || "-"}</Td>
                  <Td>{Array.isArray(s.meta?.clients) ? s.meta.clients.join(", ") : "-"}</Td>
                  <Td>
                    {s.passed ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Pass</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Fail</span>
                    )}
                  </Td>
                  <Td>
                    <button onClick={() => setInspect(s)} className="text-blue-600 hover:underline">
                      {s.pdf?.dataUrl ? "View PDF" : "View"}
                    </button>
                  </Td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 p-6">
                    {all.length === 0 ? "Use 'Seed demo' above to create some test rows." : "No submissions match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-gray-500">
            Showing {(page-1)*pageSize + 1}-{Math.min(page*pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button className="border rounded-md px-2 py-1 text-sm disabled:opacity-40" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <button className="border rounded-md px-2 py-1 text-sm disabled:opacity-40" onClick={()=>setPage((p)=> (p*pageSize < filtered.length ? p+1 : p))} disabled={page*pageSize >= filtered.length}>Next</button>
          </div>
        </div>
      </section>

      {/* Drawer: PDF first, fallback to JSON */}
      {inspect && (
        <div className="fixed inset-0 bg-black/30 flex">
          <div className="ml-auto h-full w-full max-w-3xl bg-white shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div>
                <h3 className="font-semibold">Submission Details</h3>
                <p className="text-xs text-gray-500">
                  {inspect.module} • {new Date(inspect.createdAt).toLocaleString()} • {inspect.engineer}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inspect.pdf?.dataUrl && (
                  <a
                    href={inspect.pdf.dataUrl}
                    download={inspect.pdf.name || "submission.pdf"}
                    className="border px-3 py-1.5 rounded-lg text-sm"
                  >
                    Download PDF
                  </a>
                )}
                <button onClick={()=>setInspect(null)} className="p-1 rounded hover:bg-gray-100">✕</button>
              </div>
            </div>

            {inspect.pdf?.dataUrl ? (
              <div className="grow border rounded-lg overflow-hidden bg-gray-50">
                <iframe title="Submission PDF" src={inspect.pdf.dataUrl} className="w-full h-full" style={{ minHeight: "70vh" }}/>
              </div>
            ) : (
              <div className="text-xs bg-gray-50 rounded-lg border p-3 overflow-auto grow">
                <pre className="whitespace-pre-wrap">{JSON.stringify(inspect, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------
   Small UI helpers
------------------------- */
function KpiCard({ label, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        <span>📊</span> <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
function CircleCard({ label, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm transition ${active ? "ring-2 ring-blue-400" : "hover:shadow-md"}`}
      title={label}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full border-2">
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="text-left">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Today</div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
      </div>
    </button>
  );
}
function Th({ children }) { return <th className="text-left text-xs font-semibold tracking-wide px-4 py-2">{children}</th>; }
function Td({ children, className="" }) { return <td className={`px-4 py-2 text-gray-800 ${className}`}>{children}</td>; }
