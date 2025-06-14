import React from "react";

const modules = [
  { id: "solarwinds", title: "SolarWinds Checks" },
  { id: "vsan", title: "Vmware vSAN Checks" },
  { id: "veeam", title: "Veeam Backup Checks" },
  { id: "checkpoint", title: "Checkpoint Checks" },
  { id: "KnownIssues", title: "Known Issues" },
  { id: "Projects", title: "Project Board" },
  { id: "Snapshots", title: "Active Snapshots" }
];

export default function Dashboard({ onSelectModule, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-6">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onSelectModule(mod.id)}
            className="aspect-square bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-150 border border-gray-200 flex items-center justify-center text-lg font-medium text-gray-800"
          >
            {mod.title}
          </button>
        ))}
      </div>
    </div>
  );
}
