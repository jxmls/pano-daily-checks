import { useState } from "react";

export default function useDailyCheckForm() {
  const [formData, setFormData] = useState({
    engineer: "",
    date: "",
    solarwinds: {
      servicesRunning: "",
      client: "",
      alertType: "",
      alerts: [],
    },
  });

  const [selectAll, setSelectAll] = useState(false);

  // Update a top-level or nested field in formData
  const handleChange = (section, field, value) => {
    if (!section) {
      setFormData((prev) => ({ ...prev, [field]: value }));
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

  // Update a specific field in a specific alert row
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

  // Add a new empty alert row
  const addAlertRow = () => {
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [...prev.solarwinds.alerts, {
          name: "",
          details: "",
          time: "",
          ticket: "",
          notes: "",
          selected: false,
        }],
      },
    }));
  };

  // Toggle row selection by index
  const toggleRowSelection = (index) => {
    setFormData((prev) => {
      const updatedAlerts = [...prev.solarwinds.alerts];
      updatedAlerts[index].selected = !updatedAlerts[index].selected;
      return {
        ...prev,
        solarwinds: {
          ...prev.solarwinds,
          alerts: updatedAlerts,
        },
      };
    });
  };

  // Delete all selected alert rows
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

  // Toggle select all
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

  // Submit handler (could be replaced with API call or local save)
  const handleSubmit = () => {
    console.log("Submitted form data:", formData);
    // For now we just log the data; in future you might send to API or store in DB
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
    handleSubmit,
  };
}
