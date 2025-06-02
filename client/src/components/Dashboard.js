// components/Dashboard.js
import React from "react";

export default function Dashboard({ onSelectModule, onSignOut }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={onSignOut}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => onSelectModule("solarwinds")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          SolarWinds Checks
        </button>
        {/* Add more module buttons here if needed */}
      </div>
    </div>
  );
}


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
