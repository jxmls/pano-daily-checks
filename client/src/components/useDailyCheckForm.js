import { useState } from "react";

export default function useDailyCheckForm() {
  const [step, setStep] = useState(1);
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    engineer: "",
    solarwinds: {
      servicesRunning: "",
      client: "",
      alertType: "",
      alerts: []
    },
    vsan: {
      client: "",
      alert: "",
      alerts: []
    }
  });

  const handleChange = (section, field, value) => {
    if (field === null) {
      setFormData((prev) => ({ ...prev, [section]: value }));
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

  const handleAlertChange = (index, field, value) => {
    const targetSection = formData.solarwinds.alerts.length > 0 ? "solarwinds" : "vsan";
    const alerts = formData[targetSection].alerts || [];
    const newAlerts = [...alerts];
    newAlerts[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      [targetSection]: {
        ...prev[targetSection],
        alerts: newAlerts,
      },
    }));
  };

  const addAlertRow = () => {
    const targetSection = step === 2 ? "solarwinds" : "vsan";
    const newAlert = targetSection === "solarwinds" ? {
      name: "",
      details: "",
      time: "",
      ticket: "",
      notes: "",
      selected: false
    } : {
      host: "",
      type: "",
      details: "",
      selected: false
    };
    setFormData((prev) => ({
      ...prev,
      [targetSection]: {
        ...prev[targetSection],
        alerts: [...(prev[targetSection].alerts || []), newAlert]
      }
    }));
  };

  const toggleRowSelection = (index) => {
    const targetSection = step === 2 ? "solarwinds" : "vsan";
    const alerts = formData[targetSection].alerts || [];
    const newAlerts = [...alerts];
    newAlerts[index].selected = !newAlerts[index].selected;
    setFormData((prev) => ({
      ...prev,
      [targetSection]: {
        ...prev[targetSection],
        alerts: newAlerts
      }
    }));
  };

  const toggleSelectAll = () => {
    const targetSection = step === 2 ? "solarwinds" : "vsan";
    const newSelectAll = !selectAll;
    const newAlerts = (formData[targetSection].alerts || []).map((alert) => ({
      ...alert,
      selected: newSelectAll
    }));
    setSelectAll(newSelectAll);
    setFormData((prev) => ({
      ...prev,
      [targetSection]: {
        ...prev[targetSection],
        alerts: newAlerts
      }
    }));
  };

  const deleteSelectedRows = () => {
    const targetSection = step === 2 ? "solarwinds" : "vsan";
    const filteredAlerts = (formData[targetSection].alerts || []).filter(
      (alert) => !alert.selected
    );
    setFormData((prev) => ({
      ...prev,
      [targetSection]: {
        ...prev[targetSection],
        alerts: filteredAlerts
      }
    }));
    setSelectAll(false);
  };

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  const handleSubmit = () => {
    console.log("📤 Submitting form data:", formData);
    // Replace with actual API call
  };

  return {
    step,
    formData,
    setFormData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    toggleSelectAll,
    deleteSelectedRows,
    next,
    prev,
    handleSubmit,
    selectAll
  };
}
