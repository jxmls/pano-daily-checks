"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import type { SessionUser } from "@/types";

interface Props {
  user: SessionUser;
  onSignOut: () => void;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function TopBar({ user, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 240, right: 0, height: 52, zIndex: 30,
      background: "#0a0f1e",
      borderBottom: "1px solid #1e293b",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
    }}>
      {/* Left: app name */}
      <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
        Panoptics Infrastructure Hub
      </span>

      {/* Centre: date */}
      <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        {formatDate()}
      </span>

      {/* Right: user dropdown */}
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "none", cursor: "pointer",
            padding: "6px 10px", borderRadius: 8,
            color: "#e2e8f0", fontSize: 13, fontWeight: 500,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#00b4b4", color: "#0a0f1e",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>
            {initials(user.name)}
          </div>
          <span>{user.name}</span>
          <ChevronDown size={13} style={{ color: "#64748b", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#111827", border: "1px solid #1e293b",
            borderRadius: 10, minWidth: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            overflow: "hidden", zIndex: 50,
          }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{user.checkDate}</div>
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px",
                background: "transparent", border: "none",
                color: "#ef4444", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
