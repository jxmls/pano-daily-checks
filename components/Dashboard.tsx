"use client";

import { useState, useEffect } from "react";
import type { Screen, Submission } from "@/types";

interface Props {
  engineer: string;
  checkDate: string;
  completedToday: Set<string>;
  onSelectScreen: (s: Screen) => void;
}

const MODULES: { id: string; label: string }[] = [
  { id: "solarwinds", label: "SolarWinds"   },
  { id: "vsan",       label: "VMware vSAN"  },
  { id: "veeam",      label: "Veeam Backup" },
  { id: "checkpoint", label: "Checkpoint"   },
];

function StatusBadge({ done }: { done: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: done ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
      color: done ? "#22c55e" : "#f59e0b",
    }}>
      {done ? "COMPLETE" : "PENDING"}
    </span>
  );
}

function fmtTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}

export default function Dashboard({ engineer, checkDate, completedToday, onSelectScreen }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data: Submission[]) => setSubmissions(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Last checked per module
  const lastChecked = (id: string): string => {
    const s = submissions.find((s) => s.module === id);
    return s ? fmtTs(s.createdAt) : "—";
  };

  const MODULE_COLORS: Record<string, string> = {
    solarwinds: "#f97316", vsan: "#8b5cf6", veeam: "#00b4b4", checkpoint: "#14b8a6",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          {engineer} — {checkDate}
        </p>
      </div>

      {/* Status overview panel */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Module Status</div>
        <div className="card-flush">
          {MODULES.map(({ id, label }, idx) => {
            const done = completedToday.has(id);
            const isLast = idx === MODULES.length - 1;
            return (
              <div
                key={id}
                onClick={() => onSelectScreen(id as Screen)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 20px",
                  borderBottom: isLast ? "none" : "1px solid #1a2234",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Color dot */}
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: MODULE_COLORS[id] ?? "#64748b",
                }} />
                {/* Name */}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                  {label}
                </span>
                {/* Last checked */}
                <span style={{ fontSize: 12, color: "#64748b", minWidth: 140, textAlign: "right" }}>
                  {lastChecked(id)}
                </span>
                {/* Badge */}
                <StatusBadge done={done} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent submissions */}
      <div>
        <div className="section-title" style={{ marginBottom: 12 }}>Recent Submissions</div>
        <div className="card-flush">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Module", "Engineer", "Check Date", "Submitted", "Status"].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-td" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                    Loading...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                    No submissions yet.
                  </td>
                </tr>
              ) : submissions.map((s) => (
                <tr key={s.id}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td className="table-td">
                    <span style={{ fontSize: 12, fontWeight: 700, color: MODULE_COLORS[s.module] ?? "#64748b", textTransform: "capitalize" }}>
                      {s.module}
                    </span>
                  </td>
                  <td className="table-td" style={{ fontWeight: 600 }}>{s.engineer}</td>
                  <td className="table-td" style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{s.checkDate}</td>
                  <td className="table-td" style={{ fontSize: 12, color: "#64748b" }}>{fmtTs(s.createdAt)}</td>
                  <td className="table-td">
                    <span style={{
                      display: "inline-flex", alignItems: "center", padding: "2px 8px",
                      borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: s.passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: s.passed ? "#22c55e" : "#ef4444",
                    }}>
                      {s.passed ? "PASSED" : "ISSUES"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
