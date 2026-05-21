"use client";

import React, { useState } from "react";
import {
  Squares2X2Icon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { Screen, SessionUser } from "@/types";

interface SidebarProps {
  user: SessionUser;
  screen: Screen;
  onSelectScreen: (s: Screen) => void;
  onSignOut: () => void;
  completedToday: Set<string>;
}

const DAILY_CHECKS: { id: Screen; label: string }[] = [
  { id: "solarwinds",  label: "SolarWinds"  },
  { id: "vsan",        label: "VMware vSAN" },
  { id: "veeam",       label: "Veeam"       },
  { id: "checkpoint",  label: "Checkpoint"  },
];

const TOOLS: { id: Screen; label: string }[] = [
  { id: "knownissues", label: "Known Issues" },
  { id: "admin",       label: "Admin"        },
];

function userInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(raw: string): string {
  const d = new Date(raw + "T00:00:00");
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function Sidebar({ user, screen, onSelectScreen, onSignOut, completedToday }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [to, setTo] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("checklist.to") ?? "" : ""));
  const [cc, setCc] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("checklist.cc") ?? "" : ""));
  const [bcc, setBcc] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("checklist.bcc") ?? "" : ""));

  const saveSettings = () => {
    localStorage.setItem("checklist.to", to);
    localStorage.setItem("checklist.cc", cc);
    localStorage.setItem("checklist.bcc", bcc);
    setSettingsOpen(false);
  };

  const navItemStyle = (id: string): React.CSSProperties => {
    const active = screen === id;
    return {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderRadius: 8,
      cursor: "pointer",
      border: "none",
      width: "100%",
      textAlign: "left",
      fontSize: 13,
      fontWeight: 600,
      transition: "all 0.15s",
      background: active ? "rgba(0,130,130,0.15)" : "transparent",
      borderLeft: active ? "2px solid #008282" : "2px solid transparent",
      color: active ? "white" : "rgba(255,255,255,0.5)",
      marginBottom: 2,
    };
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          background: "#001e1e",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          overflowY: "hidden",
        }}
      >
        {/* Logo section */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img
              src="/panologo.png"
              alt="Panoptics"
              style={{ height: 24, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.9 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ color: "white", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>
              Infrastructure Hub
            </span>
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 5,
              background: "rgba(0,130,130,0.35)",
              color: "#5ccfcf",
              marginLeft: 34,
            }}
          >
            Daily Checks
          </span>
        </div>

        {/* Nav section */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {/* Dashboard */}
          <button
            style={navItemStyle("dashboard")}
            onClick={() => onSelectScreen("dashboard")}
            onMouseEnter={(e) => { if (screen !== "dashboard") (e.currentTarget as HTMLElement).style.color = "white"; }}
            onMouseLeave={(e) => { if (screen !== "dashboard") (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            <Squares2X2Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
            Dashboard
          </button>

          {/* Daily Checks section */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#5ccfcf",
              padding: "12px 12px 6px",
            }}
          >
            Daily Checks
          </div>

          {DAILY_CHECKS.map(({ id, label }) => (
            <button
              key={id}
              style={navItemStyle(id)}
              onClick={() => onSelectScreen(id)}
              onMouseEnter={(e) => { if (screen !== id) (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={(e) => { if (screen !== id) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            >
              {/* Status dot */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: completedToday.has(id) ? "#10b981" : "rgba(255,255,255,0.2)",
                  boxShadow: completedToday.has(id) ? "0 0 6px rgba(16,185,129,0.6)" : "none",
                  transition: "all 0.2s",
                }}
              />
              {label}
            </button>
          ))}

          {/* Tools section */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#5ccfcf",
              padding: "12px 12px 6px",
            }}
          >
            Tools
          </div>

          {TOOLS.map(({ id, label }) => (
            <button
              key={id}
              style={navItemStyle(id)}
              onClick={() => onSelectScreen(id)}
              onMouseEnter={(e) => { if (screen !== id) (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={(e) => { if (screen !== id) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            >
              {id === "knownissues"
                ? <BookOpenIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                : <ShieldCheckIcon style={{ width: 16, height: 16, flexShrink: 0 }} />}
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(0,130,130,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#008282",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "white",
                flexShrink: 0,
                boxShadow: "0 0 0 2px rgba(0,130,130,0.4)",
              }}
            >
              {userInitials(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ color: "#5ccfcf", fontSize: 10, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatDate(user.checkDate)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px 0",
                borderRadius: 7,
                border: "1.5px solid rgba(0,130,130,0.3)",
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "white";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,130,130,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,130,130,0.3)";
              }}
            >
              <Cog6ToothIcon style={{ width: 14, height: 14 }} />
              Settings
            </button>

            <button
              onClick={onSignOut}
              title="Sign out"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "6px 0",
                borderRadius: 7,
                border: "1.5px solid rgba(239,68,68,0.25)",
                background: "transparent",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fca5a5";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)";
              }}
            >
              <ArrowRightOnRectangleIcon style={{ width: 14, height: 14 }} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {settingsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              boxShadow: "0 25px 80px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 480,
              padding: "28px 32px",
              margin: "0 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f1a1a", margin: 0 }}>Email Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20, marginTop: -8 }}>
              Configure email recipients for form submissions.
            </p>

            {[
              { label: "To", value: to, onChange: setTo, placeholder: "recipient@example.com" },
              { label: "CC", value: cc, onChange: setCc, placeholder: "cc@example.com" },
              { label: "BCC", value: bcc, onChange: setBcc, placeholder: "bcc@example.com" },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 6 }}>
                  {label}
                </label>
                <input
                  className="input"
                  type="email"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setSettingsOpen(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
