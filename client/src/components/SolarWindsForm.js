// src/components/SolarWindsForm.js
import React, { useEffect, useMemo, useState } from "react";
import useSolarWindsForm from "../hooks/useSolarWindsForm";
import { saveSubmission } from "../utils/SaveSubmission";
import {
  openEmailWithTargets,
  EMAIL_LISTS,
  buildSolarWindsBody,
} from "../utils/composeEmail";

/* ---------- helpers for datetime handling ---------- */
function pad(n) { return String(n).padStart(2, "0"); }
function nowLocalForInput() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function parseToParts(v) {
  if (!v || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    const now = nowLocalForInput();
    const [date, time] = now.split("T");
    return { date, time };
  }
  const [date, time] = v.split("T");
  return { date, time: time.slice(0,5) };
}
function supportsDateTimeLocal() {
  const i = document.createElement("input");
  i.setAttribute("type", "datetime-local");
  return i.type === "datetime-local";
}

function DateTimeCell({ value, onChange, className = "" }) {
  const nativeSupported = useMemo(() => supportsDateTimeLocal(), []);
  const parts = useMemo(() => parseToParts(value), [value]);
  const [date, setDate] = useState(parts.date);
  const [time, setTime] = useState(parts.time);

  useEffect(() => {
    const p = parseToParts(value);
    setDate(p.date);
    setTime(p.time);
  }, [value]);

  const commit = (d, t) => {
    if (d && t) onChange(`${d}T${t}`);
    else onChange("");
  };

  if (nativeSupported) {
    return (
      <input
        type="datetime-local"
        value={value || `${date}T${time}`}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    );
  }

  return (
    <div className="flex gap-1">
      <input
        type="date"
        value={date}
        onChange={(e) => { const d = e.target.value; setDate(d); commit(d, time); }}
        className={className}
      />
      <input
        type="time"
        value={time}
        onChange={(e) => { const t = e.target.value; setTime(t); commit(date, t); }}
        className={className}
      />
    </div>
  );
}

