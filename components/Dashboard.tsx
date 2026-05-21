"use client";

import React from "react";
import { ArrowRightIcon, CheckCircleIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import type { Screen } from "@/types";

interface DashboardProps {
  engineer: string;
  checkDate: string;
  completedToday: Set<string>;
  onSelectScreen: (s: Screen) => void;
}

const MODULES: { id: Screen; label: string; desc: string }[] = [
  { id: "solarwinds",  label: "SolarWinds",  desc: "Network monitoring alerts" },
  { id: "vsan",        label: "VMware vSAN",  desc: "Per-site virtualisation alerts" },
  { id: "veeam",       label: "Veeam",        desc: "Backup job status review" },
  { id: "checkpoint",  label: "Checkpoint",   desc: "Firewall alert review" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function formatCheckDate(raw: string): string {
  const d = new Date(raw + "T00:00:00");
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function Dashboard({ engineer, checkDate, completedToday, onSelectScreen }: DashboardProps) {
  const completedCount = MODULES.filter((m) => completedToday.has(m.id)).length;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f1a1a",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {getGreeting()}, {firstName(engineer)}.
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
          {formatCheckDate(checkDate)}
        </p>

        {/* Progress summary */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            padding: "8px 14px",
            borderRadius: 10,
            background: completedCount === 4
              ? "rgba(16,185,129,0.08)"
              : "rgba(245,158,11,0.08)",
            border: completedCount === 4
              ? "1.5px solid rgba(16,185,129,0.25)"
              : "1.5px solid rgba(245,158,11,0.25)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: completedCount === 4 ? "#059669" : "#d97706",
            }}
          >
            {completedCount === 4
              ? "All checks complete for today"
              : `${completedCount} of ${MODULES.length} checks complete`}
          </span>
        </div>
      </div>

      {/* Today's Checks */}
      <section style={{ marginBottom: 36 }}>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#008282",
            marginBottom: 16,
          }}
        >
          Today&apos;s Checks
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {MODULES.map(({ id, label, desc }) => {
            const done = completedToday.has(id);
            return (
              <button
                key={id}
                onClick={() => onSelectScreen(id)}
                style={{
                  textAlign: "left",
                  background: "white",
                  border: `1.5px solid ${done ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.2)"}`,
                  borderLeft: `4px solid ${done ? "#10b981" : "#f59e0b"}`,
                  borderRadius: 14,
                  padding: "18px 18px 16px",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1a1a", marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>{desc}</div>
                  </div>
                  {done && (
                    <CheckCircleIcon style={{ width: 18, height: 18, color: "#10b981", flexShrink: 0 }} />
                  )}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 9px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: done ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: done ? "#059669" : "#d97706",
                    }}
                  >
                    {done ? "Complete" : "Pending"}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#008282",
                    }}
                  >
                    {done ? "Open" : "Start Check"}
                    <ArrowRightIcon style={{ width: 13, height: 13 }} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Infrastructure section */}
      <section>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#008282",
            marginBottom: 16,
          }}
        >
          Infrastructure
        </h2>

        <button
          onClick={() => onSelectScreen("knownissues")}
          style={{
            textAlign: "left",
            background: "white",
            border: "1.5px solid rgba(0,130,130,0.12)",
            borderRadius: 14,
            padding: "18px 20px",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            maxWidth: 420,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,130,130,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,130,130,0.12)";
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(0,130,130,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpenIcon style={{ width: 20, height: 20, color: "#008282" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1a1a", marginBottom: 2 }}>
              Known Issues
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Tracked issues and workarounds</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#008282" }}>
            View catalog <ArrowRightIcon style={{ width: 13, height: 13 }} />
          </div>
        </button>
      </section>
    </div>
  );
}
