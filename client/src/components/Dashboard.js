import React, { useEffect } from "react";

console.log("Dashboard loaded");

const modules = [
  {
    id: "solarwinds",
    title: "SolarWinds Checks",
    icon: (
      <img
        src={require("../assets/solarwinds-logo.png")}
        alt="SolarWinds Logo"
        className="h-6"
      />
    ),
  },
  {
    id: "vsan",
    title: "Vmware vSAN Checks",
    icon: (
      <img
        src={require("../assets/vmware-logo.png")}
        alt="VMware Logo"
        className="h-6 object-contain"
      />
    ),
  },
  {
    id: "veeam",
    title: "Veeam Backup Checks",
    icon: (
      <img
        src={require("../assets/veeam-logo.png")}
        alt="Veeam Logo"
        className="h-6 object-contain"
      />
    ),
  },
  {
    id: "checkpoint",
    title: "Checkpoint Checks",
    icon: (
      <img
        src={require("../assets/checkpoint-logo.png")}
        alt="Checkpoint Logo"
        className="h-6 object-contain"
      />
    ),
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
        />
      </svg>
    ),
  },
  {
    id: "Projects",
    title: "Project Board",
    icon: (
      <svg
        className="h-6 w-6 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2a4 4 0 014-4h4M7 7h10M7 11h10"
        />
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553 2.276a1 1 0 010 1.448L15 16M9 10L4.447 12.276a1 1 0 000 1.448L9 16"
        />
      </svg>
    ),
  },
];

export default function Dashboard({ onSelectModule, onSignOut }) {
  const engineerName = localStorage.getItem("engineerName") || "Engineer";

  useEffect(() => {
    const userTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (userTheme === "dark" || (!userTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-b from-slate-100 to-white dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 relative">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm px-3 py-1 rounded-md shadow hover:shadow-lg transition"
        title="Toggle light/dark mode"
      >
        🌓 Toggle Theme
      </button>

      {/* Welcome Message */}
      <h1 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-100 mb-6 tracking-tight">
        👋 Welcome to the <span className="text-blue-600 dark:text-blue-400">Infrastructure Hub</span>, {engineerName}!
      </h1>

      {/* Module Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-4xl mt-2">
        {modules.map(({ id, title, icon }) => (
          <button
            key={id}
            onClick={() => {
              const fullName =
                localStorage.getItem("engineerName") || "Unknown";
              const today =
                localStorage.getItem("checkDate") ||
                new Date().toISOString().split("T")[0];

              localStorage.setItem("engineerName", fullName);
              localStorage.setItem("checkDate", today);

              onSelectModule(id);
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-gray-700 dark:text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-sm font-medium text-gray-700 text-center p-2"
          >
            <div className="mb-1">{icon}</div>
            {title}
          </button>
        ))}
      </div>
    </div>
  );
}
