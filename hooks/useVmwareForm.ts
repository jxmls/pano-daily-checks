"use client";

import { useState, useCallback } from "react";
import type { VmwareFormData, VmwareOrg, VmwareAlertRow } from "@/types";

const blankRow = (): VmwareAlertRow => ({ alertType: "", host: "", details: "", ticket: "", notes: "", selected: false });
const emptyBucket = () => ({ alert: "", rows: [], selectAll: false });

const initialState = (): VmwareFormData => ({
  engineer: "", date: "",
  vsan: { alerts: { clarion: emptyBucket(), panoptics: emptyBucket(), volac: emptyBucket() } },
});

export function useVmwareForm() {
  const [formData, setFormData] = useState<VmwareFormData>(initialState);

  const setField = (field: "engineer" | "date", value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const setBucketAlert = (org: VmwareOrg, value: string) =>
    setFormData((p) => {
      const vsan = structuredClone(p.vsan);
      vsan.alerts[org].alert = value;
      return { ...p, vsan };
    });

  const updateRow = (org: VmwareOrg, index: number, field: keyof VmwareAlertRow, value: string | boolean) =>
    setFormData((p) => {
      const vsan = structuredClone(p.vsan);
      const row = vsan.alerts[org].rows[index];
      if (row) (row as unknown as Record<string, unknown>)[field] = value;
      return { ...p, vsan };
    });

  const addRow = (org: VmwareOrg) =>
    setFormData((p) => {
      const vsan = structuredClone(p.vsan);
      vsan.alerts[org].rows.push(blankRow());
      return { ...p, vsan };
    });

  const deleteSelected = (org: VmwareOrg) =>
    setFormData((p) => {
      const vsan = structuredClone(p.vsan);
      vsan.alerts[org].rows = vsan.alerts[org].rows.filter((r) => !r.selected);
      vsan.alerts[org].selectAll = false;
      return { ...p, vsan };
    });

  const toggleAll = (org: VmwareOrg, checked: boolean) =>
    setFormData((p) => {
      const vsan = structuredClone(p.vsan);
      vsan.alerts[org].rows = vsan.alerts[org].rows.map((r) => ({ ...r, selected: checked }));
      vsan.alerts[org].selectAll = checked;
      return { ...p, vsan };
    });

  const isSectionOk = useCallback((org: VmwareOrg): boolean => {
    const b = formData.vsan.alerts[org];
    if (b.alert === "no") return true;
    if (b.alert === "yes") return b.rows.length > 0 && b.rows.every((r) => r.alertType && r.host && r.details);
    return false;
  }, [formData]);

  const isFormValid = isSectionOk("clarion") && isSectionOk("panoptics") && isSectionOk("volac");

  return {
    formData, setField, setBucketAlert, updateRow, addRow, deleteSelected, toggleAll, isFormValid, isSectionOk,
  };
}
