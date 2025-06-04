import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import useDailyCheckForm from "./useDailyCheckForm";

export default function SolarWindsForm({ onBackToDashboard }) {
  const [submitted, setSubmitted] = useState(false);

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

 useEffect(() => {
  // Prefill engineer and date from localStorage
  const storedEngineer = localStorage.getItem("engineerName");
  const storedDate = localStorage.getItem("checkDate");

  if (storedEngineer) {
    handleChange("engineer", null, storedEngineer);
  }

  if (storedDate) {
    handleChange("date", null, storedDate);
  }

  // Initialize with an empty alert array (user-driven input)
  handleChange("solarwinds", "alerts", []);
}, []);


    handleChange("solarwinds", "alerts", manualAlerts);
  }, []);

  const handleFinalSubmit = () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="mb-2 font-semibold">Are you sure you're ready to submit?</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleSubmit();
                setSubmitted(true);
                toast.success("✅ Submission successful!");
                setTimeout(() => {
                  onBackToDashboard();
                }, 2000);
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
      ),
      { duration: 5000 }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 relative">
      <Toaster position="top-center" reverseOrder={false} />
      <button
        onClick={onBackToDashboard}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
      >
        Home
      </button>

      <div className="flex justify-center mb-4">
        <img src="/panologo.png" alt="Panoptics logo" className="h-20" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-center">Solarwinds Checks</h1>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            This is a daily checklist to check and address any alerts flagged in the following monitoring tools:
            <ul className="list-disc list-inside mt-2">
              <li>SolarWinds</li>
              <li>VMware vSAN</li>
            </ul>
          </p>

          <div>
            <label className="block font-medium mb-1">Engineer Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.engineer || ""}
              readOnly
            />
          </div>

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
                  <th className="border px-3 py-2 text-left">Alert Name</th>
                  <th className="border px-3 py-2 text-left">Details</th>
                  <th className="border px-3 py-2 text-left">Trigger Time</th>
                  <th className="border px-3 py-2 text-left">Ticket</th>
                  <th className="border px-3 py-2 text-left">Notes</th>
                  <th className="border px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.solarwinds.alerts.map((alert, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={alert.selected || false}
                        onChange={() => toggleRowSelection(index)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={alert.name}
                        onChange={(e) => handleAlertChange(index, "name", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={alert.details}
                        onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={alert.time}
                        onChange={(e) => handleAlertChange(index, "time", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={alert.ticket}
                        onChange={(e) => handleAlertChange(index, "ticket", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        value={alert.notes}
                        onChange={(e) => handleAlertChange(index, "notes", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {alert.selected && (
                        <button
                          className="text-blue-600 hover:underline text-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            const subject = encodeURIComponent(`SolarWinds Alert: ${alert.name}`);
                            const body = encodeURIComponent(
                              `Client: ${formData.solarwinds.client || 'Multiple'}\n` +
                              `Alert Name: ${alert.name}\nDetails: ${alert.details}\n` +
                              `Trigger Time: ${alert.time}\nAssign to: ${formData.engineer || 'Unknown'}\nNotes: ${alert.notes}`
                            );
                            window.location.href = `mailto:yourticketing@email.com?subject=${subject}&body=${body}`;
                          }}
                        >
                          📧 Create Ticket
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
            <button onClick={prev} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
            <button onClick={handleFinalSubmit} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}
