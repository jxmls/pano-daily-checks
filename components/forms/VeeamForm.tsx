"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useVeeamForm } from "@/hooks/useVeeamForm";
import { openEmail } from "@/utils/email";
import { buildVeeamEmailBody } from "@/utils/emailBodies";
import { addHeader, safeDate, initials as getInitials } from "@/utils/pdf";
import { saveSubmission } from "@/utils/saveSubmission";
import { RadioGroup, AlertTable, SectionCard, SubmitBar, PageHeader } from "@/components/ui";
import { useToast } from "@/context/toast";
import type { VeeamAlertRow } from "@/types";

interface Props { engineer: string; date: string; onSubmitSuccess?: () => void; }

function makeAlertCols(onUpdate: (i: number, f: keyof VeeamAlertRow, v: string) => void) {
  return [
    { key: "type", header: "Type", width: "120px", render: (r: VeeamAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.type} onChange={(e) => onUpdate(i, "type", e.target.value)} placeholder="Warning / Failed" />
    )},
    { key: "vbrHost", header: "VBR Host", render: (r: VeeamAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.vbrHost} onChange={(e) => onUpdate(i, "vbrHost", e.target.value)} placeholder="Host" />
    )},
    { key: "details", header: "Details", render: (r: VeeamAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.details} onChange={(e) => onUpdate(i, "details", e.target.value)} placeholder="Details" />
    )},
    { key: "ticket", header: "Ticket", width: "120px", render: (r: VeeamAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.ticket} onChange={(e) => onUpdate(i, "ticket", e.target.value)} placeholder="Ticket #" />
    )},
    { key: "notes", header: "Notes", render: (r: VeeamAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.notes} onChange={(e) => onUpdate(i, "notes", e.target.value)} placeholder="Notes" />
    )},
  ];
}

export default function VeeamForm({ engineer, date, onSubmitSuccess }: Props) {
  const f = useVeeamForm();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    f.setField("engineer", engineer);
    f.setField("date", date);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineer, date]);

  const handleSubmit = async () => {
    if (!f.isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fd = f.formData;

      const doc = new jsPDF();
      addHeader(doc, "Veeam Backup Checklist", engineer, date);
      let y = 52;
      doc.setFontSize(10);

      const drawSection = (title: string, alertsGenerated: string, alerts: VeeamAlertRow[]) => {
        doc.text(title, 14, y); y += 5;
        doc.text(`Alerts generated: ${alertsGenerated || "N/A"}`, 14, y); y += 3;
        if (alertsGenerated === "yes" && alerts.length > 0) {
          autoTable(doc, {
            head: [["#", "Type", "VBR Host", "Details", "Ticket", "Notes"]],
            body: alerts.map((a, i) => [i + 1, a.type, a.vbrHost, a.details, a.ticket || "-", a.notes || "-"]),
            startY: y + 2, styles: { fontSize: 8 },
          });
          // @ts-expect-error jspdf-autotable extends jsPDF
          y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        } else {
          doc.text("No alerts.", 14, y); y += 8;
        }
      };

      drawSection("Clarion Events", fd.alertsGenerated, fd.alerts);
      drawSection("Local Veeam", fd.localAlertsGenerated, fd.localAlerts);

      const fnDate = safeDate(date);
      const pdfName = `veeam-${getInitials(engineer)}-${fnDate}.pdf`;
      doc.save(pdfName);
      await saveSubmission({ module: "veeam", engineer, checkDate: fnDate, passed: f.isFormValid, payload: fd, pdfName });
      openEmail(`Veeam Daily Checklist - ${fnDate} - ${engineer}`, buildVeeamEmailBody(fd));
      onSubmitSuccess?.();
      toast("Veeam check submitted — PDF downloaded", "success");
    } catch {
      toast("Failed to submit. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fd = f.formData;
  const clarionCols = makeAlertCols(f.updateAlert);
  const localCols = makeAlertCols(f.updateLocalAlert);

  return (
    <div className="space-y-5 pb-32">
      <PageHeader title="Veeam Backup Checks" subtitle="Clarion and local VBR alert review" />

      <SectionCard title="Clarion Events — Veeam Backup">
        <RadioGroup label="Were any alerts generated?" name="clarionAlerts"
          value={fd.alertsGenerated} onChange={(v) => f.setField("alertsGenerated", v)} />
        {fd.alertsGenerated === "yes" && (
          <AlertTable
            rows={fd.alerts} columns={clarionCols}
            selectAll={fd.selectAll}
            onToggleAll={f.toggleAll}
            onToggleRow={(i) => f.updateAlert(i, "selected", !fd.alerts[i].selected)}
            onDeleteSelected={f.deleteSelected}
            onAddRow={f.addRow}
            addLabel="Add alert"
          />
        )}
      </SectionCard>

      <SectionCard title="Local Veeam Backup">
        <RadioGroup label="Were any local alerts generated?" name="localAlerts"
          value={fd.localAlertsGenerated} onChange={(v) => f.setField("localAlertsGenerated", v)} />
        {fd.localAlertsGenerated === "yes" && (
          <AlertTable
            rows={fd.localAlerts} columns={localCols}
            selectAll={fd.selectAllLocal}
            onToggleAll={f.toggleAllLocal}
            onToggleRow={(i) => f.updateLocalAlert(i, "selected", !fd.localAlerts[i].selected)}
            onDeleteSelected={f.deleteSelectedLocal}
            onAddRow={f.addLocalRow}
            addLabel="Add local alert"
          />
        )}
      </SectionCard>

      <SubmitBar
        isValid={f.isFormValid}
        message={f.isFormValid ? "Form complete — ready to submit" : f.validationMessage}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
