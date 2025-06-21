// useVmwareForm.js
import { useState } from "react";

const defaultVmwareRow = {
  alertType: "",
  host: "",
  details: "",
  ticket: "",
  notes: "",
  selected: false,
};

export default function useVmwareForm() {
  const [formData, setFormData] = useState({
    engineer: "",
    date: "",
    vsan: {
      alerts: {},
    },
  });

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

  const handleAlertChange = (section, key, index, field, value) => {
    setFormData((prev) => {
      const updatedRows = [...(prev[section].alerts[key]?.rows || [])];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: updatedRows,
            },
          },
        },
      };
    });
  };

  const addAlertRow = (section, key) => {
    setFormData((prev) => {
      const current = prev[section].alerts[key]?.rows || [];
      const updatedRows = [...current, { ...defaultVmwareRow }];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: updatedRows,
              selectAll: false,
            },
          },
        },
      };
    });
  };

 const toggleRowSelection = (section, key, index) => {
  setFormData((prev) => {
    const sectionData = prev[section]?.alerts?.[key];
    if (!sectionData || !sectionData.rows || !sectionData.rows[index]) return prev;

    const updatedRows = [...sectionData.rows];
    updatedRows[index] = {
      ...updatedRows[index],
      selected: !updatedRows[index].selected,
    };

    return {
      ...prev,
      [section]: {
        ...prev[section],
        alerts: {
          ...prev[section].alerts,
          [key]: {
            ...prev[section].alerts[key],
            rows: updatedRows,
          },
        },
      },
    };
  });
};


  const deleteSelectedRows = (section, key) => {
    setFormData((prev) => {
      const remainingRows = prev[section].alerts[key].rows.filter((r) => !r.selected);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...prev[section].alerts[key],
              rows: remainingRows,
            },
          },
        },
      };
    });
  };

  const toggleSelectAll = (section, key) => {
    setFormData((prev) => {
      const current = prev[section].alerts[key] || { rows: [], selectAll: false };
      const newSelectAll = !current.selectAll;
      const updatedRows = current.rows.map((row) => ({ ...row, selected: newSelectAll }));
      return {
        ...prev,
        [section]: {
          ...prev[section],
          alerts: {
            ...prev[section].alerts,
            [key]: {
              ...current,
              rows: updatedRows,
              selectAll: newSelectAll,
            },
          },
        },
      };
    });
  };

  const handleSubmit = () => {
    console.log("Submitted form data:", formData);
  };

  const generateTicketBody = (alert, key) => {
  const engineer = typeof formData.engineer === "string"
    ? formData.engineer
    : formData.engineer?.name || "Unknown";

  return encodeURIComponent(
    `Environment: ${key}\n` +
    `Alert Type: ${alert.alertType}\n` +
    `Host: ${alert.host}\n` +
    `Details: ${alert.details}\n` +
    `Ticket: ${alert.ticket || "-"}\n` +
    `Notes: ${alert.notes || "-"}\n` +
    `Engineer: ${engineer}`
  );
};

const generateTicketSubject = (alert) =>
  encodeURIComponent(`vSAN Alert - ${alert.host || "Unknown Host"}`);

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
