import React, { useMemo } from "react";

// ✅ Import images explicitly
import solarwindsLogo from "../assets/solarwinds-logo.png";
import vmwareLogo from "../assets/vmware-logo.png";
import veeamLogo from "../assets/veeam-logo.png";
import checkpointLogo from "../assets/checkpoint-logo.png";

console.log("Dashboard loaded");

// ---------- Helper: Known Issues stats from localStorage ----------
function useKnownIssuesStats() {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("pano.knownIssues.v1");
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) return { active: 0, due: 0, retired: 0, showBadge: false };

      const now = new Date();
      const active = items.filter(i => i.status === "active");
      const retired = items.filter(i => i.status === "retired");
      const due = active.filter(i => i.acceptedUntil && new Date(i.acceptedUntil) < now);

      return {
        active: active.length,
        due: due.length,
        retired: retired.length,
        showBadge: due.length > 0,
      };
    } catch {
      return { active: 0, due: 0, retired: 0, showBadge: false };
    }
  }, []);
}

// ---------- Tile metadata ----------
const modules = [
  {
    id: "solarwinds",
    title: "SolarWinds Checks",
    icon: <img src={solarwindsLogo} alt="SolarWinds Logo" className="h-6" />,
  },
  {
    id: "vsan",
    title: "Vmware vSAN Checks",
    icon: <img src={vmwareLogo} alt="VMware Logo" className="h-6 object-contain" />,
  },
  {
    id: "veeam",
    title: "Veeam Backup Checks",
    icon: <img src={veeamLogo} alt="Veeam Logo" className="h-6 object-contain" />,
  },
  {
    id: "checkpoint",
    title: "Checkpoint Checks",
    icon: <img src={checkpointLogo} alt="Checkpoint Logo" className="h-6 object-contain" />,
  },
  {
    id: "KnownIssues",
    title: "Known Issues",
    icon: (
      <svg
        className="h-6 w-6 text-yellow-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  },
  {
    id: "projectboard",
    title: "Project Board",
    icon: (
      <svg
        className="h-6 w-6 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17v-2a4 4 0 014-4h4M7 7h10M7 11h10" />
      </svg>
    ),
  },
  {
    id: "Snapshots",
    title: "Active Snapshots",
    icon: (
      <svg
        className="h-6 w-6 text-purple-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 10l4.553 2.276a1 1 0 010 1.448L15 16M9 10L4.447 12.276a1 1 0 000 1.448L9 16" />
      </svg>
    ),
  },
];

export default function Dashboard({ onSelectModule }) {
  const engineerName = localStorage.getItem("engineerName") || "Engineer";
  const ki = useKnownIssuesStats();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-b from-gray-100 via-white to-white text-gray-800">
      {/* Welcome Message */}
      <h1 className="text-2xl font-bold text-center text-gray-700 mb-2 tracking-tight">
        👋 Welcome to the <span className="text-blue-600">Infrastructure Hub</span>, {engineerName}!
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 mb-6">
        Select a module below to begin your daily checks.
      </p>

      {/* Module Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-4xl mt-2">
        {modules.map(({ id, title, icon }) => {
          const isKnownIssues = id === "KnownIssues";
          return (
            <button
              key={id}
              onClick={() => {
                const fullName = localStorage.getItem("engineerName") || "Unknown";
                const today = localStorage.getItem("checkDate") || new Date().toISOString().split("T")[0];
                localStorage.setItem("engineerName", fullName);
                localStorage.setItem("checkDate", today);
                onSelectModule(id);
              }}
              className="relative w-24 sm:w-28 md:w-32 h-24 sm:h-28 bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 ease-in-out border border-gray-200 flex flex-col items-center justify-center text-sm font-semibold text-gray-700 text-center p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {/* Badge for Known Issues if any are due review */}
              {isKnownIssues && ki.showBadge && (
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded bg-red-100 text-red-700">
                  Review due
                </span>
              )}

              <div className="mb-1 flex items-center justify-center w-8 h-8">{icon}</div>
              <div>{title}</div>

              {/* Tiny stats line under the title for Known Issues */}
              {isKnownIssues && (
                <div className="mt-1 text-[10px] leading-tight text-gray-500">
                  A:{ki.active} • D:{ki.due} • R:{ki.retired}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