/* ---------------- component ---------------- */
export default function SolarWindsForm({ onBackToDashboard }) {
  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    deleteSelectedRows,
    toggleRowSelection,
    toggleSelectAll,
    handleFinalSubmit, // returns { dataUrl, filename }
    isFormValid,
    validationMessage,
    selectAll,
  } = useSolarWindsForm();

  useEffect(() => {
    const storedEngineer = localStorage.getItem("engineerName") || "";
    const storedDate = localStorage.getItem("checkDate") || "";
    handleChange("root", "engineer", storedEngineer);
    handleChange("root", "date", storedDate);
  }, []);

  const handleFinalSubmitAndReturn = () => {
    const pdf = handleFinalSubmit(); // { dataUrl, filename } | undefined

    // Build pretty email (mailto)
    const subject = `SolarWinds Daily Checklist — ${formData.root?.date} — ${formData.root?.engineer}`;
    const body = buildSolarWindsBody({
      engineer: formData.root?.engineer,
      date: formData.root?.date,
      client: formData.solarwinds?.client,
      servicesRunning: formData.solarwinds?.servicesRunning,
      sdTicket: formData.solarwinds?.serviceDownTicket,
      alertsGenerated: formData.solarwinds?.alertsGenerated,
      notes: (formData.solarwinds?.alerts || []).length
        ? "See alert table in submission."
        : "No alerts.",
    });
    openEmailWithTargets(subject, body, EMAIL_LISTS.solarwinds);

    // Persist for Admin Portal
    const passed =
      (formData?.solarwinds?.servicesRunning || "").toLowerCase() === "yes" &&
      (formData?.solarwinds?.alertsGenerated || "").toLowerCase() === "no";

    saveSubmission({
      module: "solarwinds",
      engineer: formData.engineer || localStorage.getItem("engineerName") || "Unknown",
      passed,
      meta: { clients: [formData?.solarwinds?.client || "Multiple"], notes: "Submitted from SolarWindsForm" },
      payload: formData,
      pdf: pdf ? { name: pdf.filename, dataUrl: pdf.dataUrl } : undefined,
    });

    onBackToDashboard();
  };

  const renderAlertTable = () => (
    <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden mt-4">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border px-3 py-2 text-center">
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
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
        {(formData.solarwinds.alerts || []).map((row, index) => (
          <tr
            key={index}
            onClick={() => toggleRowSelection(index)}
            className={`cursor-pointer min-h-[48px] ${
              row.selected ? "bg-blue-100" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="border px-3 py-2 text-center align-middle">
              <input
                type="checkbox"
                checked={row.selected || false}
                onChange={(e) => { e.stopPropagation(); toggleRowSelection(index); }}
              />
            </td>
            <td className="border px-3 py-2 align-middle">
              <select
                value={row.alertType || ""}
                onChange={(e) => handleAlertChange(index, "alertType", e.target.value)}
                className="min-w-[120px] border border-gray-300 rounded px-2 py-[0.375rem] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Warning">Warning</option>
                <option value="Serious">Serious</option>
                <option value="Critical">Critical</option>
                <option value="Resolved">Resolved</option>
              </select>
            </td>
            <td className="border px-3 py-2 align-middle">
              <input
                value={row.name || ""}
                onChange={(e) => handleAlertChange(index, "name", e.target.value)}
                className="w-full border rounded px-2 py-[0.375rem]"
              />
            </td>
            <td className="border px-3 py-2 align-middle">
              <input
                value={row.details || ""}
                onChange={(e) => handleAlertChange(index, "details", e.target.value)}
                className="w-full border rounded px-2 py-[0.375rem]"
              />
            </td>
            <td className="border px-3 py-2 align-middle">
              <DateTimeCell
                value={row.time || ""}
                onChange={(v) => handleAlertChange(index, "time", v)}
                className="w-full border rounded px-2 py-[0.375rem]"
              />
            </td>
            <td className="border px-3 py-2 align-middle">
              <input
                value={row.ticket || ""}
                onChange={(e) => handleAlertChange(index, "ticket", e.target.value)}
                className="w-full border rounded px-2 py-[0.375rem]"
              />
            </td>
            <td className="border px-3 py-2 align-middle">
              <input
                value={row.notes || ""}
                onChange={(e) => handleAlertChange(index, "notes", e.target.value)}
                className="w-full border rounded px-2 py-[0.375rem]"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-white text-black px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">SolarWinds Checks</h2>
        <p className="text-center text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
          This checklist is used to identify and document any <strong>unacknowledged or critical alerts</strong> in SolarWinds.
        </p>

        {/* SolarWinds server + guidance */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">SolarWinds</h3>
          <p className="text-sm text-gray-600 mb-1">
            Clients:{" "}
            <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm ml-1">
              {formData.solarwinds.client || "Multiple"}
            </span>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Perform via VPN or RDS (e.g. Panoptics RDS).
          </p>
          <div className="flex items-center gap-3 p-3 border rounded bg-white mb-4">
            <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded min-w-[60px] text-center">
              Server
            </span>
            <span className="text-sm font-mono text-gray-800 break-all">https://panglsw01</span>
          </div>
          <ol className="list-decimal text-sm ml-5 text-gray-800 space-y-1">
            <li>Login to the SolarWinds Server.</li>
            <li>Open <span className="font-semibold">SolarWinds Platform Service Manager</span>.</li>
            <li>Ensure all services are running.</li>
          </ol>
        </div>

        {/* Service Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Service Status Check</h2>
          <div className="mb-4">
            <label className="block font-medium mb-1">Are SolarWinds services running?</label>
            <div className="flex gap-4">
              <label><input type="radio" name="servicesRunning" value="yes" checked={formData.solarwinds.servicesRunning === "yes"} onChange={() => handleChange("solarwinds", "servicesRunning", "yes")} /> Yes</label>
              <label><input type="radio" name="servicesRunning" value="no"  checked={formData.solarwinds.servicesRunning === "no"}  onChange={() => handleChange("solarwinds", "servicesRunning", "no")}  /> No</label>
            </div>
          </div>
          {formData.solarwinds.servicesRunning === "no" && (
            <div className="mb-2">
              <label className="block font-medium mb-1 text-red-800">Ticket Number</label>
              <input
                type="text"
                placeholder="Enter ticket reference (e.g. INC123456)"
                value={formData.solarwinds.serviceDownTicket}
                onChange={(e) => handleChange("solarwinds", "serviceDownTicket", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>
          )}
        </div>

        {/* Alerts Generated */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Alert Generated?</h2>
          <p className="text-sm text-gray-700 mb-4">Confirm whether new or unresolved alerts were generated today.</p>
          <div className="flex gap-4">
            <label><input type="radio" name="alertsGenerated" value="yes" checked={formData.solarwinds.alertsGenerated === "yes"} onChange={() => handleChange("solarwinds", "alertsGenerated", "yes")} /> Yes</label>
            <label><input type="radio" name="alertsGenerated" value="no"  checked={formData.solarwinds.alertsGenerated === "no"}  onChange={() => handleChange("solarwinds", "alertsGenerated", "no")}  /> No</label>
          </div>
        </div>

        {formData.solarwinds.alertsGenerated === "yes" && (
          <>
            {renderAlertTable()}
            <div className="flex gap-4 mt-4">
              <button type="button" onClick={addAlertRow} className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded">➕ Add Row</button>
              <button type="button" onClick={deleteSelectedRows} className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded">🗑️ Delete Selected</button>
            </div>
          </>
        )}

        {isFormValid ? (
          <div className="flex justify-center mt-8">
            <button onClick={handleFinalSubmitAndReturn} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
              Submit Checklist
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-red-600 mt-8 max-w-md mx-auto">⚠️ {validationMessage}</p>
        )}
      </div>

      <div className="fixed bottom-4 left-4">
        <button onClick={onBackToDashboard} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Back</button>
      </div>
    </div>
  );
}
