import React, { useEffect } from "react";
import useCheckpointForm from "../hooks/useCheckpointForm";

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
  generateEmailBody,
  handleFinalSubmit,
} = useCheckpointForm(onBackToDashboard); 

  useEffect(() => {
    const engineer = localStorage.getItem("engineerName") || "";
    const date = localStorage.getItem("checkDate") || "";
    handleChange("engineer", null, engineer);
    handleChange("date", null, date);
  }, []);

 const renderTable = (alerts, org) => (
  <>
    <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden mt-4">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border px-3 py-2 text-center">
            <input
              type="checkbox"
              checked={formData[org].selectAll}
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
            className={`${
              row.selected ? "bg-blue-100" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="border px-3 py-2 text-center">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={row.selected || false}
                onChange={() => toggleRowSelection(org, index)}
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.severity || ""}
                onChange={(e) => handleAlertChange(org, index, "severity", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.name || ""}
                onChange={(e) => handleAlertChange(org, index, "name", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.machine || ""}
                onChange={(e) => handleAlertChange(org, index, "machine", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.details || ""}
                onChange={(e) => handleAlertChange(org, index, "details", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.ticket || ""}
                onChange={(e) => handleAlertChange(org, index, "ticket", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
            <td className="border px-3 py-2">
              <input
                value={row.notes || ""}
                onChange={(e) => handleAlertChange(org, index, "notes", e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="flex gap-4 mt-4">
      <button
        type="button"
        onClick={() => addAlertRow(org)}
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded"
      >
        ➕ Add Row
      </button>
      <button
        type="button"
        onClick={() => deleteSelectedRows(org)}
        className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded"
      >
        🗑️ Delete Selected
      </button>
    </div>
  </>
);

 return (
  <div className="min-h-screen bg-white text-black p-6">
    <h1 className="text-3xl font-bold mb-2 text-center">Checkpoint Checks</h1>
    <p className="text-center text-sm mb-6 text-gray-700">
      This is a daily checklist to check and address any alerts flagged in Check Point Portal. <br />
      URL for Check Point Infinity Portal:{" "}
      <a
        href="https://portal.checkpoint.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        https://portal.checkpoint.com
      </a>
    </p>
      {/* PANOPTICS */}
      <h2 className="text-xl font-semibold mt-6">Panoptics Global Ltd</h2>
      <div className="mt-4">
        <label className="block font-medium mb-1">Alert generated?</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="panopticsAlert"
              value="yes"
              checked={formData.panoptics.alertsGenerated === "yes"}
              onChange={() => handleChange("panoptics", "alertsGenerated", "yes")}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="panopticsAlert"
              value="no"
              checked={formData.panoptics.alertsGenerated === "no"}
              onChange={() => handleChange("panoptics", "alertsGenerated", "no")}
            />{" "}
            No
          </label>
        </div>
      </div>
      {formData.panoptics.alertsGenerated === "yes" &&
        renderTable(formData.panoptics.alerts, "panoptics")}

      {/* BREWERY */}
      <h2 className="text-xl font-semibold mt-10">The Brewery</h2>
  
      <div className="mt-4">
        <label className="block font-medium mb-1">Alert generated?</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="breweryAlert"
              value="yes"
              checked={formData.brewery.alertsGenerated === "yes"}
              onChange={() => handleChange("brewery", "alertsGenerated", "yes")}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="breweryAlert"
              value="no"
              checked={formData.brewery.alertsGenerated === "no"}
              onChange={() => handleChange("brewery", "alertsGenerated", "no")}
            />{" "}
            No
          </label>
        </div>
      </div>
      {formData.brewery.alertsGenerated === "yes" &&
        renderTable(formData.brewery.alerts, "brewery")}

      {/* Validation + Submit */}
      {isFormValid ? (
        <div className="flex justify-center mt-8 gap-4">
          {/*<a
            href={`mailto:infra@panoptics.com?subject=Checkpoint Daily Check - ${formData.date}&body=${encodeURIComponent(
              generateEmailBody()
            )}`}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            📧 Email Summary
          </a>*/}
          <button
            onClick={handleFinalSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
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
