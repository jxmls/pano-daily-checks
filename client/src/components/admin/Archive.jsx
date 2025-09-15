// src/components/admin/Archive.jsx
import React, { useState } from "react";
import { REQUIRED_MODULES, saveCompliance } from "../../lib/storage";
import { downloadCsv } from "../../lib/csv";
import { downloadPdf } from "../../lib/pdf";
import { dateKeyLocal, prettyLocal, dateKeyToStartTs } from "../../lib/dates";
import { monthBucketFromDateKey, quarterBucketFromDateKey } from "../../lib/agg";

/* ---------- small helpers ---------- */
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// ASCII-only range labels
const quarterSpan = { 1: "Jan-Mar", 2: "Apr-Jun", 3: "Jul-Sep", 4: "Oct-Dec" };

function prettyMonth(bucket) {
  const [y, m] = bucket.split("-").map(Number);
  return `${monthNames[(m || 1) - 1]} ${y}`;
}
function prettyQuarter(bucket) {
  const [y, qStr] = bucket.split("-Q");
  const q = Number(qStr || 1);
  return `${y} Q${q} (${quarterSpan[q] || ""})`;
}
// Format "YYYY-MM-DD" -> "17 Aug 2025" (ASCII friendly)
function prettyISO(iso) {
  if (!iso) return "…";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function SegButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs ${active ? "bg-gray-100" : "bg-white hover:bg-gray-50"} border-r last:border-r-0`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
function RowCard({ children }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border rounded-xl p-2">{children}</div>;
}
function ExportButtons({ onCsv, onPdf }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onCsv} className="text-xs border px-2.5 py-1 rounded-lg hover:bg-gray-50">CSV</button>
      <button onClick={onPdf} className="text-xs border px-2.5 py-1 rounded-lg hover:bg-gray-50">PDF</button>
    </div>
  );
}
function ArchiveGroupRow({ title, rows, onExportCsv, onExportPdf }) {
  return (
    <RowCard>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm font-medium">{title}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
          {rows.length} failed day(s)
        </span>
      </div>
      <ExportButtons onCsv={onExportCsv} onPdf={onExportPdf} />
    </RowCard>
  );
}

/* ---------- main component ---------- */
export default function Archive({
  submissions,
  compliance,
  setCompliance,
  archiveFrom,
  setArchiveFrom,
  archiveTo,
  setArchiveTo,
  jumpToDay,
}) {
  const [tab, setTab] = useState("days"); // "days" | "monthly" | "quarterly"

  function updateCompliance(dateKey, patch) {
    setCompliance((prev) => {
      const next = { ...prev, [dateKey]: { ...(prev[dateKey] || {}), ...patch, lastUpdated: new Date().toISOString() } };
      saveCompliance(next);
      return next;
    });
  }
  const toggleAck = (k) => updateCompliance(k, { acknowledged: !compliance[k]?.acknowledged });
  const addNote = (k) => {
    const cur = compliance[k]?.note || "";
    const note = window.prompt(`Note for ${k}`, cur);
    if (note !== null) updateCompliance(k, { note });
  };

  // Build failed days within range
  const fromTs = archiveFrom ? new Date(`${archiveFrom}T00:00:00`).getTime() : null;
  const toTs   = archiveTo   ? new Date(`${archiveTo}T23:59:59`).getTime()   : null;

  const map = new Map();
  const raw = new Map();
  for (const s of submissions) {
    const key = dateKeyLocal(s.createdAt);
    const mod = String(s.module || "").toLowerCase();
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(mod);
    if (!raw.has(key)) raw.set(key, []);
    raw.get(key).push(s);
  }

  const days = [];
  for (const [key, mods] of map.entries()) {
    const ts = dateKeyToStartTs(key);
    if (fromTs && ts < fromTs) continue;
    if (toTs && ts > toTs) continue;

    const missing = REQUIRED_MODULES.filter((m) => !mods.has(m));
    const submittedCount = mods.size;
    const items = raw.get(key) || [];
    const failed = missing.length > 0 && submittedCount > 0;
    if (!failed) continue;
    days.push({
      dateKey: key,
      submittedCount,
      missingModules: missing,
      items,
      ack: !!compliance[key]?.acknowledged,
      note: compliance[key]?.note || "",
    });
  }
  days.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

  const byMonth = Array.from(
    days.reduce((m, d) => {
      const k = monthBucketFromDateKey(d.dateKey);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
      return m;
    }, new Map())
  ).map(([bucket, rows]) => ({ bucket, rows }));

  const byQuarter = Array.from(
    days.reduce((m, d) => {
      const k = quarterBucketFromDateKey(d.dateKey);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
      return m;
    }, new Map())
  ).map(([bucket, rows]) => ({ bucket, rows }));

  /* ---------- export helpers ---------- */
  function rowsForCsv(rows, includeGroup = false, groupLabel = "") {
    return rows.map((r) => {
      const base = {
        date: r.dateKey,
        submitted: r.submittedCount,
        missingModules: r.missingModules.join("; "),
        acknowledged: r.ack ? "yes" : "no",
        note: r.note || "",
      };
      return includeGroup ? { ...base, group: groupLabel } : base;
    });
  }

  function exportDaysCsv(rows, fnamePrefix, includeGroup = false, groupLabel = "") {
    downloadCsv(
      `${fnamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`,
      rowsForCsv(rows, includeGroup, groupLabel)
    );
  }

  function exportDaysPdf(rows, title, filename, includeGroup = false, groupLabel = "", subnote = "") {
    const cols = includeGroup
      ? ["date", "submitted", "missingModules", "acknowledged", "group", "note"]
      : ["date", "submitted", "missingModules", "acknowledged", "note"];
    const data = rowsForCsv(rows, includeGroup, groupLabel);
    const subtitle = "Modules: Veeam · VMware vSAN · SolarWinds · Check Point";
    downloadPdf(title, cols, data, filename, { subtitle, subnote });
  }

  // Clean ASCII range label for the PDF header
  const rangeNote =
    archiveFrom || archiveTo
      ? `Range: ${prettyISO(archiveFrom)} to ${prettyISO(archiveTo)} (local)`
      : "";

  return (
    <section className="mb-4 bg-white border rounded-2xl p-3 md:p-4 shadow-sm">
      {/* compact toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">Compliance Archive</h3>
          <div className="flex rounded-lg overflow-hidden border text-gray-700">
            <SegButton active={tab === "days"} onClick={() => setTab("days")}>Failed days</SegButton>
            <SegButton active={tab === "monthly"} onClick={() => setTab("monthly")}>Monthly</SegButton>
            <SegButton active={tab === "quarterly"} onClick={() => setTab("quarterly")}>Quarterly</SegButton>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            value={archiveFrom}
            onChange={(e) => setArchiveFrom(e.target.value)}
            className="border rounded-lg p-1.5 text-xs"
          />
          <label className="text-xs text-gray-500 ml-1">To</label>
          <input
            type="date"
            value={archiveTo}
            onChange={(e) => setArchiveTo(e.target.value)}
            className="border rounded-lg p-1.5 text-xs"
          />
          <button
            className="border rounded-lg px-2 py-1 text-xs"
            onClick={() => {
              setArchiveFrom("");
              setArchiveTo("");
            }}
            title="Clear date range"
          >
            Clear
          </button>

          {tab === "days" && (
            <ExportButtons
              onCsv={() => exportDaysCsv(days, "failed_days_filtered")}
              onPdf={() =>
                exportDaysPdf(
                  days,
                  "Daily Checks Compliance — Failed days (filtered)",
                  `failed_days_${new Date().toISOString().slice(0, 10)}.pdf`,
                  false,
                  "",
                  rangeNote // show selected calendar range
                )
              }
            />
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-500 mb-3">
        Quarterly uses <strong>calendar quarters</strong>: Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec.
      </p>

      {tab === "days" && (
        <div className="flex flex-col gap-2">
          {days.map((s) => (
            <RowCard key={s.dateKey}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm font-medium">{prettyLocal(s.dateKey)}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {s.submittedCount} / {REQUIRED_MODULES.length} submitted
                </span>
                {s.ack && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    Acknowledged
                  </span>
                )}
                <div className="flex flex-wrap gap-1">
                  {s.missingModules.map((m) => (
                    <span
                      key={m}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700"
                    >
                      Missing: {m}
                    </span>
                  ))}
                </div>
                {s.note && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Note: {s.note.length > 40 ? s.note.slice(0, 40) + "…" : s.note}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAck(s.dateKey)}
                  className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  {s.ack ? "Unacknowledge" : "Acknowledge"}
                </button>
                <button
                  onClick={() => addNote(s.dateKey)}
                  className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  Note
                </button>
                <button
                  onClick={() => jumpToDay(s.dateKey)}
                  className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  View day
                </button>
              </div>
            </RowCard>
          ))}
          {days.length === 0 && (
            <div className="text-sm text-gray-500 px-2 py-3">
              No failed days within the selected dates.
            </div>
          )}
        </div>
      )}

      {tab === "monthly" && (
        <div className="flex flex-col gap-2">
          {byMonth.map((group) => (
            <ArchiveGroupRow
              key={group.bucket}
              title={prettyMonth(group.bucket)}
              rows={group.rows}
              onExportCsv={() =>
                downloadCsv(
                  `report_month_${group.bucket}_${new Date().toISOString().slice(0, 10)}.csv`,
                  rowsForCsv(group.rows, true, prettyMonth(group.bucket))
                )
              }
              onExportPdf={() =>
                exportDaysPdf(
                  group.rows,
                  `Daily Checks Compliance — Monthly: ${prettyMonth(group.bucket)}`,
                  `report_month_${group.bucket}.pdf`,
                  true,
                  prettyMonth(group.bucket)
                )
              }
            />
          ))}
          {byMonth.length === 0 && (
            <div className="text-sm text-gray-500 px-2 py-3">No monthly failures in range.</div>
          )}
        </div>
      )}

      {tab === "quarterly" && (
        <div className="flex flex-col gap-2">
          {byQuarter.map((group) => (
            <ArchiveGroupRow
              key={group.bucket}
              title={prettyQuarter(group.bucket)}
              rows={group.rows}
              onExportCsv={() =>
                downloadCsv(
                  `report_quarter_${group.bucket}_${new Date().toISOString().slice(0, 10)}.csv`,
                  rowsForCsv(group.rows, true, prettyQuarter(group.bucket))
                )
              }
              onExportPdf={() =>
                exportDaysPdf(
                  group.rows,
                  `Daily Checks Compliance — Quarterly: ${prettyQuarter(group.bucket)}`,
                  `report_quarter_${group.bucket}.pdf`,
                  true,
                  prettyQuarter(group.bucket)
                )
              }
            />
          ))}
          {byQuarter.length === 0 && (
            <div className="text-sm text-gray-500 px-2 py-3">No quarterly failures in range.</div>
          )}
        </div>
      )}
    </section>
  );
}
