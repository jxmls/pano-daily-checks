"use client";

import { useState, useEffect, useCallback } from "react";
import type { VeeamFormData, VeeamAlertRow } from "@/types";

const blankRow = (): VeeamAlertRow => ({ type: "", vbrHost: "", details: "", ticket: "", notes: "", selected: false });

const initialState = (): VeeamFormData => ({
  engineer: "", date: "",
  alertsGenerated: "", alerts: [], selectAll: false,
  localAlertsGenerated: "", localAlerts: [], selectAllLocal: false,
});

export function useVeeamForm() {
  const [formData, setFormData] = useState<VeeamFormData>(initialState);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const validate = useCallback((data: VeeamFormData) => {
    if (!data.alertsGenerated || !data.localAlertsGenerated) {
      setIsFormValid(false); setValidationMessage("Answer both Clarion and Local alert questions."); return;
    }
    if (data.alertsGenerated === "yes") {
      for (const a of data.alerts) {
        if (!a.type || !a.vbrHost || !a.details) {
          setIsFormValid(false); setValidationMessage("Complete all Clarion alert fields."); return;
        }
      }
    }
    if (data.localAlertsGenerated === "yes") {
      for (const a of data.localAlerts) {
        if (!a.type || !a.vbrHost || !a.details) {
          setIsFormValid(false); setValidationMessage("Complete all Local alert fields."); return;
        }
      }
    }
    setIsFormValid(true); setValidationMessage("");
  }, []);

  useEffect(() => { validate(formData); }, [formData, validate]);

  const setField = (field: keyof Pick<VeeamFormData, "engineer" | "date" | "alertsGenerated" | "localAlertsGenerated">, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  // Clarion alerts
  const updateAlert = (i: number, f: keyof VeeamAlertRow, v: string | boolean) =>
    setFormData((p) => { const a = p.alerts.map((r, idx) => idx === i ? { ...r, [f]: v } : r); return { ...p, alerts: a }; });
  const addRow = () => setFormData((p) => ({ ...p, alerts: [...p.alerts, blankRow()] }));
  const deleteSelected = () => setFormData((p) => ({ ...p, alerts: p.alerts.filter((r) => !r.selected), selectAll: false }));
  const toggleAll = (checked: boolean) => setFormData((p) => ({ ...p, alerts: p.alerts.map((r) => ({ ...r, selected: checked })), selectAll: checked }));

  // Local alerts
  const updateLocalAlert = (i: number, f: keyof VeeamAlertRow, v: string | boolean) =>
    setFormData((p) => { const a = p.localAlerts.map((r, idx) => idx === i ? { ...r, [f]: v } : r); return { ...p, localAlerts: a }; });
  const addLocalRow = () => setFormData((p) => ({ ...p, localAlerts: [...p.localAlerts, blankRow()] }));
  const deleteSelectedLocal = () => setFormData((p) => ({ ...p, localAlerts: p.localAlerts.filter((r) => !r.selected), selectAllLocal: false }));
  const toggleAllLocal = (checked: boolean) => setFormData((p) => ({ ...p, localAlerts: p.localAlerts.map((r) => ({ ...r, selected: checked })), selectAllLocal: checked }));

  const isAlertReady = () => formData.alertsGenerated === "yes" && formData.alerts.length > 0 && formData.alerts.every((a) => a.type && a.vbrHost && a.details);
  const isLocalReady = () => formData.localAlertsGenerated === "yes" && formData.localAlerts.length > 0 && formData.localAlerts.every((a) => a.type && a.vbrHost && a.details);

  return {
    formData, setField, isFormValid, validationMessage,
    updateAlert, addRow, deleteSelected, toggleAll,
    updateLocalAlert, addLocalRow, deleteSelectedLocal, toggleAllLocal,
    isAlertReady, isLocalReady,
  };
}
