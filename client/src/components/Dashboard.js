import React from "react";

const modules = [
  { id: "solarwinds", title: "SolarWinds Checks" },
  // Add more modules as needed
];

export default function Dashboard({ onSelectModule, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full flex justify-between items-center mb-6 max-w-4xl">
        <img src="/panologo.png" alt="Panoptics logo" className="h-16" />
        <button
          onClick={onSignOut}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
        >
          Sign Out
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">Panoptics Infrastructure Dashboard</h1>

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
