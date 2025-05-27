import { useState } from "react";

export default function useDailyCheckForm() {
  const [step, setStep] = useState(1);
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
    if (section === "main") {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const handleAlertChange = (index, field, value) => {
    const newAlerts = [...formData.solarwinds.alerts];
    newAlerts[index][field] = value;
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: newAlerts
      }
    }));
  };

  const addAlertRow = () => {
    const newAlert = {
      name: "",
      details: "",
      time: "",
      ticket: "",
      notes: "",
      selected: false
    };
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [...prev.solarwinds.alerts, newAlert]
      }
    }));
  };

  const toggleRowSelection = (index) => {
    const newAlerts = [...formData.solarwinds.alerts];
    newAlerts[index].selected = !newAlerts[index].selected;
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: newAlerts
      }
    }));
  };

  const deleteSelectedRows = () => {
    const filteredAlerts = formData.solarwinds.alerts.filter(alert => !alert.selected);
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: filteredAlerts
      }
    }));
  };

  const next = () => setStep(prev => prev + 1);
  const prev = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    console.log("Submitting form data:", formData);
    // You could also POST this to an API endpoint here
  };

  return {
    step,
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    toggleRowSelection,
    deleteSelectedRows,
    next,
    prev,
    handleSubmit
  };
}
