import React, { useEffect, useMemo, useState } from "react";
import {
  loadSubmissions,
  loadCompliance,
  saveCompliance,
  saveAll,
  fetchAllFromServer,        // ← NEW
  REQUIRED_MODULES,
} from "../lib/storage";
import { startOfLocalDay, endOfLocalDay, toISODate } from "../lib/dates";
import {
  submissionHasAlerts,
  filterSubmissions,
  computeDayAgg,
} from "../lib/agg";
import { downloadCsv } from "../lib/csv";

import KpiCard from "./admin/KpiCard";
import CircleCard from "./admin/CircleCard";
import ComplianceSummary from "./admin/ComplianceSummary";
import Archive from "./admin/Archive";
import SubmissionsTable from "./admin/SubmissionsTable";

export default function AdminPortal({ onBackToDashboard }) {
  const [all, setAll] = useState([]);
  const [compliance, setCompliance] = useState({});
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [inspect, setInspect] = useState(null);
  const [page, setPage] = useState(1);
  const [quick, setQuick] = useState(null); // today | todayNoAlerts | todayAlerts | null
  const [showFilters, setShowFilters] = useState(false);
  const [hideAck, setHideAck] = useState(true);

  const [showArchive, setShowArchive] = useState(false);
  const [archiveFrom, setArchiveFrom] = useState("");
  const [archiveTo, setArchiveTo] = useState("");

  const [loading, setLoading] = useState(true);  // ← NEW

  const pageSize = 10;

  // Load submissions: try API first, fall back to local
  useEffect(() => {
    (async () => {
      try {
        const serverRows = await fetchAllFromServer(); // GET /api/all
        if (Array.isArray(serverRows) && serverRows.length) {
          setAll(serverRows);
          try { saveAll(serverRows); } catch {}
        } else {
          setAll(loadSubmissions());
        }
      } catch {
        setAll(loadSubmissions());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load compliance notes/acks from local
  useEffect(() => setCompliance(loadCompliance()), []);

  // today tiles
  const today = new Date();
  const todayStart = startOfLocalDay(today).getTime();
  const todayEnd = endOfLocalDay(today).getTime();

  const todayItems = useMemo(
    () =>
      all.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= todayStart && t <= todayEnd;
      }),
    [all, todayStart, todayEnd]
  );
  const todayWithAlerts = useMemo(
    () => todayItems.filter(submissionHasAlerts),
    [todayItems]
  );
  const todayNoAlerts = useMemo(
    () => todayItems.filter((s) => !submissionHasAlerts(s)),
    [todayItems]
  );

  // dropdown sources
  const engineers = useMemo(
    () => Array.from(new Set(all.map((s) => s.engineer).filter(Boolean))).sort(),
    [all]
  );
  const modules = useMemo(
    () => Array.from(new Set(all.map((s) => s.module).filter(Boolean))).sort(),
    [all]
  );

  // filtered for table
  const filtered = useMemo(
    () =>
      filterSubmissions(all, {
        moduleFilter,
        engineerFilter,
        from,
        to,
        q,
        quick,
        todayStart,
        todayEnd,
        excludeModule: false,
      }),
    [all, moduleFilter, engineerFilter, from, to, q, quick, todayStart, todayEnd]
  );

  // filtered for day agg (ignore module filter so completeness is evaluated)
  const filteredForDays = useMemo(
    () =>
      filterSubmissions(all, {
        moduleFilter,
        engineerFilter,
        from,
        to,
        q,
        quick,
        todayStart,
        todayEnd,
        excludeModule: true,
      }),
    [all, moduleFilter, engineerFilter, from, to, q, quick, todayStart, todayEnd]
  );

  const dayAgg = useMemo(
    () => computeDayAgg(filteredForDays, compliance),
    [filteredForDays, compliance]
  );
  const summaryRows = useMemo(
    () =>
      dayAgg.summaries
        .filter((s) => s.failed)
        .filter((s) => (hideAck ? !s.ack : true)),
    [dayAgg.summaries, hideAck]
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function exportSummaryView() {
    const rows = summaryRows.map((r) => ({
      date: r.dateKey,
      submitted: r.submittedCount,
      missingModules: r.missingModules.join("; "),
      acknowledged: r.ack ? "yes" : "no",
      note: r.note || "",
    }));
    downloadCsv(`daily_compliance_view_${toISODate(new Date())}.csv`, rows);
  }

  // quick filters (toggle + clear)
  function applyQuick(mode) {
    if (quick === mode) {
      clearQuick();
      return;
    }
    setQuick(mode);
    setPage(1);
    setFrom(toISODate(startOfLocalDay(new Date())));
    setTo(toISODate(endOfLocalDay(new Date())));
  }
  function clearQuick() {
    setQuick(null);
    setFrom("");
    setTo("");
    setPage(1);
  }

  function jumpToDay(dayKey) {
    setQuick(null);
    setFrom(dayKey);
    setTo(dayKey);
    setPage(1);
    setTimeout(() => {
      const el = document.getElementById("submissions-table");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // When clicking "View day" from Archive: apply day filter, close archive, and scroll to summary
  function jumpToDayFromArchive(dayKey) {
    setQuick(null);
    setFrom(dayKey);
    setTo(dayKey);
    setPage(1);
    setShowArchive(false);
    setTimeout(() => {
      const el = document.getElementById("compliance-summary");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // compliance helpers
  function updateCompliance(dateKey, patch) {
    setCompliance((prev) => {
      const next = {
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          ...patch,
          lastUpdated: new Date().toISOString(),
        },
      };
      saveCompliance(next);
      return next;
    });
  }
  const toggleAck = (k) =>
    updateCompliance(k, { acknowledged: !compliance[k]?.acknowledged });
  const addNote = (k) => {
    const cur = compliance[k]?.note || "";
    const note = window.prompt(`Note for ${k}`, cur);
    if (note !== null) updateCompliance(k, { note });
  };

  // chips for toolbar
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">
          Admin Portal
        </h1>
        <div className="flex items-center gap-2">
          {quick && (
            <button
              onClick={clearQuick}
              className="text-xs px-3 py-1 rounded-full border bg-white"
            >
              Clear quick filter
            </button>
          )}
          {showArchive && (
            <button
              onClick={() => setShowArchive(false)}
              className="border px-3 py-2 rounded-lg"
            >
              ← Back to summary
            </button>
          )}
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="border px-3 py-2 rounded-lg"
            >
              ⬅ Back
            </button>
          )}
        </div>
      </header>

      {!showArchive && (
        <>
          {/* Today tiles */}
          <section className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CircleCard
                label="Submitted today"
                value={todayItems.length}
                active={quick === "today"}
                onClick={() => applyQuick("today")}
              />
              <CircleCard
                label="No alerts (today)"
                value={todayNoAlerts.length}
                active={quick === "todayNoAlerts"}
                onClick={() => applyQuick("todayNoAlerts")}
              />
              <CircleCard
                label="With alerts (today)"
                value={todayWithAlerts.length}
                active={quick === "todayAlerts"}
                onClick={() => applyQuick("todayAlerts")}
              />
            </div>
          </section>

          {/* Compact filter toolbar */}
          <section className="mb-3">
            <div className="flex items-center justify-between bg-white border rounded-2xl p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 border rounded-full px-2 py-1"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">
                  Hide acknowledged
                </label>
                <input
                  type="checkbox"
                  className="ml-1"
                  checked={hideAck}
                  onChange={(e) => setHideAck(e.target.checked)}
                />
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="border px-3 py-2 rounded-lg text-sm"
                >
                  {showFilters ? "Hide filters" : "Filters"}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-2 bg-white border rounded-2xl p-3 md:p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Module
                    </label>
                    <select
                      value={moduleFilter}
                      onChange={(e) => {
                        setPage(1);
                        setModuleFilter(e.target.value);
                      }}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="all">All</option>
                      {modules.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Engineer
                    </label>
                    <select
                      value={engineerFilter}
                      onChange={(e) => {
                        setPage(1);
                        setEngineerFilter(e.target.value);
                      }}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="all">All</option>
                      {engineers.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        setPage(1);
                        setFrom(e.target.value);
                      }}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => {
                        setPage(1);
                        setTo(e.target.value);
                      }}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Search
                    </label>
                    <input
                      value={q}
                      onChange={(e) => {
                        setPage(1);
                        setQ(e.target.value);
                      }}
                      placeholder="client, detail, json…"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* KPIs */}
          <section className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total submissions" value={filtered.length} />
              <KpiCard label="Pass rate (days)" value={`${dayAgg.passRate}%`} />
              <KpiCard label="Days passed" value={dayAgg.passDays} />
              <KpiCard label="Days failed" value={dayAgg.failDays} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A “passed” day has submissions for all modules:{" "}
              {REQUIRED_MODULES.join(", ")}.
            </p>
          </section>

          {/* Daily compliance summary */}
          <div id="compliance-summary">
            <ComplianceSummary
              rows={summaryRows}
              quick={quick}
              from={from}
              to={to}
              clearQuick={clearQuick}
              onArchive={() => setShowArchive(true)}
              onExport={exportSummaryView}
              jumpToDay={jumpToDay}
              toggleAck={toggleAck}
              addNote={addNote}
            />
          </div>

          {/* Loading hint (small) */}
          {loading && (
            <div className="text-xs text-gray-500 mb-2">Loading data…</div>
          )}

          <SubmissionsTable
            paged={paged}
            filteredCount={filtered.length}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setInspect={setInspect}
          />
        </>
      )}

      {/* Archive */}
      {showArchive && (
        <Archive
          submissions={all}
          compliance={compliance}
          setCompliance={setCompliance}
          archiveFrom={archiveFrom}
          setArchiveFrom={setArchiveFrom}
          archiveTo={archiveTo}
          setArchiveTo={setArchiveTo}
          jumpToDay={jumpToDayFromArchive}
        />
      )}

      {/* Drawer */}
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
                <button
                  onClick={() => setInspect(null)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {inspect.pdf?.dataUrl ? (
              <div className="grow border rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  title="Submission PDF"
                  src={inspect.pdf.dataUrl}
                  className="w-full h-full"
                  style={{ minHeight: "70vh" }}
                />
              </div>
            ) : (
              <div className="text-xs bg-gray-50 rounded-lg border p-3 overflow-auto grow">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(inspect, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
