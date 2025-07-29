import React from "react";
import useVeeamForm from "../hooks/useVeeamForm";

export default function VeeamForm({ onBackToDashboard }) {
  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    handleFinalSubmit,
    handleLocalAlertChange,
    addLocalAlertRow,
    toggleLocalRowSelection,
    deleteSelectedLocalRows,
    toggleSelectAllLocal,
    isSubmissionReady,
    isLocalSubmissionReady,
  } = useVeeamForm();

  return (
    <div className="min-h-screen bg-white text-black p-6 max-w-5xl mx-auto">
  <h1 className="text-3xl font-bold mb-6 text-center">Veeam Backup Checks</h1>

  <p className="mb-4 text-sm">

        <strong>Clarion Events Veeam Backup</strong><br />
        For accessing remote environments, use the Clarion RDS farm or UK1-PAN01 and RDP to:<br />
        <strong>CT:</strong> US2-VEEAM01 | <strong>TUL:</strong> US1-VEEAM01 | <strong>SG:</strong> SG-VEEAM01 | <strong>UK:</strong> UK1-VEEAM365
      </p>

      {/* Clarion Events Alerts Generated */}
      <div className="mb-6">
        <label className="font-semibold block mb-2">Alert generated?</label>
        <label className="mr-4">
          <input
            type="radio"
            name="alertGenerated"
            value="yes"
            checked={formData.alertsGenerated === "yes"}
            onChange={() => handleChange("alertsGenerated", "yes")}
            className="mr-1"
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            name="alertGenerated"
            value="no"
            checked={formData.alertsGenerated === "no"}
            onChange={() => handleChange("alertsGenerated", "no")}
            className="mr-1"
          />
          No
        </label>
      </div>

      {/* Clarion Events Table */}
      {formData.alertsGenerated === "yes" && (
        <div className="mt-4">
          {renderAlertTable(
            formData.alerts,
            toggleSelectAll,
            toggleRowSelection,
            handleAlertChange,
            addAlertRow,
            deleteSelectedRows,
            formData.selectAll,
            ["US2-VEEAM01", "US1-VEEAM01", "SG-VEEAM01", "UK1-VEEAM365"]
          )}
        </div>
      )}

      {/* Local Veeam Backup Section */}
      <div className="mt-12">
        <p className="mb-4 text-sm">
          <strong>Local Veeam Backup</strong><br />
          URL: <a href="https://192.168.69.219:1280/" target="_blank" rel="noreferrer" className="text-blue-700 underline">https://192.168.69.219:1280/</a><br />
          Sign in with your ADM account.<br />
          Navigate to <strong>Management &gt; Backup Jobs</strong><br />
          You will find both Error and Warning messages under Virtual Machines and Microsoft 365 Objects tab.
        </p>

        <div className="mb-6">
          <label className="font-semibold block mb-2">Alert generated?</label>
          <label className="mr-4">
            <input
              type="radio"
              name="localAlertGenerated"
              value="yes"
              checked={formData.localAlertsGenerated === "yes"}
              onChange={() => handleChange("localAlertsGenerated", "yes")}
              className="mr-1"
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="localAlertGenerated"
              value="no"
              checked={formData.localAlertsGenerated === "no"}
              onChange={() => handleChange("localAlertsGenerated", "no")}
              className="mr-1"
            />
            No
          </label>
        </div>

        {/* Local Table */}
        {formData.localAlertsGenerated === "yes" && (
          <div className="mt-4">
            {renderAlertTable(
              formData.localAlerts,
              toggleSelectAllLocal,
              toggleLocalRowSelection,
              handleLocalAlertChange,
              addLocalAlertRow,
              deleteSelectedLocalRows,
              formData.selectAllLocal,
              [
                "Brew_BkpSrv01",
                "Clarion-VBR01",
                "Clarion-VBR02",
                "LilleSq-VBR01",
                "PanglVeeam365",
                "Panoptics-VBR02",
                "Swallow-VBR01",
                "SwimEngl-VBR01",
                "UK1-Veeam365",
                "Volac-VBR01"
              ]
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-10 flex flex-col items-center space-y-4">
        <button
          onClick={onBackToDashboard}
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          Back
        </button>

        {(isSubmissionReady() || isLocalSubmissionReady()) && (
          <button
            onClick={() => {
              handleFinalSubmit();
              onBackToDashboard();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Checklist
          </button>
        )}
      </div>
    </div>
  );
}

// Reusable alert table component
function renderAlertTable(alerts, toggleSelectAll, toggleRowSelection, handleAlertChange, addRow, deleteRows, selectAll, vbrHostOptions) {
  return (
    <>
      <table className="w-full text-sm border shadow rounded">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center">
              <input
                type="checkbox"
                checked={selectAll || false}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="p-2">Type</th>
            <th className="p-2">VBR Host</th>
            <th className="p-2">Details</th>
            <th className="p-2">Ticket</th>
            <th className="p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {(alerts || []).map((alert, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={alert.selected || false}
                  onChange={() => toggleRowSelection(idx)}
                />
              </td>
              <td className="p-2">
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={alert.type}
                  onChange={(e) => handleAlertChange(idx, "type", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Warning">Warning</option>
                  <option value="Failed">Failed</option>
                </select>
              </td>
              <td className="p-2">
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={alert.vbrHost}
                  onChange={(e) => handleAlertChange(idx, "vbrHost", e.target.value)}
                >
                  <option value="">Select</option>
                  {vbrHostOptions.map((host) => (
                    <option key={host} value={host}>{host}</option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <input
                  type="text"
                  className="w-full border px-2 py-1 rounded"
                  value={alert.details}
                  onChange={(e) => handleAlertChange(idx, "details", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="text"
                  className="w-full border px-2 py-1 rounded"
                  value={alert.ticket}
                  onChange={(e) => handleAlertChange(idx, "ticket", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="text"
                  className="w-full border px-2 py-1 rounded"
                  value={alert.notes}
                  onChange={(e) => handleAlertChange(idx, "notes", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex gap-4">
        <button
          className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded"
          onClick={addRow}
        >
          ➕ Add Row
        </button>
        <button
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded"
          onClick={deleteRows}
        >
          🗑️ Delete Selected
        </button>
      </div>
    </>
  );
}
