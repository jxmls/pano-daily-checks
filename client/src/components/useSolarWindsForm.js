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

  const handleChange = (section, path, value) => {
    setFormData((prevData) => {
      const updated = { ...prevData };
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
      const updatedAlerts = [...prev.solarwinds.alerts];
      updatedAlerts[index] = { ...updatedAlerts[index], [field]: value };
      return {
        ...prev,
        solarwinds: {
          ...prev.solarwinds,
          alerts: updatedAlerts,
        },
      };
    });
  };

  const addAlertRow = () => {
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [...prev.solarwinds.alerts, { ...defaultRowTemplate }],
      },
    }));
  };

  const toggleRowSelection = (index) => {
    setFormData((prev) => {
      const updatedAlerts = prev.solarwinds.alerts.map((alert, i) =>
        i === index ? { ...alert, selected: !alert.selected } : alert
      );
      return {
        ...prev,
        solarwinds: {
          ...prev.solarwinds,
          alerts: updatedAlerts,
        },
      };
    });
  };

  const deleteSelectedRows = () => {
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: prev.solarwinds.alerts.filter((alert) => !alert.selected),
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
        alerts: prev.solarwinds.alerts.map((alert) => ({
          ...alert,
          selected: !selectAll,
        })),
      },
    }));
  };

  const validateForm = () => {
    const { servicesRunning, alertsGenerated, alerts } = formData.solarwinds;

    if (!servicesRunning || !alertsGenerated) {
      setIsFormValid(false);
      setValidationMessage(
        "⚠️ Please answer all “services running” and “alert generated” questions before submitting."
      );
      return;
    }

    if (alertsGenerated === "yes") {
      for (let alert of alerts) {
        const hasTicketNA = ["na", "n/a", "NA", "N/A"].includes(alert.ticket?.trim());
        if (
          !alert.alertType ||
          !alert.name ||
          !alert.details ||
          !alert.time ||
          !alert.ticket ||
          (hasTicketNA && !alert.notes)
        ) {
          setIsFormValid(false);
          setValidationMessage(
            "⚠️ Please complete all alert fields (Type, Alert Name, Details, Trigger Time, Ticket), and Notes if Ticket is N/A."
          );
          return;
        }
      }
    }

    setIsFormValid(true);
    setValidationMessage("");
  };
const handleSubmit = () => {
  const solarwinds = formData.solarwinds || {};
  const engineer =
    formData.engineer || localStorage.getItem("engineerName") || "Unknown";
  const date =
    formData.date || localStorage.getItem("checkDate") || new Date().toISOString();

  const initials =
    engineer
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("") || "XX";

  const dateObj = new Date(date);
  const formattedDate = !isNaN(dateObj)
    ? dateObj.toISOString().split("T")[0]
    : "unknown-date";

  const doc = new jsPDF();

  // 🔹 Shared header with logo and title
  addHeader(doc, "SolarWinds Daily Checklist", engineer, formattedDate);

  let y = 50;

  doc.setFontSize(11);
  doc.text(`Services Running: ${solarwinds.servicesRunning || "N/A"}`, 14, y);
  y += 7;

  if (solarwinds.servicesRunning === "no") {
    doc.text(
      `Service Down Ticket: ${solarwinds.serviceDownTicket || "-"}`,
      14,
      y
    );
    y += 7;
  }

  doc.text(`Client: ${solarwinds.client || "Multiple"}`, 14, y);
  y += 7;

  doc.text(`Alerts Generated: ${solarwinds.alertsGenerated || "N/A"}`, 14, y);
  y += 7;

  if (solarwinds.alertsGenerated === "yes" && solarwinds.alerts.length > 0) {
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

  doc.save(`solarwinds-checklist-${initials}-${formattedDate}.pdf`);
};



  const handleFinalSubmit = () => {
    if (isFormValid) {
      handleSubmit();
    }
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
