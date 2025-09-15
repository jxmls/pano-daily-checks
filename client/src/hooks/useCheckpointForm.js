// src/hooks/useCheckpointForm.js
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";
import { openEmail } from "../utils/email";
import { saveSubmission } from "../utils/SaveSubmission";
import { buildCheckpointEmailBody } from "../utils/emailBodies";

export default function useCheckpointForm(onBackToDashboard) {
  const [formData, setFormData] = useState({
    engineer: localStorage.getItem("engineerName") || "",
    date: localStorage.getItem("checkDate") || "",
    panoptics: { alertsGenerated: "", alerts: [], selectAll: false },
    brewery:   { alertsGenerated: "", alerts: [], selectAll: false },
  });

  const handleChange = (section, field, value) => {
    if (field === null) {
      setFormData((prev) => ({ ...prev, [section]: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    }
  };

  const handleAlertChange = (section, index, field, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      const rows = [...updated[section].alerts];
      rows[index] = { ...rows[index], [field]: value };
      updated[section] = { ...updated[section], alerts: rows };
      return updated;
    });
  };

  const addAlertRow = (section) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: [
          ...prev[section].alerts,
          { severity: "", name: "", machine: "", details: "", ticket: "", notes: "", selected: false },
        ],
      },
    }));
  };

  const toggleRowSelection = (section, index) => {
    setFormData((prev) => {
      const updated = { ...prev };
      const rows = [...updated[section].alerts];
      rows[index] = { ...rows[index], selected: !rows[index].selected };
      updated[section] = { ...updated[section], alerts: rows };
      return updated;
    });
  };

  const toggleSelectAll = (section) => {
    setFormData((prev) => {
      const updated = { ...prev };
      const newVal = !updated[section].selectAll;
      const rows = (updated[section].alerts || []).map((r) => ({ ...r, selected: newVal }));
      updated[section] = { ...updated[section], alerts: rows, selectAll: newVal };
      return updated;
    });
  };

  const deleteSelectedRows = (section) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: prev[section].alerts.filter((r) => !r.selected),
        selectAll: false,
      },
    }));
  };

  // ---------- validation helpers ----------
  const isValidAlert = (a) =>
    a.severity?.trim() && a.name?.trim() && a.machine?.trim() && a.details?.trim();

  function sectionOK(sectionData) {
    if (sectionData.alertsGenerated === "no") return true;
    if (sectionData.alertsGenerated === "yes") {
      const rows = sectionData.alerts || [];
      return rows.length > 0 && rows.every(isValidAlert);
    }
    return false; // unanswered
  }

  // ---------- PDF + email + save ----------
  const handleSubmit = () => {
    const engineer = formData.engineer || localStorage.getItem("engineerName") || "Unknown";
    const date = formData.date || localStorage.getItem("checkDate") || new Date().toISOString();

    const doc = new jsPDF();
    addHeader(doc, "Checkpoint Checklist", engineer, date);

    const addSection = (title, alerts, startY) => {
      doc.setFontSize(12);
      doc.text(title, 14, startY);

      if (alerts.length > 0) {
        autoTable(doc, {
          head: [["#", "Severity", "Name", "Machine", "Details", "Ticket", "Notes"]],
          body: alerts.map((a, idx) => [
            idx + 1,
            a.severity || "",
            a.name || "",
            a.machine || "",
            a.details || "",
            a.ticket || "",
            a.notes || "",
          ]),
          startY: startY + 8,
          styles: { fontSize: 9 },
        });
        return doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.text("No alerts entered.", 14, startY + 8);
        return startY + 16;
      }
    };

    let nextY = addSection("Panoptics Global Ltd", formData.panoptics.alerts, 50);
    addSection("The Brewery", formData.brewery.alerts, nextY);

    const dataUrl = doc.output("datauristring");

    const safeDate = new Date(date);
    const fnDate = isNaN(safeDate) ? "unknown-date" : safeDate.toISOString().split("T")[0];
    const subject = `Checkpoint Daily Check - ${fnDate} - ${engineer}`;

    const body = buildCheckpointEmailBody({ ...formData, engineer, date: fnDate });
    openEmail(subject, body);

    const passed = sectionOK(formData.panoptics) && sectionOK(formData.brewery);

    const filename = `checkpoint-checklist-${(engineer || "XX")
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("") || "XX"}-${fnDate}.pdf`;

    // ✅ Save for Admin Portal (localStorage) and API (dual-write)
    saveSubmission({
      module: "checkpoint",
      engineer,
      passed,
      meta: { clients: ["Panoptics", "The Brewery"], notes: "Submitted from CheckpointForm" },
      payload: formData,
      pdf: { name: filename, dataUrl },
    });

    return { dataUrl, filename };
  };

  const handleFinalSubmit = () => {
    const ok = sectionOK(formData.panoptics) && sectionOK(formData.brewery);
    if (ok) {
      const res = handleSubmit();
      if (typeof onBackToDashboard === "function") setTimeout(onBackToDashboard, 200);
      return res;
    }
    return undefined;
  };

  // expose validation state
  let isFormValid = true;
  let validationMessage = "";
  if (!formData.panoptics.alertsGenerated || !formData.brewery.alertsGenerated) {
    isFormValid = false;
    validationMessage = "Please select whether alerts were generated for both Panoptics and The Brewery.";
  } else if (formData.panoptics.alertsGenerated === "yes" && !sectionOK(formData.panoptics)) {
    isFormValid = false;
    validationMessage = "All Panoptics rows must include Severity, Name, Machine, and Details.";
  } else if (formData.brewery.alertsGenerated === "yes" && !sectionOK(formData.brewery)) {
    isFormValid = false;
    validationMessage = "All Brewery rows must include Severity, Name, Machine, and Details.";
  }

  return {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    toggleSelectAll,
    deleteSelectedRows,
    handleFinalSubmit,
    isFormValid,
    validationMessage,
  };
}
