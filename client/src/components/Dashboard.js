import React from "react";

export default function Dashboard({ onSelectModule }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white border rounded shadow-lg p-6 w-64 text-center cursor-pointer hover:shadow-xl transition" onClick={() => onSelectModule("solarwinds")}>
        <h2 className="text-xl font-semibold">SolarWinds Checks</h2>
        <p className="text-sm text-gray-500 mt-2">Start daily SolarWinds monitoring checklist</p>
      </div>
    </div>
  );
}
