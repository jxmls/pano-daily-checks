import React from "react";
import useDailyCheckForm from "./useDailyCheckForm";
import React, { useState } from "react"; // update import

  

export default function SolarWindsForm({ onBackToDashboard }) {
  const [submitted, setSubmitted] = useState(false); // success message control

  const {
    step,
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    selectAll,
    next,
    prev,
    handleSubmit
  } = useDailyCheckForm();

 const handleFinalSubmit = () => {
  handleSubmit();
  setSubmitted(true);
  setTimeout(() => {
    onBackToDashboard(); // redirect after delay
  }, 2000);
};
f
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 relative">
      {/* Home Button */}
      <button
        onClick={onBackToDashboard}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
      >
        Home
      </button>

      <div className="flex justify-center mb-4">
        <img src="/panologo.png" alt="Panoptics logo" className="h-20" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-center">Daily Infrastructure Check</h1>
      {submitted && (
        <p className="text-green-600 text-center font-semibold mb-4">
          ✅ Submission successful! Redirecting to dashboard...
        </p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            This is a daily checklist to check and address any alerts flagged in the following monitoring tools:
            <ul className="list-disc list-inside mt-2">
              <li>SolarWinds</li>
              <li>VMware vSAN</li>
            </ul>
          </p>

          <div className="flex gap-4 mt-4">
            <button
              onClick={onBackToDashboard}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              Back
            </button>
            <button
              onClick={next}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">SolarWinds</h2>
          <p className="text-gray-600">
            SolarWinds can be accessed from your laptop using Always On VPN or via Panoptics RDS. Navigate to:
            <a
              href="https://panglsw01"
              className="text-blue-500 underline ml-1"
              target="_blank"
              rel="noreferrer"
            >
              https://panglsw01
            </a>
          </p>
          <ul className="list-decimal list-inside text-sm text-gray-500">
            <li>Login to SolarWinds Server.</li>
            <li>Open <strong>SolarWinds Platform Service Manager</strong>.</li>
            <li>Ensure all services are running.</li>
          </ul>

          <div>
            <label className="block font-medium mb-1">Are SolarWinds services running?</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  name="servicesRunning"
                  value="yes"
                  onChange={() => handleChange("solarwinds", "servicesRunning", "yes")}
                /> Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="servicesRunning"
                  value="no"
                  onChange={() => handleChange("solarwinds", "servicesRunning", "no")}
                /> No
              </label>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Clients</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.solarwinds.client || "Multiple"}
              onChange={(e) => handleChange("solarwinds", "client", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Alert Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.solarwinds.alertType}
              onChange={(e) => handleChange("solarwinds", "alertType", e.target.value)}
            >
              <option value="">Select type</option>
              <option value="Warning">Warning</option>
              <option value="Serious">Serious</option>
              <option value="Critical">Critical</option>
              <option value="Warning & Serious">Warning & Serious</option>
              <option value="Warning and Critical">Warning and Critical</option>
              <option value="Serious and Critical">Serious and Critical</option>
              <option value="Warning Serious & Critical">Warning Serious & Critical</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Alert Information</label>
            <table className="min-w-full table-auto border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="border px-2 py-1">Alert Name</th>
                  <th className="border px-2 py-1">Details</th>
                  <th className="border px-2 py-1">Trigger Time</th>
                  <th className="border px-2 py-1">Ticket</th>
                  <th className="border px-2 py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {formData.solarwinds.alerts.map((alert, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={alert.selected || false}
                        onChange={() => toggleRowSelection(index)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full"
                        value={alert.name}
                        onChange={(e) => handleAlertChange(index, "name", e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full"
                        value={alert.details}
                        onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full"
                        value={alert.time}
                        onChange={(e) => handleAlertChange(index, "time", e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full"
                        value={alert.ticket}
                        onChange={(e) => handleAlertChange(index, "ticket", e.target.value)}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        className="w-full"
                        value={alert.notes}
                        onChange={(e) => handleAlertChange(index, "notes", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 mt-2">
              <button onClick={addAlertRow} className="text-blue-600 text-sm">➕ Add Row</button>
              <button onClick={deleteSelectedRows} className="text-red-600 text-sm">🗑️ Delete Selected</button>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={prev} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
            <button onClick={handleFinalSubmit} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}
