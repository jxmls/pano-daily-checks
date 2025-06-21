// SolarWindsForm.js
import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import useSolarWindsForm from "./useSolarWindsForm";

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
  } = useSolarWindsForm();

  useEffect(() => {
    const storedEngineer = localStorage.getItem("engineerName") || "";
    const storedDate = localStorage.getItem("checkDate") || "";
    handleChange(null, "engineer", storedEngineer);
    handleChange(null, "date", storedDate);
  }, [handleChange]);

  const openEmailClient = (alert) => {
    const subject = `SolarWinds Alert: ${alert.name}`;
    const engineerName = typeof formData.engineer === "string"
      ? formData.engineer
      : (formData.engineer?.name || "Unknown");

    const body =
      `Client: ${formData.solarwinds.client || "Multiple"}\n` +
      `Alert Name: ${alert.name}\n` +
      `Details: ${alert.details}\n` +
      `Alert Type: ${alert.alertType || "N/A"}\n` +
      `Trigger Time: ${alert.time || "N/A"}\n` +
      `Assign to: ${engineerName}\n` +
      `Notes: ${alert.notes || "-"}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
          </ul>
        </p>
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
                checked={formData.solarwinds.servicesRunning === "yes"}
                onChange={() => handleChange("solarwinds", "servicesRunning", "yes")}
              /> Yes
            </label>
            <label>
              <input
                type="radio"
                name="servicesRunning"
                value="no"
                checked={formData.solarwinds.servicesRunning === "no"}
                onChange={() => handleChange("solarwinds", "servicesRunning", "no")}
              /> No
            </label>
          </div>
        </div>

        {formData.solarwinds.servicesRunning === "no" && (
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Ticket Reference</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.solarwinds.serviceDownTicket || ""}
              onChange={(e) => handleChange("solarwinds", "serviceDownTicket", e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block font-medium mb-1">Clients</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.solarwinds.client || "Multiple"}
            onChange={(e) => handleChange("solarwinds", "client", e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Alert generated?</label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="alertsGenerated"
                value="yes"
                checked={formData.solarwinds.alertsGenerated === "yes"}
                onChange={() => {
                  handleChange("solarwinds", "alertsGenerated", "yes");
                  if (!formData.solarwinds.alerts.length) {
                    addAlertRow("solarwinds", "alerts");
                  }
                }}
              /> Yes
            </label>
            <label>
              <input
                type="radio"
                name="alertsGenerated"
                value="no"
                checked={formData.solarwinds.alertsGenerated === "no"}
                onChange={() => {
                  handleChange("solarwinds", "alertsGenerated", "no");
                  handleChange("solarwinds", "alerts", []);
                }}
              /> No
            </label>
          </div>
        </div>

        {formData.solarwinds.alertsGenerated === "yes" && (
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
                  <th className="border px-3 py-2">Type</th>
                  <th className="border px-3 py-2">Alert Name</th>
                  <th className="border px-3 py-2">Details</th>
                  <th className="border px-3 py-2">Trigger Time</th>
                  <th className="border px-3 py-2">Ticket</th>
                  <th className="border px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {formData.solarwinds.alerts.map((alert, index) => (
                  <tr
                    key={index}
                    onClick={() => toggleRowSelection(index)}
                    className={`cursor-pointer ${alert.selected ? "bg-blue-100" : index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="border px-3 py-2 text-center">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowSelection(index);
                        }}
                        className="inline-block cursor-pointer select-none"
                      >
                        {alert.selected ? <span className="text-green-600 text-lg">✅</span> : <span className="text-gray-400 text-lg">☐</span>}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={alert.alertType || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "alertType", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Warning">Warning</option>
                        <option value="Serious">Serious</option>
                        <option value="Critical">Critical</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert.name || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "name", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert.details || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert.time || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "time", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert.ticket || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "ticket", e.target.value)}
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={alert.notes || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAlertChange(index, "notes", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => addAlertRow("solarwinds", "alerts")}
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
              {formData.solarwinds.alerts
                .filter((r) => r.selected && r.name && r.details)
                .map((row, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openEmailClient(row)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 text-sm px-3 py-1 rounded"
                  >
                    📧 Create Email ({row.name})
                  </button>
              ))}
            </div>
          </div>
        )}

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
