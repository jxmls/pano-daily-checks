import React, { useEffect } from "react";
import useSolarWindsForm from "../hooks/useSolarWindsForm";

export default function SolarWindsForm({ onBackToDashboard }) {
  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    deleteSelectedRows,
    toggleRowSelection,
    toggleSelectAll,
    handleFinalSubmit,
    isFormValid,
    validationMessage,
  } = useSolarWindsForm();

  // 👇 Wrapper function to handle submit + return to dashboard
  const handleFinalSubmitAndReturn = () => {
    handleFinalSubmit();
    onBackToDashboard();
  };

  // Load engineer name and date from localStorage
  useEffect(() => {
    const storedEngineer = localStorage.getItem("engineerName") || "";
    const storedDate = localStorage.getItem("checkDate") || "";
    handleChange("solarwinds", "engineer", storedEngineer);
    handleChange("solarwinds", "date", storedDate);
  }, []);

  const renderAlertTable = () => (
    <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden mt-4">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border px-3 py-2 text-center">
            <input
              type="checkbox"
              checked={formData.selectAll}
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
        {formData.solarwinds.alerts.map((row, index) => (
          <tr
            key={index}
            onClick={() => toggleRowSelection(index)}
            className={`cursor-pointer ${
              row.selected ? "bg-blue-100" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="border px-3 py-2 text-center">
              <input
                type="checkbox"
                checked={row.selected || false}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleRowSelection(index);
                }}
              />
            </td>
            <td className="border px-3 py-2">
              <select
                value={row.alertType || ""}
                onChange={(e) => handleAlertChange(index, "alertType", e.target.value)}
                className="w-full border rounded px-2 py-1"
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
                value={row.name || ""}
                onChange={(e) => handleAlertChange(index, "name", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.details || ""}
                onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.time || ""}
                onChange={(e) => handleAlertChange(index, "time", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.ticket || ""}
                onChange={(e) => handleAlertChange(index, "ticket", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.notes || ""}
                onChange={(e) => handleAlertChange(index, "notes", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">SolarWinds Checks</h1>

      <p className="mb-4">This is a daily checklist to check and address any alerts flagged in:</p>
      <ul className="list-disc ml-6 mb-4">
        <li>SolarWinds</li>
      </ul>
      <p className="mb-2">
        Access via VPN or RDS:{" "}
        <a href="https://panglsw01" className="text-blue-600 underline">
          https://panglsw01
        </a>
      </p>
      <ol className="list-decimal ml-6 mb-4">
        <li>Login to SolarWinds Server.</li>
        <li>Open <strong>SolarWinds Platform Service Manager</strong>.</li>
        <li>Ensure all services are running.</li>
      </ol>

      <div className="mb-4">
        <label className="block font-medium mb-1">Are SolarWinds services running?</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="servicesRunning"
              value="yes"
              checked={formData.solarwinds.servicesRunning === "yes"}
              onChange={() => handleChange("solarwinds", "servicesRunning", "yes")}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="servicesRunning"
              value="no"
              checked={formData.solarwinds.servicesRunning === "no"}
              onChange={() => handleChange("solarwinds", "servicesRunning", "no")}
            />{" "}
            No
          </label>
        </div>
      </div>

      {formData.solarwinds.servicesRunning === "no" && (
        <div className="mb-4">
          <label className="block font-medium mb-1">Ticket Number</label>
          <input
            type="text"
            value={formData.solarwinds.serviceDownTicket}
            onChange={(e) =>
              handleChange("solarwinds", "serviceDownTicket", e.target.value)
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-1">Clients</label>
        <input
          type="text"
          value={formData.solarwinds.client}
          onChange={(e) => handleChange("solarwinds", "client", e.target.value)}
          className="w-full border px-3 py-2 rounded"
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
              onChange={() => handleChange("solarwinds", "alertsGenerated", "yes")}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="alertsGenerated"
              value="no"
              checked={formData.solarwinds.alertsGenerated === "no"}
              onChange={() => handleChange("solarwinds", "alertsGenerated", "no")}
            />{" "}
            No
          </label>
        </div>
      </div>

      {formData.solarwinds.alertsGenerated === "yes" && (
        <>
          {renderAlertTable()}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={addAlertRow}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded"
            >
              ➕ Add Row
            </button>
            <button
              type="button"
              onClick={deleteSelectedRows}
              className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded"
            >
              🗑️ Delete Selected
            </button>
          </div>
        </>
      )}

      {isFormValid ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleFinalSubmitAndReturn}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Checklist
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-red-600 mt-8 max-w-md mx-auto">
          ⚠️ {validationMessage}
        </p>
      )}

      <div className="fixed bottom-4 left-4">
        <button
          onClick={onBackToDashboard}
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}
