import React from "react";
console.log("Dashboard loaded")
const modules = [
  { id: "solarwinds", title: "SolarWinds Checks" },
  { id: "vsan", title: "Vmware vSAN Checks" },
  { id: "veeam", title: "Veeam Backup Checks" },
  { id: "checkpoint", title: "Checkpoint Checks" },
  { id: "KnownIssues", title: "Known Issues" },
  { id: "Projects", title: "Project Board" },
  { id: "Snapshots", title: "Active Snapshots" },
];

export default function Dashboard({ onSelectModule, onSignOut }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 bg-white">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-6xl mt-4">
        {modules.map((mod) => (
          <button
  key={mod.id}
  onClick={() => {
    const fullName = "Jose Lucar"; // You can replace with dynamic user name if needed
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    localStorage.setItem("engineerName", fullName);
    localStorage.setItem("checkDate", today);

    onSelectModule(mod.id);
  }}
  className="w-32 h-32 bg-white rounded-lg shadow hover:shadow-md transition duration-150 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-800 text-center p-2"
>
  {mod.title}
</button>

        ))}
      </div>
    </div>
  );
}
