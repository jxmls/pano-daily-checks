// src/hooks/useVmwareForm.js
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";
import { openEmail } from "../utils/email";

// Table row shape
const defaultRow = {
  alertType: "",
  host: "",
  details: "",
  ticket: "",
  notes: "",
  selected: false,
};

// Build an empty alert bucket
function emptyBucket() {
  return { alert: "", rows: [], selectAll: false };
}

export default function useVmwareForm() {
  const [formData, setFormData] = useState({
    engineer: localStorage.getItem("engineerName") || "",
    date: localStorage.getItem("checkDate") || "",
    vsan: {
      alerts: {
        clarion: emptyBucket(),
        panoptics: emptyBucket(),
        volac: emptyBucket(),
      },
    },
  });

  // ---------- mutation helpers ----------
  /**
   * handleChange(section, path, value)
   *  - section can be "vsan" or null (for top-level: engineer/date)
   *  - path is dot-notation under section, e.g. "alerts.clarion.alert"
   */
  const handleChange = (section, path, value) => {
    setFormData((prev) => {
      if (!section) {
        // top-level
        return { ...prev, [path]: value };
      }
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const root = clone[section] || (clone[section] = {});
      const parts = path.split(".");
      let ref = root;
      for (let i = 0; i < parts.length - 1; i++) {
        ref[parts[i]] = ref[parts[i]] ?? {};
        ref = ref[parts[i]];
      }
      ref[parts[parts.length - 1]] = value;
      return clone;
    });
  };

  const handleAlertChange = (section, key, index, field, value) => {
    setFormData((prev) => {
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const row = clone?.[section]?.alerts?.[key]?.rows?.[index];
      if (row) row[field] = value;
      return clone;
    });
  };

  const addAlertRow = (section, key) => {
    setFormData((prev) => {
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const bucket = clone?.[section]?.alerts?.[key];
      if (bucket) bucket.rows.push({ ...defaultRow });
      return clone;
    });
  };

  const toggleRowSelection = (section, key, index) => {
    setFormData((prev) => {
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const row = clone?.[section]?.alerts?.[key]?.rows?.[index];
      if (row) row.selected = !row.selected;
      return clone;
    });
  };

  const deleteSelectedRows = (section, key) => {
    setFormData((prev) => {
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const bucket = clone?.[section]?.alerts?.[key];
      if (bucket) {
        bucket.rows = bucket.rows.filter((r) => !r.selected);
        bucket.selectAll = false;
      }
      return clone;
    });
  };

  const toggleSelectAll = (section, key) => {
    setFormData((prev) => {
      const clone = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const bucket = clone?.[section]?.alerts?.[key];
      if (bucket) {
        const newVal = !bucket.selectAll;
        bucket.selectAll = newVal;
        bucket.rows = bucket.rows.map((r) => ({ ...r, selected: newVal }));
      }
      return clone;
    });
  };

  // ---------- email body builders ----------
  function buildSectionLines(name, bucket) {
    const lines = [];
    const status = bucket?.alert || "N/A";
    lines.push(`— ${name} —`);
    lines.push(`Alerts generated: ${status}`);
    if (status === "yes") {
      const rows = bucket?.rows || [];
      if (!rows.length) {
        lines.push("No rows entered (but 'yes' selected).");
      } else {
        rows.forEach((r, i) => {
          lines.push(
            `#${i + 1} • ${r.alertType || "Type"} | Host: ${r.host || "-"} | Details: ${r.details || "-"} | Ticket: ${r.ticket || "-"} | Notes: ${r.notes || "-"}`
          );
        });
      }
    } else {
      lines.push("No alerts.");
    }
    lines.push("");
    return lines;
  }

  function buildVmwareEmailBody(fd) {
    const p = fd || {};
    const date = p.date || new Date().toISOString().slice(0, 10);

    const lines = [];
    lines.push("VMware vSAN Checklist");
    lines.push(`Engineer: ${p.engineer || "Unknown"}`);
    lines.push(`Date: ${date}`);
    lines.push("");

    lines.push(...buildSectionLines("Clarion Events", p.vsan?.alerts?.clarion));
    lines.push(...buildSectionLines("Panoptics Global", p.vsan?.alerts?.panoptics));
    lines.push(...buildSectionLines("Volac International", p.vsan?.alerts?.volac));

    lines.push("— Meta —");
    lines.push("This message was generated from the daily checks app.");
    return lines.join("\n");
  }

  // Also expose per-row helpers (used by the form’s “📧 Email” buttons)
  const generateTicketSubject = (row) =>
    encodeURIComponent(`VMware vSAN Alert: ${row.host || "Unknown Host"}`);

  const generateTicketBody = (row, key) => {
    const map = { clarion: "Clarion Events", panoptics: "Panoptics Global", volac: "Volac International" };
    const site = map[key] || key;
    return encodeURIComponent(
      `Site: ${site}\n` +
        `Alert Type: ${row.alertType || "-"}\n` +
        `vSphere Host: ${row.host || "-"}\n` +
        `Details: ${row.details || "-"}\n` +
        `Ticket: ${row.ticket || "-"}\n` +
        `Notes: ${row.notes || "-"}\n`
    );
  };

  // ---------- PDF + openEmail (no download) ----------
  const handleSubmit = () => {
    const engineer = formData.engineer || localStorage.getItem("engineerName") || "Unknown";
    const date = formData.date || localStorage.getItem("checkDate") || new Date().toISOString();

    const doc = new jsPDF();
    addHeader(doc, "VMware vSAN Checklist", engineer, date);

    let y = 50;
    doc.setFontSize(11);

    const drawSection = (title, bucket) => {
      doc.text(title, 14, y); y += 6;
      doc.text(`Alerts generated: ${bucket.alert || "N/A"}`, 14, y); y += 4;

      if (bucket.alert === "yes" && (bucket.rows || []).length) {
        autoTable(doc, {
          head: [["#", "Type", "vSphere Host", "Details", "Ticket", "Notes"]],
          body: bucket.rows.map((r, i) => [
            i + 1,
            r.alertType || "",
            r.host || "",
            r.details || "",
            r.ticket || "-",
            r.notes || "-",
          ]),
          startY: y + 2,
          styles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        doc.text("No alerts.", 14, y); y += 8;
      }
    };

    drawSection("Clarion Events", formData.vsan.alerts.clarion);
    drawSection("Panoptics Global", formData.vsan.alerts.panoptics);
    drawSection("Volac International", formData.vsan.alerts.volac);

    const initials = engineer.split(" ").map((n) => n[0]?.toUpperCase()).join("") || "XX";
    const safeDate = new Date(date);
    const fnDate = isNaN(safeDate) ? "unknown-date" : safeDate.toISOString().split("T")[0];
    const filename = `vmware-vsan-checklist-${initials}-${fnDate}.pdf`;

    // Do NOT download — return to caller for Admin Portal; still generate data URL for future uses
    const dataUrl = doc.output("datauristring");

    // Open mail client with summary
    const subject = `VMware vSAN Daily Checklist - ${fnDate} - ${engineer}`;
    const body = buildVmwareEmailBody({ ...formData, engineer, date: fnDate });
    openEmail(subject, body);

    return { dataUrl, filename };
  };

  // Keep a light validation here if needed by caller (component does its own gating)
  useEffect(() => {
    // you can add hook-level validation or side-effects here later if needed
  }, [formData]);

  return {
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
  };
}
