"use client";

import { useState, useEffect, useCallback } from "react";
import type { SolarWindsFormData, SolarWindsAlertRow } from "@/types";

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const blankRow = (): SolarWindsAlertRow => ({
  alertType: "", name: "", details: "", time: nowLocal(),
  ticket: "", notes: "", selected: false,
});

const initialState = (): SolarWindsFormData => ({
  engineer: "",
  date: "",
  solarwinds: {
    servicesRunning: "",
    client: "Multiple",
    serviceDownTicket: "",
    alertsGenerated: "",
    alerts: [],
  },
});

export function useSolarWindsForm() {
  const [formData, setFormData] = useState<SolarWindsFormData>(initialState);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const validate = useCallback((data: SolarWindsFormData) => {
    const s = data.solarwinds;
    if (!s.servicesRunning || !s.alertsGenerated) {
      setIsFormValid(false);
      setValidationMessage('Answer both "services running" and "alert generated" before submitting.');
      return;
    }
    if (s.alertsGenerated === "yes") {
      for (const a of s.alerts) {
        if (!a.alertType?.trim() || !a.name?.trim() || !a.details?.trim() || !a.time?.trim()) {
          setIsFormValid(false);
          setValidationMessage("Complete all alert fields (Type, Name, Details, Time).");
          return;
        }
        if (!a.ticket?.trim() && !a.notes?.trim()) {
          setIsFormValid(false);
          setValidationMessage("Each alert needs a Ticket or Notes.");
          return;
        }
      }
    }
    setIsFormValid(true);
    setValidationMessage("");
  }, []);

  useEffect(() => { validate(formData); }, [formData, validate]);

  const setField = (field: "engineer" | "date", value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const setSolarField = (path: string, value: string) =>
    setFormData((p) => {
      const sw = { ...p.solarwinds };
      (sw as Record<string, unknown>)[path] = value;
      return { ...p, solarwinds: sw };
    });

  const updateAlert = (index: number, field: keyof SolarWindsAlertRow, value: string | boolean) =>
    setFormData((p) => {
      const alerts = p.solarwinds.alerts.map((a, i) => i === index ? { ...a, [field]: value } : a);
      return { ...p, solarwinds: { ...p.solarwinds, alerts } };
    });

  const addRow = () =>
    setFormData((p) => ({ ...p, solarwinds: { ...p.solarwinds, alerts: [...p.solarwinds.alerts, blankRow()] } }));

  const deleteSelected = () =>
    setFormData((p) => ({ ...p, solarwinds: { ...p.solarwinds, alerts: p.solarwinds.alerts.filter((a) => !a.selected) } }));

  const toggleAll = (checked: boolean) =>
    setFormData((p) => ({ ...p, solarwinds: { ...p.solarwinds, alerts: p.solarwinds.alerts.map((a) => ({ ...a, selected: checked })) } }));

  return {
    formData, setField, setSolarField, updateAlert, addRow, deleteSelected, toggleAll,
    isFormValid, validationMessage,
  };
}
