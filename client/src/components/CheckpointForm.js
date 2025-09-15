// src/components/CheckpointForm.js
import React, { useEffect } from "react";
import useCheckpointForm from "../hooks/useCheckpointForm";
import {
  openEmailWithTargets,
  EMAIL_LISTS,
  buildCheckpointRowBody,
} from "../utils/composeEmail";

export default function CheckpointForm({ onBackToDashboard }) {
  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    deleteSelectedRows,
    toggleRowSelection,
    toggleSelectAll,
    isFormValid,
    validationMessage,
    handleFinalSubmit,
  } = useCheckpointForm(onBackToDashboard);

  useEffect(() => {
    const engineer = localStorage.getItem("engineerName") || "";
    const date = localStorage.getItem("checkDate") || "";
    handleChange("engineer", null, engineer);
    handleChange("date", null, date);
  }, []);

  const inputClass = "w-full border rounded px-2 py-1";

  const openEmailClient = (row, title) => {
    const subject = `Checkpoint Alert — ${title}: ${row.name || "Unnamed"}`;
    const body = buildCheckpointRowBody(row, title);
    openEmailWithTargets(subject, body, EMAIL_LISTS.checkpoint);
  };

  const renderAlertTable = (alerts, org, titleForEmail) => {
    const selectedRow = alerts.find(
      (r) => r.selected && r.severity && r.name && r.machine && r.details
    );

    return (
      <>
        <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden mt-4">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={formData[org].selectAll || false}
                  onChange={() => toggleSelectAll(org)}
                />
              </th>
              <th className="border px-3 py-2">Severity</th>
              <th className="border px-3 py-2">Alert Name</th>
              <th className="border px-3 py-2">Machine Name</th>
              <th className="border px-3 py-2">Details</th>
              <th className="border px-3 py-2">Ticket</th>
              <th className="border px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((row, index) => (
              <tr
                key={index}
                onClick={() => toggleRowSelection(org, index)}
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
                      toggleRowSelection(org, index);
                    }}
                  />
                </td>
                <td className="border px-3 py-2">
                  <select
                    value={row.severity || ""}
                    onChange={(e) => handleAlertChange(org, index, "severity", e.target.value)}
                    className={inputClass}
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
                    onChange={(e) => handleAlertChange(org, index, "name", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    value={row.machine || ""}
                    onChange={(e) => handleAlertChange(org, index, "machine", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    value={row.details || ""}
                    onChange={(e) => handleAlertChange(org, index, "details", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    value={row.ticket || ""}
                    placeholder="e.g. INC123456 or NA"
                    onChange={(e) => handleAlertChange(org, index, "ticket", e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    value={row.notes || ""}
                    onChange={(e) => handleAlertChange(org, index, "notes", e.target.value)}
                    className={inputClass}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4 mt-4 items-center flex-wrap">
          <button type="button" onClick={() => addAlertRow(org)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded">➕ Add Row</button>
          <button type="button" onClick={() => deleteSelectedRows(org)} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded">🗑️ Delete Selected</button>

          {selectedRow && (
            <button
              type="button"
              className="bg-green-100 hover:bg-green-200 text-green-700 text-sm px-3 py-1 rounded"
              onClick={() => openEmailClient(selectedRow, titleForEmail)}
            >
              📧 Email ({selectedRow.name})
            </button>
          )}
        </div>
      </>
    );
  };

  const renderSection = (title, org) => (
    <div className="bg-white border rounded-lg shadow-sm p-6 mb-10">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <label className="block font-medium mb-1">Alert generated?</label>
      <div className="flex gap-4 mb-4">
        <label><input type="radio" name={`${org}Alert`} value="yes" checked={formData[org].alertsGenerated === "yes"} onChange={() => handleChange(org, "alertsGenerated", "yes")} /> Yes</label>
        <label><input type="radio" name={`${org}Alert`} value="no"  checked={formData[org].alertsGenerated === "no"}  onChange={() => handleChange(org, "alertsGenerated", "no")}  /> No</label>
      </div>

      {formData[org].alertsGenerated === "yes" && renderAlertTable(formData[org].alerts, org, title)}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkpoint Checks</h1>
      <p className="text-sm text-gray-700 text-center max-w-2xl mx-auto mb-6">
        Review and record any critical alerts detected within Checkpoint Infinity Portal for both Panoptics and The Brewery.
      </p>

      <div className="bg-gray-50 border rounded px-4 py-3 text-sm shadow-sm mb-6">
        <p className="font-semibold mb-1">Checkpoint Infinity Portal</p>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">URL</span>
          <a href="https://portal.checkpoint.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
            https://portal.checkpoint.com
          </a>
        </div>
      </div>

      {renderSection("Panoptics Global Ltd", "panoptics")}
      {renderSection("The Brewery", "brewery")}

      {isFormValid ? (
        <div className="flex justify-center mt-8">
          <button onClick={handleFinalSubmit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
            Submit Checklist
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-red-600 mt-8 max-w-md mx-auto">⚠️ {validationMessage}</p>
      )}

      <div className="mt-10">
        <button onClick={onBackToDashboard} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
      </div>
    </div>
  );
}
