import { useState } from "react";

export default function useDailyCheckForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: "",
    engineer: "",
    solarwinds: {
      servicesRunning: "",
      client: "Multiple",
      alertType: "",
      alerts: [
        { name: "", details: "", time: "", ticket: "", notes: "" }
      ]
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
    const updatedAlerts = [...formData.solarwinds.alerts];
    updatedAlerts[index][field] = value;
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: updatedAlerts
      }
    }));
  };

  const addAlertRow = () => {
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: [
          ...prev.solarwinds.alerts,
          { name: "", details: "", time: "", ticket: "", notes: "" }
        ]
      }
    }));
  };

  const deleteAlertRow = (index) => {
    const updatedAlerts = formData.solarwinds.alerts.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      solarwinds: {
        ...prev.solarwinds,
        alerts: updatedAlerts
      }
    }));
  };

  const next = () => setStep(prev => prev + 1);
  const prev = () => setStep(prev => prev - 1);
  const handleSubmit = () => console.log("Submitted", formData);

  return {
    step,
    formData,
    handleChange,
    handleAlertChange,
    addAlertRow,
    deleteAlertRow,
    next,
    prev,
    handleSubmit
  };
}
