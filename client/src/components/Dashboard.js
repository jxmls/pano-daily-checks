// components/Dashboard.js
import React from "react";

export default function Dashboard({ onSelectModule }) {
  const modules = [
    { id: "solarwinds", title: "SolarWinds Checks" },
    { id: "vsan", title: "VMware vSAN Checks" },
    { id: "backups", title: "Backup Verification" },
    { id: "security", title: "Security Events" },
    { id: "patches", title: "Patching Summary" },
    { id: "custom", title: "Custom Notes" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <img src="/panologo.png" alt="Panoptics logo" className="h-24 mb-6" />
      <h1 className="text-3xl font-bold mb-8">Panoptics Infrastructure Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onSelectModule(mod.id)}
            className="p-6 bg-white rounded shadow hover:bg-blue-50 border border-gray-200 text-center text-lg font-medium"
          >
            {mod.title}
          </button>
        ))}
      </div>
    </div>
  );
}
