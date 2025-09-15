// src/hooks/useVeeamForm.js
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";
import { openEmail } from "../utils/email";
import { buildVeeamEmailBody } from "../utils/emailBodies";

const defaultRow = {
  type: "",
  vbrHost: "",
  details: "",
  ticket: "",
  notes: "",
  selected: false,
};

const useVeeamForm = () => {
  const [formData, setFormData] = useState({
    engineer: localStorage.getItem("engineerName") || "",
    date: localStorage.getItem("checkDate") || "",
    alertsGenerated: "",
    alerts: [],
    selectAll: false,

    localAlertsGenerated: "",
    localAlerts: [],
    selectAllLocal: false,
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // -------- Clarion rows
  const handleAlertChange = (index, field, value) => {
    const updated = [...formData.alerts];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, alerts: updated }));
  };

  const addAlertRow = () => {
    setFormData((prev) => ({
      ...prev,
      alerts: [...prev.alerts, { ...defaultRow }],
    }));
  };

  const toggleRowSelection = (index) => {
    const updated = [...formData.alerts];
    updated[index].selected = !updated[index].selected;
    setFormData((prev) => ({ ...prev, alerts: updated }));
  };

  const deleteSelectedRows = () => {
    const updated = formData.alerts.filter((row) => !row.selected);
    setFormData((prev) => ({ ...prev, alerts: updated, selectAll: false }));
  };

  const toggleSelectAll = () => {
    const allSelected = !formData.selectAll;
    const updated = formData.alerts.map((r) => ({ ...r, selected: allSelected }));
    setFormData((prev) => ({ ...prev, alerts: updated, selectAll: allSelected }));
  };

  // -------- Local rows
  const handleLocalAlertChange = (index, field, value) => {
    const updated = [...formData.localAlerts];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, localAlerts: updated }));
  };

  const addLocalAlertRow = () => {
    setFormData((prev) => ({
      ...prev,
      localAlerts: [...prev.localAlerts, { ...defaultRow }],
    }));
  };

  const toggleLocalRowSelection = (index) => {
    const updated = [...formData.localAlerts];
    updated[index].selected = !updated[index].selected;
    setFormData((prev) => ({ ...prev, localAlerts: updated }));
  };

  const deleteSelectedLocalRows = () => {
    const updated = formData.localAlerts.filter((row) => !row.selected);
    setFormData((prev) => ({ ...prev, localAlerts: updated, selectAllLocal: false }));
  };

  const toggleSelectAllLocal = () => {
    const allSelected = !formData.selectAllLocal;
    const updated = formData.localAlerts.map((r) => ({ ...r, selected: allSelected }));
    setFormData((prev) => ({ ...prev, localAlerts: updated, selectAllLocal: allSelected }));
  };

  // -------- Validation
  const validateForm = () => {
    const { alertsGenerated, alerts, localAlertsGenerated, localAlerts } = formData;

    if (!alertsGenerated || !localAlertsGenerated) {
      setIsFormValid(false);
      setValidationMessage("Please answer both Clarion and Local 'Alert generated?' questions.");
      return;
    }

    if (alertsGenerated === "yes") {
      for (let a of alerts) {
        if (!a.type || !a.vbrHost || !a.details) {
          setIsFormValid(false);
          setValidationMessage("Complete all Clarion alert fields (Type, VBR Host, Details).");
          return;
        }
      }
    }

    if (localAlertsGenerated === "yes") {
      for (let a of localAlerts) {
        if (!a.type || !a.vbrHost || !a.details) {
          setIsFormValid(false);
          setValidationMessage("Complete all Local alert fields (Type, VBR Host, Details).");
          return;
        }
      }
    }

    setIsFormValid(true);
    setValidationMessage("");
  };

  // -------- PDF + open email (no download)
  const handleSubmit = () => {
    const {
      engineer = localStorage.getItem("engineerName") || "Unknown",
      date = localStorage.getItem("checkDate") || new Date().toISOString(),
      alertsGenerated,
      alerts = [],
      localAlertsGenerated,
      localAlerts = [],
    } = formData;

    const doc = new jsPDF();
    addHeader(doc, "Veeam Backup Checklist", engineer, date);
    let y = 50;

    doc.setFontSize(11);
    doc.text(`Engineer: ${engineer}`, 14, y); y += 6;
    doc.text(`Date: ${date}`, 14, y); y += 10;

    // Clarion
    doc.text("Clarion Events", 14, y); y += 6;
    doc.text(`Alerts generated: ${alertsGenerated || "N/A"}`, 14, y); y += 4;
    if (alertsGenerated === "yes" && alerts.length) {
      autoTable(doc, {
        head: [["#", "Type", "VBR Host", "Details", "Ticket", "Notes"]],
        body: alerts.map((a, i) => [i + 1, a.type, a.vbrHost, a.details, a.ticket || "-", a.notes || "-"]),
        startY: y + 2,
        styles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      doc.text("No alerts.", 14, y); y += 8;
    }

    // Local
    doc.text("Local Veeam", 14, y); y += 6;
    doc.text(`Alerts generated: ${localAlertsGenerated || "N/A"}`, 14, y); y += 4;
    if (localAlertsGenerated === "yes" && localAlerts.length) {
      autoTable(doc, {
        head: [["#", "Type", "VBR Host", "Details", "Ticket", "Notes"]],
        body: localAlerts.map((a, i) => [i + 1, a.type, a.vbrHost, a.details, a.ticket || "-", a.notes || "-"]),
        startY: y + 2,
        styles: { fontSize: 9 },
      });
    } else {
      doc.text("No alerts.", 14, y);
    }

    const initials = (engineer || "XX").split(" ").map((n) => n[0]?.toUpperCase()).join("") || "XX";
    const safeDate = new Date(date);
    const fnDate = isNaN(safeDate) ? "unknown-date" : safeDate.toISOString().split("T")[0];
    const filename = `veeam-checklist-${initials}-${fnDate}.pdf`;

    // Do NOT download — keep for Admin Portal preview
    const dataUrl = doc.output("datauristring");

    // Open default mail client with plain-text summary
    const subject = `Veeam Daily Checklist - ${fnDate} - ${engineer}`;
    const body = buildVeeamEmailBody({ ...formData, engineer, date: fnDate });
    openEmail(subject, body);

    // Return so caller (form component) can save the PDF to Admin Portal
    return { dataUrl, filename };
  };

  const handleFinalSubmit = () => {
    if (isFormValid) return handleSubmit();
    return undefined;
  };

  const isSubmissionReady = () => {
    const alerts = formData.alerts || [];
    return (
      formData.alertsGenerated === "yes" &&
      alerts.length > 0 &&
      alerts.every((a) => a.type && a.vbrHost && a.details)
    );
  };

  const isLocalSubmissionReady = () => {
    const alerts = formData.localAlerts || [];
    return (
      formData.localAlertsGenerated === "yes" &&
      alerts.length > 0 &&
      alerts.every((a) => a.type && a.vbrHost && a.details)
    );
  };

  return {
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
    isFormValid,
    validationMessage,
    isSubmissionReady,
    isLocalSubmissionReady,
  };
};

export default useVeeamForm;
