import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import useDailyCheckForm from "./useDailyCheckForm";

export default function SolarWindsForm({ onBackToDashboard }) {
  const [submitted, setSubmitted] = useState(false);

  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    selectAll,
    handleSubmit
  } = useDailyCheckForm();

  console.log("🚨 formData in SolarWindsForm:", formData);

  useEffect(() => {
  const storedEngineer = localStorage.getItem("engineerName") || "";
  const storedDate = localStorage.getItem("checkDate") || "";

  handleChange(null, "engineer", storedEngineer);
  handleChange(null, "date", storedDate);

  if (
    formData?.solarwinds?.alerts &&
    formData.solarwinds.alerts.length === 0
  ) {
    addAlertRow();
  }
}, []);


  const handleFinalSubmit = () => {
    toast((t) => (
      <div className="text-center">
        <p className="mb-2 font-semibold">Are you sure you're ready to submit?</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleSubmit();
              setSubmitted(true);
              toast.success("✅ Submission successful!");
              setTimeout(() => onBackToDashboard(), 2000);
            }}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 px-3 py-1 rounded text-sm"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4 text-center">SolarWinds Checks</h1>

        <p className="text-gray-600 mb-4">
          This is a daily checklist to check and address any alerts flagged in:
          <ul className="list-disc list-inside mt-2">
            <li>SolarWinds</li>
            <li>VMware vSAN</li>
          </ul>
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">SolarWinds</h2>
        <p className="text-gray-600 mb-2">
          Access via VPN or RDS:
          <a
            href="https://panglsw01"
            className="text-blue-500 underline ml-1"
            target="_blank"
            rel="noreferrer"
          >
            https://panglsw01
          </a>
        </p>
        <ul className="list-decimal list-inside text-sm text-gray-500 mb-4">
          <li>Login to SolarWinds Server.</li>
          <li>Open <strong>SolarWinds Platform Service Manager</strong>.</li>
          <li>Ensure all services are running.</li>
        </ul>

        <div className="mb-4">
          <label className="block font-medium mb-1">
            Are SolarWinds services running?
          </label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="servicesRunning"
                value="yes"
                onChange={() =>
                  handleChange("solarwinds", "servicesRunning", "yes")
                }
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="servicesRunning"
                value="no"
                onChange={() =>
                  handleChange("solarwinds", "servicesRunning", "no")
                }
              />
              No
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Clients</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.solarwinds.client || "Multiple"}
            onChange={(e) =>
              handleChange("solarwinds", "client", e.target.value)
            }
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Alert Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.solarwinds.alertType || ""}
            onChange={(e) =>
              handleChange("solarwinds", "alertType", e.target.value)
            }
          >
            <option value="">Select type</option>
            <option value="Warning">Warning</option>
            <option value="Serious">Serious</option>
            <option value="Critical">Critical</option>
            <option value="Warning & Serious">Warning & Serious</option>
            <option value="Warning and Critical">Warning and Critical</option>
            <option value="Serious and Critical">Serious and Critical</option>
            <option value="Warning Serious & Critical">
              Warning Serious & Critical
            </option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Alert Information</label>
          <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="border px-3 py-2">Alert Name</th>
                <th className="border px-3 py-2">Details</th>
                <th className="border px-3 py-2">Trigger Time</th>
                <th className="border px-3 py-2">Ticket</th>
                <th className="border px-3 py-2">Notes</th>
                <th className="border px-3 py-2 text-center">🎫</th>
              </tr>
            </thead>
            <tbody>
              {formData.solarwinds.alerts.map((alert, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!alert.selected}
                      onChange={() => toggleRowSelection(index)}
                    />
                  </td>
                  {["name", "details", "time", "ticket", "notes"].map((field) => (
                    <td key={field} className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert[field] || ""}
                        onChange={(e) => handleAlertChange(index, field, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="border px-3 py-2 text-center">
                    {alert.selected && alert.name && alert.details && (
                      <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const subject = encodeURIComponent(`SolarWinds Alert: ${alert.name}`);
                          const body = encodeURIComponent(
                            `Client: ${formData.solarwinds.client || "Multiple"}\n` +
                            `Alert Name: ${alert.name}\nDetails: ${alert.details}\n` +
                            `Trigger Time: ${alert.time}\nAssign to: ${formData.engineer || "Unknown"}\nNotes: ${alert.notes}`
                          );
                          window.location.href = `mailto:yourticketing@email.com?subject=${subject}&body=${body}`;
                        }}
                      >
                        🎫
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-4">
            <button
              onClick={addAlertRow}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded"
            >
              ➕ Add Row
            </button>
            <button
              onClick={deleteSelectedRows}
              className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded"
            >
              🗑️ Delete Selected
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={onBackToDashboard}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={handleFinalSubmit}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
