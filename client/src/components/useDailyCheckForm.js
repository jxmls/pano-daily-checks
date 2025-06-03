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
    }
  });

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAlertChange = (index, field, value) => {
    const alerts = formData.solarwinds.alerts || [];
    const newAlerts = [...alerts];
    newAlerts[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: newAlerts,
      },
    }));
  };

  const addAlertRow = () => {
    const newAlert = {
      name: "",
      details: "",
      time: "",
      ticket: "",
      notes: "",
      selected: false,
    };
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [...(prev.solarwinds.alerts || []), newAlert],
      },
    }));
  };

  const toggleRowSelection = (index) => {
    const alerts = formData.solarwinds.alerts || [];
    const newAlerts = [...alerts];
    newAlerts[index].selected = !newAlerts[index].selected;
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: newAlerts,
      },
    }));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    const newAlerts = (formData.solarwinds.alerts || []).map((alert) => ({
      ...alert,
      selected: newSelectAll,
    }));
    setSelectAll(newSelectAll);
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: newAlerts,
      },
    }));
  };

  const deleteSelectedRows = () => {
    const filteredAlerts = (formData.solarwinds.alerts || []).filter(
      (alert) => !alert.selected
    );
    setFormData((prev) => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: filteredAlerts,
      },
    }));
    setSelectAll(false);
  };

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  const handleSubmit = () => {
    console.log("📤 Submitting form data:", formData);
    // Replace this with actual API call logic later
  };

  return {
    step,
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    toggleSelectAll,
    deleteSelectedRows,
    next,
    prev,
    handleSubmit,
    selectAll,
  };
}
