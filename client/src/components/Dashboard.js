import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const tiles = [
    { label: "SolarWinds Checks", route: "/solarwinds" },
    { label: "VMware vSAN", route: "#" },
    { label: "Backups", route: "#" },
    { label: "Security Logs", route: "#" },
    { label: "Updates", route: "#" },
    { label: "Network Checks", route: "#" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8">Panoptics Infrastructure Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile, index) => (
          <div
            key={index}
            onClick={() => {
              if (tile.route !== "#") navigate(tile.route);
            }}
            className="cursor-pointer bg-white border border-gray-300 rounded shadow-md hover:shadow-xl transition p-8 text-center w-64 h-32 flex items-center justify-center text-lg font-medium"
          >
            {tile.label}
          </div>
        ))}
      </div>
    </div>
  );
}
