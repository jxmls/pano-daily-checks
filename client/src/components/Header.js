import React from "react";

export default function Header({ showHome, showSignOut, onBackToDashboard, onSignOut, engineer }) {
  const initials = engineer
    ? engineer
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="w-full bg-white border-b shadow-sm flex items-center justify-between px-6 py-3">
      {/* Left: Logo */}
      <div className="flex items-center space-x-4">
        <img src="/panologo.png" alt="Panoptics logo" className="h-16" />
      </div>

      {/* Right: Avatar + Buttons */}
      <div className="flex items-center gap-4">
        {engineer && (
          <div
            className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-semibold"
            title={engineer}
          >
            {initials}
          </div>
        )}
        {showHome && (
          <button
            onClick={onBackToDashboard}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
          >
            Home
          </button>
        )}
        {showSignOut && (
          <button
            onClick={onSignOut}
            className="bg-red-600 text-white hover:bg-red-700 text-sm px-4 py-2 rounded"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
