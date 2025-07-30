import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";

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

  // Alert table logic (Clarion)
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

  // Local backup alert logic
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

  const validateForm = () => {
    const { alertsGenerated, alerts, localAlertsGenerated, localAlerts } = formData;

    // Validate Clarion table
    if (alertsGenerated === "yes") {
      for (let a of alerts) {
        if (!a.type || !a.vbrHost || !a.details || !a.ticket) {
          setIsFormValid(false);
          setValidationMessage("Please complete all fields for each Clarion alert.");
          return;
        }
      }
    }

    // Validate Local table
    if (localAlertsGenerated === "yes") {
      for (let a of localAlerts) {
        if (!a.type || !a.vbrHost || !a.details || !a.ticket) {
          setIsFormValid(false);
          setValidationMessage("Please complete all fields for each Local alert.");
          return;
        }
      }
    }

    setIsFormValid(true);
    setValidationMessage("");
  };

  const handleSubmit = () => {
    const {
      engineer,
      date,
      alertsGenerated,
      alerts,
      localAlertsGenerated,
      localAlerts,
    } = formData;

    const initials = (engineer || "")
  .split(" ")
  .map((n) => n[0]?.toUpperCase())
  .join("") || "XX";


    const safeDate = new Date(date);
    const formattedDate = isNaN(safeDate) ? "unknown-date" : safeDate.toISOString().split("T")[0];

    const doc = new jsPDF();
    addHeader(doc, "Veeam Backup Checklist", engineer, date);

    let y = 50;

    // Clarion Events Section
    doc.setFontSize(11);
    doc.text("Clarion Events Veeam Backup", 14, y);
    y += 7;
    doc.text("Use Clarion RDS or UK1-PAN01 to RDP into:", 14, y);
    y += 7;
    doc.text("CT - US2-VEEAM01 | TUL - US1-VEEAM01 | SG - SG-VEEAM01 | UK - UK1-VEEAM365", 14, y);
    y += 10;
    doc.text(`Alerts Generated: ${alertsGenerated || "N/A"}`, 14, y);
    y += 5;

    if (alertsGenerated === "yes" && alerts.length > 0) {
      const rows = alerts.map((a, i) => [
        i + 1,
        a.type,
        a.vbrHost,
        a.details,
        a.ticket,
        a.notes || "-",
      ]);

      autoTable(doc, {
        head: [["#", "Type", "VBR Host", "Details", "Ticket", "Notes"]],
        body: rows,
        startY: y + 5,
        styles: { fontSize: 9 },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // Local Veeam Backup Section
    doc.text("Local Veeam Backup", 14, y);
    y += 7;
    doc.text("https://192.168.69.219:1280/", 14, y);
    y += 7;
    doc.text("Sign In with your ADM account.", 14, y);
    y += 7;
    doc.text("Go to Management > Backup Jobs. Check both Virtual Machines and M365 tabs.", 14, y);
    y += 7;
    doc.text(`Alerts Generated: ${localAlertsGenerated || "N/A"}`, 14, y);
    y += 5;

    if (localAlertsGenerated === "yes" && localAlerts.length > 0) {
      const rows = localAlerts.map((a, i) => [
        i + 1,
        a.type,
        a.vbrHost,
        a.details,
        a.ticket,
        a.notes || "-",
      ]);

      autoTable(doc, {
        head: [["#", "Type", "VBR Host", "Details", "Ticket", "Notes"]],
        body: rows,
        startY: y + 5,
        styles: { fontSize: 9 },
      });
    }

    doc.save(`veeam-checklist-${initials}-${formattedDate}.pdf`);
  };

  const handleFinalSubmit = () => {
    if (isFormValid) handleSubmit();
  };

  const isSubmissionReady = () => {
    const alerts = formData.alerts || [];
    return formData.alertsGenerated === "yes" &&
      alerts.length > 0 &&
      alerts.every((a) => a.type && a.vbrHost && a.details && a.ticket);
  };

  const isLocalSubmissionReady = () => {
    const alerts = formData.localAlerts || [];
    return formData.localAlertsGenerated === "yes" &&
      alerts.length > 0 &&
      alerts.every((a) => a.type && a.vbrHost && a.details && a.ticket);
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
