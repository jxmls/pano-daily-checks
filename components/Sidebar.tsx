"use client";

import { useState } from "react";
import {
  LayoutDashboard, ChevronDown, Activity, Server, HardDrive,
  ShieldCheck, BookOpen, LayoutGrid, Settings, Cog, X,
} from "lucide-react";
import type { Screen, SessionUser } from "@/types";

interface Props {
  user: SessionUser;
  screen: Screen;
  onSelectScreen: (s: Screen) => void;
  completedToday: Set<string>;
}

const TOOLS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: "knownissues",  label: "Known Issues",  icon: <BookOpen  size={15} /> },
  { id: "projectboard", label: "Project Board", icon: <LayoutGrid size={15} /> },
  { id: "admin",        label: "Admin Portal",  icon: <Settings  size={15} /> },
];

const CHECKS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: "solarwinds", label: "SolarWinds",   icon: <Activity   size={14} /> },
  { id: "vsan",       label: "VMware vSAN",  icon: <Server     size={14} /> },
  { id: "veeam",      label: "Veeam Backup", icon: <HardDrive  size={14} /> },
  { id: "checkpoint", label: "Checkpoint",   icon: <ShieldCheck size={14} /> },
];

// Settings modal state lives here
interface EmailSettings { to: string; cc: string; bcc: string; }
function loadEmail(): EmailSettings {
  if (typeof window === "undefined") return { to: "", cc: "", bcc: "" };
  return {
    to:  localStorage.getItem("checklist.to")  ?? "",
    cc:  localStorage.getItem("checklist.cc")  ?? "",
    bcc: localStorage.getItem("checklist.bcc") ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Sidebar({ user, screen, onSelectScreen, completedToday }: Props) {
  const [checksOpen, setChecksOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [email, setEmail] = useState<EmailSettings>(loadEmail);
  const [saved, setSaved] = useState(false);

  const saveEmail = () => {
    localStorage.setItem("checklist.to",  email.to);
    localStorage.setItem("checklist.cc",  email.cc);
    localStorage.setItem("checklist.bcc", email.bcc);
    setSaved(true);
    setTimeout(() => { setSaved(false); setSettingsOpen(false); }, 900);
  };

  const isActive = (id: string) => screen === id;

  const navItem = (id: Screen, label: string, icon: React.ReactNode, indent = false) => {
    const active = isActive(id);
    return (
      <button
        key={id}
        onClick={() => onSelectScreen(id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: indent ? "7px 12px 7px 36px" : "8px 12px",
          borderRadius: 6,
          border: "none",
          borderLeft: active ? "2px solid #00b4b4" : "2px solid transparent",
          background: active ? "rgba(0,180,180,0.08)" : "transparent",
          color: active ? "#00b4b4" : "#64748b",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
          marginBottom: 2,
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
      >
        <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {indent && (
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: completedToday.has(id) ? "#22c55e" : "#f59e0b",
            boxShadow: completedToday.has(id) ? "0 0 6px rgba(34,197,94,0.5)" : "none",
          }} />
        )}
      </button>
    );
  };

  return (
    <>
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 240,
        background: "#0a0f1e",
        borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e293b" }}>
          <img src="/panologo.png" alt="Panoptics"
            style={{ height: 22, filter: "brightness(0) invert(1)", opacity: 0.85, marginBottom: 6 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
            Infrastructure Hub
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
            Daily Checks
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>

          {/* Dashboard */}
          {navItem("dashboard", "Dashboard", <LayoutDashboard size={15} />)}

          <div style={{ margin: "8px 0 4px" }}>
            {/* Daily Checks accordion header */}
            <button
              onClick={() => setChecksOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "7px 12px",
                borderRadius: 6, border: "none",
                background: "transparent",
                color: "#64748b", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: "pointer", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
            >
              <span style={{ flex: 1, textAlign: "left" }}>Daily Checks</span>
              <ChevronDown size={13} style={{
                transition: "transform 0.2s",
                transform: checksOpen ? "rotate(0deg)" : "rotate(-90deg)",
              }} />
            </button>

            {checksOpen && (
              <div style={{ marginTop: 2 }}>
                {CHECKS.map(({ id, label, icon }) => navItem(id, label, icon, true))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: "#1e293b", margin: "8px 4px" }} />

          {/* Tools */}
          <div style={{ marginTop: 4 }}>
            {TOOLS.map(({ id, label, icon }) => navItem(id, label, icon))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #1e293b" }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "8px 12px",
              borderRadius: 6, border: "none",
              background: "transparent",
              color: "#64748b", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
          >
            <Cog size={15} />
            Email Settings
          </button>
        </div>
      </aside>

      {/* Settings modal */}
      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, width: "100%", maxWidth: 460, padding: "28px 32px", margin: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Email Settings</h2>
              <button onClick={() => setSettingsOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            {(["to", "cc", "bcc"] as const).map((f) => (
              <div key={f} style={{ marginBottom: 14 }}>
                <label className="label">{f.toUpperCase()}</label>
                <input className="input" type="email" value={email[f]}
                  onChange={(e) => setEmail((p) => ({ ...p, [f]: e.target.value }))}
                  placeholder={f === "to" ? "recipient@example.com" : "optional"} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setSettingsOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={saveEmail} className="btn-primary" style={{ flex: 1 }}>{saved ? "Saved" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
