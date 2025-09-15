import { useEffect } from "react";
import useVeeamForm from "../hooks/useVeeamForm";
import { openEmail } from "../utils/email";
import { saveSubmission } from "../utils/SaveSubmission";

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

  useEffect(() => {
    const engineer = localStorage.getItem("engineerName") || "";
    const date = localStorage.getItem("checkDate") || "";
    handleChange("engineer", engineer);
    handleChange("date", date);
  }, []);

  const allAnswered =
    formData.alertsGenerated && formData.localAlertsGenerated;

  const showSubmit =
    allAnswered &&
    ((formData.alertsGenerated === "no") ||
      (formData.alertsGenerated === "yes" && isSubmissionReady())) &&
    ((formData.localAlertsGenerated === "no") ||
      (formData.localAlertsGenerated === "yes" && isLocalSubmissionReady()));

  const openEmailClient = (row) => {
    const subject = `Veeam Alert: ${row.vbrHost || "-"}`;
    const body =
      `Type: ${row.type || "-"}\n` +
      `VBR Host: ${row.vbrHost || "-"}\n` +
      `Details: ${row.details || "-"}\n` +
      (row.ticket ? `Ticket: ${row.ticket}\n` : "") +
      (row.notes ? `Notes: ${row.notes}\n` : "");
    openEmail(subject, body);
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Veeam Backup Checks</h1>
      <p className="text-sm text-gray-700 text-center max-w-2xl mx-auto mb-6">
        This checklist is used to review and document any warnings or failures identified in the
        Veeam Backup &amp; Replication environments across all listed customer platforms. It ensures
        that any backup issues are tracked, addressed, and escalated where necessary.
      </p>

      {/* Clarion Section */}
      <div className="bg-gray-50 border rounded-lg p-4 shadow-sm mb-8">
        <p className="text-sm text-gray-700 mb-2 font-semibold">Clarion Events Veeam Backup</p>

        <div className="bg-gray-50 p-4 rounded border text-sm mb-6">
          <p className="font-semibold mb-1">Clarion Events Veeam Backup</p>
          <p className="mb-2">
            For accessing remote environments, use the Clarion RDS farm or UK1-PAN01 and RDP to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">CT</span>
              <span>https://us2-veeam01.clarionevents.local/</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">TUL</span>
              <span>https://us1-veeam01.clarionevents.local/</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">SG</span>
              <span>https://sg-veeam01.clarionevents.local/</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">UK</span>
              <span>https://uk1-veeam365.clarionevents.local/</span>
            </div>
          </div>
        </div>

        <label className="font-semibold block mb-2">Alert generated?</label>
        <div className="mb-4">
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

        {formData.alertsGenerated === "yes" &&
          renderAlertTable(
            formData.alerts,
            toggleSelectAll,
            toggleRowSelection,
            handleAlertChange,
            addAlertRow,
            deleteSelectedRows,
            formData.selectAll,
            ["US2-VEEAM01", "US1-VEEAM01", "SG-VEEAM01", "UK1-VEEAM365"],
            openEmailClient
          )}
      </div>

      {/* Local Section */}
      <div className="bg-gray-50 border rounded-lg p-4 shadow-sm mb-8">
        <p className="text-sm text-gray-700 mb-2 font-semibold">Local Veeam Backup</p>

        <div className="bg-gray-50 p-4 rounded border text-sm mb-6">
          <p className="font-semibold mb-1">Local Veeam Backup</p>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">URL</span>
            <a
              href="https://192.168.69.219:1280/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 underline"
            >
              https://192.168.69.219:1280/
            </a>
          </div>
          <p>Sign in with your ADM account.</p>
          <p>
            Navigate to <strong>Management &gt; Backup Jobs</strong> to review errors and warnings.
          </p>
        </div>

        <label className="font-semibold block mb-2">Alert generated?</label>
        <div className="mb-4">
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

        {formData.localAlertsGenerated === "yes" &&
          renderAlertTable(
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
              "Volac-VBR01",
            ],
            openEmailClient
          )}
      </div>

      {/* Warning */}
      <div className="mt-4 mb-6 text-sm text-red-700 text-center">
        ⚠️ Please ensure <strong>"Alert generated?"</strong> is answered for both{" "}
        <strong>Clarion Events</strong> and <strong>Local Veeam Backup</strong>. If{" "}
        <strong>"Yes"</strong> is selected, each selected row must include{" "}
        <strong>Type</strong>, <strong>VBR Host</strong>, <strong>Details</strong>, and{" "}
        <strong>Ticket</strong>.
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBackToDashboard}
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          Back
        </button>

        {showSubmit && (
          <button
            onClick={() => {
              const pdf = handleFinalSubmit(); // { dataUrl, filename } or undefined

              const passed =
                (formData.alertsGenerated === "no" || isSubmissionReady()) &&
                (formData.localAlertsGenerated === "no" || isLocalSubmissionReady());

              saveSubmission({
                module: "veeam",
                engineer:
                  formData.engineer || localStorage.getItem("engineerName") || "Unknown",
                passed,
                meta: { clients: ["Clarion", "Local"], notes: "Submitted from VeeamForm" },
                payload: formData,
                pdf: pdf ? { name: pdf.filename, dataUrl: pdf.dataUrl } : undefined,
              });

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

function renderAlertTable(
  alerts,
  toggleSelectAll,
  toggleRowSelection,
  handleAlertChange,
  addRow,
  deleteRows,
  selectAll,
  vbrHostOptions,
  openEmailClient
) {
  const selectedRow = (alerts || []).filter(
    (r) => r.selected && r.type && r.vbrHost && r.details
  );

  return (
    <>
      <table className="w-full text-sm border shadow rounded mt-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center">
              <input type="checkbox" checked={selectAll || false} onChange={toggleSelectAll} />
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
                  className="w-full border border-gray-300 px-2 py-1 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 px-2 py-1 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={alert.vbrHost}
                  onChange={(e) => handleAlertChange(idx, "vbrHost", e.target.value)}
                >
                  <option value="">Select</option>
                  {vbrHostOptions.map((host) => (
                    <option key={host} value={host}>
                      {host}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <input
                  type="text"
                  className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
                  value={alert.details}
                  onChange={(e) => handleAlertChange(idx, "details", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="text"
                  placeholder="e.g. INC123456"
                  className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
                  value={alert.ticket}
                  onChange={(e) => handleAlertChange(idx, "ticket", e.target.value)}
                />
              </td>
              <td className="p-2">
                <input
                  type="text"
                  className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
                  value={alert.notes}
                  onChange={(e) => handleAlertChange(idx, "notes", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded text-sm"
          onClick={addRow}
        >
          ➕ Add Row
        </button>
        <button
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm"
          onClick={deleteRows}
        >
          🗑️ Delete Selected
        </button>
        {selectedRow.length === 1 && (
          <button
            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded text-sm"
            onClick={() => openEmailClient(selectedRow[0])}
          >
            📧 Email ({selectedRow[0].vbrHost})
          </button>
        )}
      </div>
    </>
  );
}
