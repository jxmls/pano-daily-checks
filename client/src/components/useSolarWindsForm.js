// useSolarWindsForm.js
import { useState } from "react";

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
      client: "",
      serviceDownTicket: "",
      alerts: [],
      alertsGenerated: "",
    },
  });

  const [selectAll, setSelectAll] = useState(false);

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

  const handleSubmit = () => {
    console.log("Submitted form data:", formData);
  };

  const generateTicketBody = (alert) => {
    const engineer = typeof formData.engineer === "string"
      ? formData.engineer
      : formData.engineer?.name || "Unknown";

    return encodeURIComponent(
      `Client: ${formData.solarwinds.client || "Multiple"}\n` +
      `Alert Name: ${alert.name}\nDetails: ${alert.details}\n` +
      `Alert Type: ${alert.alertType || "N/A"}\n` +
      `Trigger Time: ${alert.time}\nAssign to: ${engineer}\nNotes: ${alert.notes}`
    );
  };

  const generateTicketSubject = (alert) =>
    encodeURIComponent(`SolarWinds Alert: ${alert.name}`);

  return {
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    toggleSelectAll,
    selectAll,
    handleSubmit,
    generateTicketBody,
    generateTicketSubject,
  };
}
