import React from "react";

export default function Header({
  showHome,
  showSignOut,
  onBackToDashboard,
  onSignOut,
  engineer
}) {
  const initials = engineer
    ? engineer
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

 return (
  <div className="w-full bg-white border-b shadow-sm px-6 py-3 relative">
    {/* ✅ Avatar in top-right corner */}
    {engineer && (
      <div className="absolute top-4 right-6 z-50">
        <div
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white"
          title={engineer}
        >
          {initials}
        </div>
      </div>
    )}

    {/* Logo + Buttons */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
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
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  </div>
);

}
