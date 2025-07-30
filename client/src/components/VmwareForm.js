// VmwareForm.js

import React, { useEffect } from "react";
import useVmwareForm from "../hooks/useVmwareForm";

export default function VmwareForm({ onBackToDashboard }) {
  const {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    handleSubmit,
    generateTicketBody,
    generateTicketSubject,
  } = useVmwareForm();

  const isSubmissionReady = () => {
    const requiredKeys = ["clarion", "panoptics", "volac"];
    const alerts = formData.vsan?.alerts || {};

    return requiredKeys.every((key) => {
      const alert = alerts[key];
      const alertValue = alert?.alert;

      if (alertValue !== "yes" && alertValue !== "no") return false;

      if (alertValue === "yes") {
        const rows = alert?.rows || [];
        if (rows.length === 0) return false;

        return rows.every(
          (row) =>
            row.alertType?.trim() &&
            row.host?.trim() &&
            row.details?.trim() &&
            row.ticket?.trim()
        );
      }

      return true;
    });
  };

  useEffect(() => {
    const storedEngineer = localStorage.getItem("engineerName") || "";
    const storedDate = localStorage.getItem("checkDate") || "";
    handleChange(null, "engineer", storedEngineer);
    handleChange(null, "date", storedDate);

    const requiredKeys = ["clarion", "panoptics", "volac"];
    requiredKeys.forEach((key) => {
      if (!formData.vsan.alerts[key]) {
        handleChange("vsan", `alerts.${key}.alert`, "");
      }
    });
  }, []);

  const openEmailClient = (row, key) => {
    const subject = decodeURIComponent(generateTicketSubject(row));
    const body = decodeURIComponent(generateTicketBody(row, key));
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const renderTable = (key) => {
    const rows = formData.vsan?.alerts?.[key]?.rows || [];
    return (
      <div className="mb-6">
        <table className="min-w-full border text-sm shadow-sm rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={formData.vsan?.alerts?.[key]?.selectAll || false}
                  onChange={() => toggleSelectAll("vsan", key)}
                />
              </th>
              <th className="border px-3 py-2">Alert Type</th>
              <th className="border px-3 py-2">vSphere Host</th>
              <th className="border px-3 py-2">Details</th>
              <th className="border px-3 py-2">Ticket</th>
              <th className="border px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((alert, index) => (
              <tr
                key={index}
                onClick={() => toggleRowSelection("vsan", key, index)}
                className={`cursor-pointer ${
                  alert.selected
                    ? "bg-blue-100"
                    : index % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                }`}
              >
                <td className="border px-3 py-2 text-center">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowSelection("vsan", key, index);
                    }}
                    className="inline-block cursor-pointer select-none"
                  >
                    {alert.selected ? (
                      <span className="text-green-600 text-lg">✅</span>
                    ) : (
                      <span className="text-gray-400 text-lg">☐</span>
                    )}
                  </div>
                </td>
                <td className="border px-3 py-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={alert.alertType || ""}
                      onChange={(e) =>
                        handleAlertChange("vsan", key, index, "alertType", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="Warning">Warning</option>
                      <option value="Serious">Serious</option>
                      <option value="Critical">Critical</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </td>
                <td className="border px-3 py-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={alert.host || ""}
                      onChange={(e) =>
                        handleAlertChange("vsan", key, index, "host", e.target.value)
                      }
                    />
                  </div>
                </td>
                <td className="border px-3 py-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={alert.details || ""}
                      onChange={(e) =>
                        handleAlertChange("vsan", key, index, "details", e.target.value)
                      }
                    />
                  </div>
                </td>
                <td className="border px-3 py-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={alert.ticket || ""}
                      onChange={(e) =>
                        handleAlertChange("vsan", key, index, "ticket", e.target.value)
                      }
                    />
                  </div>
                </td>
                <td className="border px-3 py-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={alert.notes || ""}
                      onChange={(e) =>
                        handleAlertChange("vsan", key, index, "notes", e.target.value)
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={() => addAlertRow("vsan", key)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-1 rounded"
          >
            ➕ Add Row
          </button>
          <button
            type="button"
            onClick={() => deleteSelectedRows("vsan", key)}
            className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-1 rounded"
          >
            🗑️ Delete Selected
          </button>

          {rows
            .filter((r) => r.selected && r.alertType && r.host && r.details)
            .map((row, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openEmailClient(row, key)}
                className="bg-green-100 hover:bg-green-200 text-green-700 text-sm px-3 py-1 rounded"
              >
                📧 Email ({row.host})
              </button>
            ))}
        </div>
      </div>
    );
  };

  const renderSection = (title, description, links, key) => (
    <div className="mb-8">
      <h2 className="text-xl font-bold mt-8 mb-2">{title}</h2>
      <p className="mb-4">{description}</p>
      <ul className="list-disc ml-6 mb-4">
        {links.map((link, i) => (
          <li key={i}>
            {link.label} -{" "}
            <a className="text-blue-600 underline" href={link.href}>
              {link.href}
            </a>
          </li>
        ))}
      </ul>
      <div className="mb-4">
        <label className="block font-medium mb-1">Alert generated?</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name={`alertGenerated-${key}`}
              value="yes"
              checked={formData.vsan?.alerts?.[key]?.alert === "yes"}
              onChange={() => handleChange("vsan", `alerts.${key}.alert`, "yes")}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name={`alertGenerated-${key}`}
              value="no"
              checked={formData.vsan?.alerts?.[key]?.alert === "no"}
              onChange={() => handleChange("vsan", `alerts.${key}.alert`, "no")}
            />{" "}
            No
          </label>
        </div>
      </div>
      {formData.vsan?.alerts?.[key]?.alert === "yes" && renderTable(key)}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">VMware vSAN Checks</h1>

      {renderSection(
        "Clarion Events Ltd.",
        "For accessing the following VMware vSAN environments, please use Clarion RDS farm or UK1-PAN01 and then use Google Chrome to browse.",
        [
          { label: "CT", href: "https://us2-vcsa01.clarionevents.local/" },
          { label: "RP", href: "https://10.75.4.201" },
          { label: "RP", href: "https://10.75.4.202" },
          { label: "TUL", href: "https://us1-vcsa01.clarionevents.local/" },
          { label: "TUL", href: "https://us3-vcsa01.clarionevents.local/" },
          { label: "SG", href: "https://sg-vc-02.clarionevents.local/" },
          { label: "UK", href: "https://clr-vcs01.clarionevents.local/" },
        ],
        "clarion"
      )}

      {renderSection(
        "Panoptics Global Ltd.",
        "Following VMware vSAN environments can be accessed from your laptop itself if connected to Always On VPN, alternatively connect to Panoptics RDS then open Google Chrome or your preferred browser and navigate to the following:",
        [
          { label: "Production", href: "https://uk-pan-vcs01.panoptics.local/ui/" },
          { label: "Production", href: "https://172.16.17.200/" },
          { label: "Production", href: "https://172.16.17.88/ui/" },
          { label: "Backup", href: "https://backup-vsan-vcsa01.panoptics.local/" },
        ],
        "panoptics"
      )}

      {renderSection(
        "Volac International",
        "To access Volac International VMware vSAN environment, you will need to first connect to Volac VPN using Cisco AnyConnect VPN client on your laptop. Once connected, open Google Chrome or your preferred browser and navigate to:",
        [{ label: "", href: "https://10.22.1.200/" }],
        "volac"
      )}

      {isSubmissionReady() ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              handleSubmit();
              onBackToDashboard();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Checklist
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-red-600 mt-8 max-w-md mx-auto">
          ⚠️ Please answer all “Alert generated?” questions and fill in all required fields (Alert
          Type, Host, Details, Ticket) for any section where you selected “Yes”.
        </p>
      )}

      <div className="mt-10">
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
