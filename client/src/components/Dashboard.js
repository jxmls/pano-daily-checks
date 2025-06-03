import React from "react";

const modules = [
  { id: "solarwinds", title: "SolarWinds Checks" },
  { id: "vsan", title: "vSAN Health" },
  { id: "veeam", title: "Veeam Backup Status" },
  { id: "network", title: "Network Alerts" },
  { id: "intune", title: "Intune Compliance" },
  { id: "custom", title: "Custom Checks" },
];

export default function Dashboard({ onSelectModule, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-white">
      {/* Sign Out button top-left */}
      <div className="w-full flex justify-between items-center mb-4 max-w-6xl">
        <button
          onClick={onSignOut}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Logo + Header */}
      <div className="w-full max-w-6xl mb-6 flex flex-col items-center">
        <img src="/panologo.png" alt="Panoptics logo" className="h-20 mb-4" />
        <h1 className="text-3xl font-bold text-center">
          Panoptics Infrastructure Dashboard
        </h1>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
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
