import React from "react";
import useDailyCheckForm from "./useDailyCheckForm";

export default function MultiStepForm() {
  const { step, formData, handleChange, next, prev, handleSubmit } = useDailyCheckForm();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Daily Infrastructure Check 🚀</h1>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.date}
              onChange={(e) => handleChange("alerts", [index, "name"], e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Engineer</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.engineer}
              onChange={(e) => handleChange("main", "engineer", e.target.value)}
            >
              <option value="">Select engineer</option>
              <option value="Jose Lucar">Jose Lucar</option>
              <option value="Alex Field">Alex Field</option>
              <option value="Mihir Sangani">Mihir Sangani</option>
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">SolarWinds</h2>
          <p className="text-gray-600">
            SolarWinds can be accessed from your laptop using Always On VPN or via Panoptics RDS. Navigate to:
            <a href="https://panglsw01" className="text-blue-500 underline ml-1" target="_blank" rel="noreferrer">https://panglsw01</a>
          </p>
          <ul className="list-decimal list-inside text-sm text-gray-500">
            <li>Login to SolarWinds Server.</li>
            <li>Open <strong>SolarWinds Platform Service Manager</strong>.</li>
            <li>Ensure all services are running.</li>
          </ul>

          <div>
            <label className="block font-medium mb-1">Are SolarWinds services running?</label>
            <div className="flex gap-4">
              <label><input type="radio" name="servicesRunning" value="yes" onChange={() => handleChange("solarwinds", "servicesRunning", "yes")} /> Yes</label>
              <label><input type="radio" name="servicesRunning" value="no" onChange={() => handleChange("solarwinds", "servicesRunning", "no")} /> No</label>
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
                  <th className="border px-2 py-1">Alert Name</th>
                  <th className="border px-2 py-1">Details</th>
                  <th className="border px-2 py-1">Trigger Time</th>
                  <th className="border px-2 py-1">Ticket</th>
                  <th className="border px-2 py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1"><input className="w-full" /></td>
                  <td className="border px-2 py-1"><input className="w-full" /></td>
                  <td className="border px-2 py-1"><input className="w-full" /></td>
                  <td className="border px-2 py-1"><input className="w-full" /></td>
                  <td className="border px-2 py-1"><input className="w-full" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        {step > 1 && (
          <button onClick={prev} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
        )}
        {step < 2 ? (
          <button onClick={next} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded">Next</button>
        ) : (
          <button onClick={handleSubmit} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded">Submit</button>
        )}
      </div>
    </div>
  );
}
