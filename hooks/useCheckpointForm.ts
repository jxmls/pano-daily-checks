"use client";

import { useState, useCallback } from "react";
import type { CheckpointFormData, CheckpointSection, CheckpointAlertRow } from "@/types";

const blankRow = (): CheckpointAlertRow => ({
  severity: "", name: "", machine: "", details: "", ticket: "", notes: "", selected: false,
});

const blankSection = (): CheckpointSection => ({ alertsGenerated: "", alerts: [], selectAll: false });

const initialState = (): CheckpointFormData => ({
  engineer: "", date: "",
  panoptics: blankSection(),
  brewery: blankSection(),
});

type SectionKey = "panoptics" | "brewery";

export function useCheckpointForm() {
  const [formData, setFormData] = useState<CheckpointFormData>(initialState);

  const setField = (field: "engineer" | "date", value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const setSectionField = (section: SectionKey, field: keyof CheckpointSection, value: string | boolean) =>
    setFormData((p) => ({ ...p, [section]: { ...p[section], [field]: value } }));

  const updateRow = (section: SectionKey, index: number, field: keyof CheckpointAlertRow, value: string | boolean) =>
    setFormData((p) => {
      const alerts = p[section].alerts.map((r, i) => i === index ? { ...r, [field]: value } : r);
      return { ...p, [section]: { ...p[section], alerts } };
    });

  const addRow = (section: SectionKey) =>
    setFormData((p) => ({ ...p, [section]: { ...p[section], alerts: [...p[section].alerts, blankRow()] } }));

  const deleteSelected = (section: SectionKey) =>
    setFormData((p) => ({ ...p, [section]: { ...p[section], alerts: p[section].alerts.filter((r) => !r.selected), selectAll: false } }));

  const toggleAll = (section: SectionKey, checked: boolean) =>
    setFormData((p) => ({ ...p, [section]: { ...p[section], alerts: p[section].alerts.map((r) => ({ ...r, selected: checked })), selectAll: checked } }));

  const isSectionOk = useCallback((s: CheckpointSection): boolean => {
    if (s.alertsGenerated === "no") return true;
    if (s.alertsGenerated === "yes") return s.alerts.length > 0 && s.alerts.every((r) => r.severity && r.name && r.machine && r.details);
    return false;
  }, []);

  let isFormValid = true;
  let validationMessage = "";
  if (!formData.panoptics.alertsGenerated || !formData.brewery.alertsGenerated) {
    isFormValid = false; validationMessage = "Select whether alerts were generated for both sections.";
  } else if (!isSectionOk(formData.panoptics)) {
    isFormValid = false; validationMessage = "All Panoptics alert rows need Severity, Name, Machine, and Details.";
  } else if (!isSectionOk(formData.brewery)) {
    isFormValid = false; validationMessage = "All Brewery alert rows need Severity, Name, Machine, and Details.";
  }

  return {
    formData, setField, setSectionField, updateRow, addRow, deleteSelected, toggleAll,
    isFormValid, validationMessage, isSectionOk,
  };
}
