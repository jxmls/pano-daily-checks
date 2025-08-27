import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";

const defaultRowTemplate = {
  alertType: "",
  name: "",
  details: "",
  time: "",
  ticket: "",
  notes: "",
  selected: false,
};

export default function useSolarWindsForm() {
  const [formData, setFormData] = useState({
    engineer: "",
    date: "",
    solarwinds: {
      servicesRunning: "",
      client: "Multiple",
      serviceDownTicket: "",
      alerts: [],
      alertsGenerated: "",
    },
  });

  const [selectAll, setSelectAll] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    validateForm();
  }, [formData]);

  // allow "root" to set top-level keys (engineer/date)
  const handleChange = (section, path, value) => {
    setFormData((prevData) => {
      const updated = { ...prevData };
      if (section === "root") {
        updated[path] = value;
        return updated;
      }
      if (!updated[section]) updated[section] = {};
      const keys = path.split(".");
      let temp = updated[section];
      for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) temp[keys[i]] = {};
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleAlertChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedAlerts = [...(prev.solarwinds.alerts || [])];
      updatedAlerts[index] = { ...updatedAlerts[index], [field]: value };
      return {
        ...prev,
        solarwinds: { ...prev.solarwinds, alerts: updatedAlerts },
      };
    });
  };

  const addAlertRow = () => {
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [...(prev.solarwinds.alerts || []), { ...defaultRowTemplate }],
      },
    }));
  };

  const toggleRowSelection = (index) => {
    setFormData((prev) => {
      const updated = (prev.solarwinds.alerts || []).map((a, i) =>
        i === index ? { ...a, selected: !a.selected } : a
      );
      return { ...prev, solarwinds: { ...prev.solarwinds, alerts: updated } };
    });
  };

  const deleteSelectedRows = () => {
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: (prev.solarwinds.alerts || []).filter((a) => !a.selected),
      },
    }));
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    setSelectAll((prev) => !prev);
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: (prev.solarwinds.alerts || []).map((a) => ({
          ...a,
          selected: !selectAll,
        })),
      },
    }));
  };

  // ✅ VALIDATION: for each alert row, Ticket OR Notes is required (Type, Name, Details, Time are mandatory)
  const validateForm = () => {
    const { servicesRunning, alertsGenerated, alerts } = formData.solarwinds;

    if (!servicesRunning || !alertsGenerated) {
      setIsFormValid(false);
      setValidationMessage(
        'Please answer both “services running” and “alert generated” before submitting.'
      );
      return;
    }

    if (alertsGenerated === "yes") {
      for (const a of alerts || []) {
        const hasType = !!a.alertType?.trim();
        const hasName = !!a.name?.trim();
        const hasDetails = !!a.details?.trim();
        const hasTime = !!a.time?.trim();
        const hasTicket = !!a.ticket?.trim();
        const hasNotes = !!a.notes?.trim();

        if (!hasType || !hasName || !hasDetails || !hasTime) {
          setIsFormValid(false);
          setValidationMessage(
            "Complete all alert fields (Type, Name, Details, Time) for each alert."
          );
          return;
        }
        if (!hasTicket && !hasNotes) {
          setIsFormValid(false);
          setValidationMessage(
            "Each alert must include a Ticket OR Notes (Notes can be used when no ticket is raised)."
          );
          return;
        }
      }
    }

    setIsFormValid(true);
    setValidationMessage("");
  };

  // ----- Email body for SW
  function buildSolarWindsEmailBody(fd) {
    const s = (fd && fd.solarwinds) || {};
    const engineer = fd.engineer || localStorage.getItem("engineerName") || "Unknown";
    const date = fd.date || new Date().toISOString().slice(0, 10);

    const lines = [];
    lines.push("SolarWinds Daily Checklist");
    lines.push(`Engineer: ${engineer}`);
    lines.push(`Date: ${date}`);
    lines.push("");
    lines.push(`Services Running: ${s.servicesRunning || "N/A"}`);
    if (String(s.servicesRunning).toLowerCase() === "no") {
      lines.push(`Service Down Ticket: ${s.serviceDownTicket || "-"}`);
    }
    lines.push(`Client: ${s.client || "Multiple"}`);
    lines.push(`Alerts Generated: ${s.alertsGenerated || "N/A"}`);

    if (s.alertsGenerated === "yes" && Array.isArray(s.alerts) && s.alerts.length) {
      lines.push("");
      lines.push("Alerts:");
      s.alerts.forEach((a, i) => {
        lines.push(
          `#${i + 1} • ${a.alertType || "Type"} | ${a.name || "Name"} | ${a.details || "-"} | Time: ${a.time || "-"} | Ticket: ${a.ticket || "-"} | Notes: ${a.notes || "-"}`
        );
      });
    } else {
      lines.push("");
      lines.push("No alerts.");
    }

    lines.push("");
    lines.push("— Meta —");
    lines.push("This message was generated from the daily checks app.");
    return lines.join("\n");
  }

  // ----- PDF + Email (no download)
  const handleSubmit = () => {
    const solarwinds = formData.solarwinds || {};
    const engineer = formData.engineer || localStorage.getItem("engineerName") || "Unknown";
    const date = formData.date || localStorage.getItem("checkDate") || new Date().toISOString();

    // Build PDF for Admin Portal
    const doc = new jsPDF();
    addHeader(doc, "SolarWinds Daily Checklist", engineer, date);

    let y = 50;
    doc.setFontSize(11);
    doc.text(`Services Running: ${solarwinds.servicesRunning || "N/A"}`, 14, y); y += 7;
    if (solarwinds.servicesRunning === "no") {
      doc.text(`Service Down Ticket: ${solarwinds.serviceDownTicket || "-"}`, 14, y); y += 7;
    }
    doc.text(`Client: ${solarwinds.client || "Multiple"}`, 14, y); y += 7;
    doc.text(`Alerts Generated: ${solarwinds.alertsGenerated || "N/A"}`, 14, y); y += 7;

    if (solarwinds.alertsGenerated === "yes" && (solarwinds.alerts || []).length > 0) {
      const alertRows = solarwinds.alerts.map((a, idx) => [
        idx + 1,
        a.alertType || "",
        a.name || "",
        a.details || "",
        a.time || "",
        a.ticket || "",
        a.notes || "",
      ]);

      autoTable(doc, {
        head: [["#", "Type", "Name", "Details", "Time", "Ticket", "Notes"]],
        body: alertRows,
        startY: y + 3,
        styles: { fontSize: 9 },
      });
    }

    const initials = engineer.split(" ").map((n) => n[0]?.toUpperCase()).join("") || "XX";
    const dateObj = new Date(date);
    const fnDate = !isNaN(dateObj) ? dateObj.toISOString().split("T")[0] : "unknown-date";
    const filename = `solarwinds-checklist-${initials}-${fnDate}.pdf`;

    // Do NOT download — keep for Admin Portal
    const dataUrl = doc.output("datauristring");

    // Open email client with plaintext summary
    const subject = `SolarWinds Daily Checklist - ${fnDate} - ${engineer}`;
    const body = buildSolarWindsEmailBody({ ...formData, engineer, date: fnDate });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return { dataUrl, filename };
  };

  const handleFinalSubmit = () => {
    if (isFormValid) {
      return handleSubmit();
    }
    return undefined;
  };

  const generateTicketSubject = (alert) =>
    encodeURIComponent(`SolarWinds Alert: ${alert.name}`);

  const generateTicketBody = (alert) => {
    const engineer =
      typeof formData.engineer === "string"
        ? formData.engineer
        : formData.engineer?.name || "Unknown";

    return encodeURIComponent(
      `Client: ${formData.solarwinds.client || "Multiple"}\n` +
        `Alert Name: ${alert.name}\nDetails: ${alert.details}\n` +
        `Alert Type: ${alert.alertType || "N/A"}\n` +
        `Trigger Time: ${alert.time}\nAssign to: ${engineer}\nNotes: ${alert.notes}`
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
    selectAll,
    isFormValid,
    validationMessage,
    handleSubmit,
    handleFinalSubmit,
    generateTicketBody,
    generateTicketSubject,
  };
}
