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

  const handleChange = (section, ...args) => {
    if (section === "main") {
      const [field, value] = args;
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else if (section === "solarwinds") {
      const [field, value] = args;
      setFormData((prev) => ({
        ...prev,
        solarwinds: { ...prev.solarwinds, [field]: value }
      }));
    } else if (section === "alerts") {
      const [index, field, value] = args;
      setFormData((prev) => {
        const updatedAlerts = [...prev.solarwinds.alerts];
        updatedAlerts[index][field] = value;
        return {
          ...prev,
          solarwinds: {
            ...prev.solarwinds,
            alerts: updatedAlerts
          }
        };
      });
    }
  };

  const addAlertRow = () => {
    setFormData((prev) => ({
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

  const handleSubmit = () => {
    console.log("Submitted", formData);
  };

  const next = () => setStep((prev) => prev + 1);
  const prev = () => setStep((prev) => prev - 1);

  return { formData, handleChange, step, next, prev, handleSubmit, addAlertRow };
}
