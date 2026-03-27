"use client";

import type { Screen, SessionUser } from "@/types";

const NAV_ITEMS: { id: Screen; label: string }[] = [
  { id: "solarwinds",  label: "SolarWinds"  },
  { id: "vsan",        label: "VMware vSAN" },
  { id: "veeam",       label: "Veeam"       },
  { id: "checkpoint",  label: "Checkpoint"  },
  { id: "knownissues", label: "Known Issues"},
  { id: "admin",       label: "Admin"       },
];

interface HeaderProps {
  user: SessionUser | null;
  screen: Screen;
  onSelectScreen: (s: Screen) => void;
  onSignOut?: () => void;
}

export default function Header({ user, screen, onSelectScreen, onSignOut }: HeaderProps) {
  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  return (
    <header className="sticky top-0 z-30 w-full" style={{ background: "#001e1e" }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 h-[52px] flex items-center justify-between gap-4">

        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/panologo.png"
            alt="Panoptics"
            className="h-6 w-auto object-contain brightness-0 invert opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight leading-none">
              Infrastructure Hub
            </span>
            <span
              className="hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase"
              style={{ background: "rgba(0,130,130,0.35)", color: "#5ccfcf" }}
            >
              Daily Checks
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden md:flex flex-col items-end leading-none gap-0.5">
                <span className="text-white text-xs font-semibold">{user.name}</span>
                <span className="text-[11px]" style={{ color: "#5ccfcf" }}>{user.checkDate}</span>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{ background: "#008282", color: "white", boxShadow: "0 0 0 2px #004444" }}
                title={user.name}
              >
                {initials}
              </div>
            </>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs px-3.5 py-1.5 rounded-lg font-bold tracking-tight transition-all"
              style={{
                border: "1.5px solid rgba(0,130,130,0.5)",
                color: "#7dd8d8",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,130,130,0.2)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#7dd8d8";
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* ── Nav tabs ─────────────────────────────────────────── */}
      {user && (
        <div style={{ borderTop: "1px solid rgba(0,130,130,0.2)" }}>
          <nav className="max-w-7xl mx-auto px-5 flex overflow-x-auto"
            style={{ scrollbarWidth: "none" }}>
            {NAV_ITEMS.map(({ id, label }) => {
              const active = screen === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectScreen(id)}
                  className="relative whitespace-nowrap px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-150"
                  style={{
                    color: active ? "white" : "rgba(255,255,255,0.45)",
                    background: "transparent",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                  }}
                >
                  {label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-[2.5px] rounded-t-full"
                      style={{ background: "#008282" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
