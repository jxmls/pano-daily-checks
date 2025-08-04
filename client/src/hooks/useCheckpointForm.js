import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addHeader } from "../utils/pdfutils";

export default function useCheckpointForm(onBackToDashboard) {
  const [formData, setFormData] = useState({
    engineer: "",
    date: "",
    panoptics: {
      alertsGenerated: "",
      alerts: [],
    },
    brewery: {
      alertsGenerated: "",
      alerts: [],
    },
    selectAllPanoptics: false,
    selectAllBrewery: false,
  });

  const handleChange = (section, field, value) => {
    if (field === null) {
      setFormData((prev) => ({
        ...prev,
        [section]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handleAlertChange = (section, index, field, value) => {
    const updatedAlerts = [...formData[section].alerts];
    updatedAlerts[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: updatedAlerts,
      },
    }));
  };

  const addAlertRow = (section) => {
    const updatedAlerts = [
      ...formData[section].alerts,
      {
        severity: "",
        name: "",
        machine: "",
        details: "",
        ticket: "",
        notes: "",
        selected: false,
      },
    ];
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: updatedAlerts,
      },
    }));
  };

  const toggleRowSelection = (section, index) => {
    const updatedAlerts = [...formData[section].alerts];
    updatedAlerts[index].selected = !updatedAlerts[index].selected;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: updatedAlerts,
      },
    }));
  };

  const toggleSelectAll = (section) => {
    const allSelected = !formData[`selectAll${capitalize(section)}`];
    const updatedAlerts = formData[section].alerts.map((row) => ({
      ...row,
      selected: allSelected,
    }));
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: updatedAlerts,
      },
      [`selectAll${capitalize(section)}`]: allSelected,
    }));
  };

  const deleteSelectedRows = (section) => {
    const updatedAlerts = formData[section].alerts.filter((row) => !row.selected);
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        alerts: updatedAlerts,
      },
    }));
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // 🔒 Validation logic
  const isYes = (val) => val === "yes";

  const isValidAlert = (a) =>
    a.severity?.trim() &&
    a.name?.trim() &&
    a.machine?.trim() &&
    a.details?.trim(); // no longer require ticket

  let isFormValid = true;
  let validationMessage = "";

  if (!formData.panoptics.alertsGenerated || !formData.brewery.alertsGenerated) {
    isFormValid = false;
    validationMessage =
      "Please select whether alerts were generated for both Panoptics and The Brewery.";
  } else if (isYes(formData.panoptics.alertsGenerated)) {
    if (formData.panoptics.alerts.length === 0) {
      isFormValid = false;
      validationMessage = "Please add at least one alert row for Panoptics.";
    } else if (!formData.panoptics.alerts.every(isValidAlert)) {
      isFormValid = false;
      validationMessage =
        "All Panoptics alert rows must have Severity, Name, Machine, and Details filled.";
    }
  }

  if (isFormValid && isYes(formData.brewery.alertsGenerated)) {
    if (formData.brewery.alerts.length === 0) {
      isFormValid = false;
      validationMessage = "Please add at least one alert row for The Brewery.";
    } else if (!formData.brewery.alerts.every(isValidAlert)) {
      isFormValid = false;
      validationMessage =
        "All Brewery alert rows must have Severity, Name, Machine, and Details filled.";
    }
  }

  const generateEmailBody = () => {
    const { engineer, date, panoptics, brewery } = formData;

    const formatAlerts = (alerts) =>
      alerts
        .map(
          (a, i) =>
            `${i + 1}. [${a.severity || "-"}] ${a.name || "Unnamed Alert"} | ${a.machine || "N/A"} | ${a.details || "No details"} | Ticket: ${
              a.ticket || "N/A"
            }`
        )
        .join("\n");

    return `
Checkpoint Daily Check

Engineer: ${engineer || "Unknown"}
Date: ${date || "Unknown"}

--- Panoptics ---
Alerts Generated: ${panoptics.alertsGenerated || "N/A"}
${formatAlerts(panoptics.alerts)}

--- The Brewery ---
Alerts Generated: ${brewery.alertsGenerated || "N/A"}
${formatAlerts(brewery.alerts)}
    `.trim();
  };

  const handleSubmit = () => {
    const { engineer, date, panoptics, brewery } = formData;
    const initials =
      (engineer || "")
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .join("") || "XX";

    const dateObj = new Date(date);
    const formattedDate = !isNaN(dateObj)
      ? dateObj.toISOString().split("T")[0]
      : "unknown-date";

    const doc = new jsPDF();
    addHeader(doc, "Checkpoint Checklist", engineer, formattedDate);

    const addSection = (title, alerts, startY) => {
      doc.setFontSize(12);
      doc.text(title, 14, startY);

      if (alerts.length > 0) {
        const alertRows = alerts.map((a, idx) => [
          idx + 1,
          a.severity || "",
          a.name || "",
          a.machine || "",
          a.details || "",
          a.ticket || "",
          a.notes || "",
        ]);

        autoTable(doc, {
          head: [["#", "Severity", "Name", "Machine", "Details", "Ticket", "Notes"]],
          body: alertRows,
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

    let nextY = addSection("Panoptics Check Point", panoptics.alerts, 50);
    addSection("The Brewery Check Point", brewery.alerts, nextY);

    doc.save(`checkpoint-checklist-${initials}-${formattedDate}.pdf`);
  };

  const handleFinalSubmit = () => {
    if (isFormValid) {
      handleSubmit();
      if (typeof onBackToDashboard === "function") {
        setTimeout(onBackToDashboard, 300);
      }
    }
  };

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
    generateEmailBody,
  };
}
