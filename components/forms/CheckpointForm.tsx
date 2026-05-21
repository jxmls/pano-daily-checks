"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCheckpointForm } from "@/hooks/useCheckpointForm";
import { openEmail } from "@/utils/email";
import { buildCheckpointEmailBody } from "@/utils/emailBodies";
import { addHeader, safeDate, initials as getInitials } from "@/utils/pdf";
import { saveSubmission } from "@/utils/saveSubmission";
import { RadioGroup, AlertTable, SectionCard, SubmitBar, PageHeader } from "@/components/ui";
import { useToast } from "@/context/toast";
import type { CheckpointAlertRow } from "@/types";

interface Props { engineer: string; date: string; onSubmitSuccess?: () => void; }

type SectionKey = "panoptics" | "brewery";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "panoptics", label: "Panoptics Global Ltd" },
  { key: "brewery",   label: "The Brewery" },
];

export default function CheckpointForm({ engineer, date, onSubmitSuccess }: Props) {
  const f = useCheckpointForm();
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
      addHeader(doc, "Checkpoint Daily Checklist", engineer, date);
      let y = 52;
      doc.setFontSize(10);

      const drawSection = (title: string, alerts: CheckpointAlertRow[]) => {
        doc.text(title, 14, y); y += 5;
        if (alerts.length > 0) {
          autoTable(doc, {
            head: [["#", "Severity", "Name", "Machine", "Details", "Ticket", "Notes"]],
            body: alerts.map((a, i) => [i + 1, a.severity, a.name, a.machine, a.details, a.ticket || "-", a.notes || "-"]),
            startY: y + 2, styles: { fontSize: 8 },
          });
          // @ts-expect-error jspdf-autotable extends jsPDF
          y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        } else {
          doc.text("No alerts.", 14, y); y += 8;
        }
      };

      drawSection("Panoptics Global Ltd", fd.panoptics.alerts);
      drawSection("The Brewery", fd.brewery.alerts);

      const fnDate = safeDate(date);
      const pdfName = `checkpoint-${getInitials(engineer)}-${fnDate}.pdf`;
      doc.save(pdfName);
      await saveSubmission({ module: "checkpoint", engineer, checkDate: fnDate, passed: f.isFormValid, payload: fd, pdfName });
      openEmail(`Checkpoint Daily Check - ${fnDate} - ${engineer}`, buildCheckpointEmailBody(fd));
      onSubmitSuccess?.();
      toast("Checkpoint check submitted — PDF downloaded", "success");
    } catch {
      toast("Failed to submit. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const makeCols = (section: SectionKey) => [
    { key: "severity", header: "Severity", width: "100px", render: (r: CheckpointAlertRow, i: number) => (
      <select className="input text-xs py-1.5" value={r.severity} onChange={(e) => f.updateRow(section, i, "severity", e.target.value)}>
        <option value="">—</option>
        {["Critical", "High", "Medium", "Low", "Info"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
    { key: "name", header: "Alert Name", render: (r: CheckpointAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.name} onChange={(e) => f.updateRow(section, i, "name", e.target.value)} placeholder="Alert name" />
    )},
    { key: "machine", header: "Machine", width: "130px", render: (r: CheckpointAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.machine} onChange={(e) => f.updateRow(section, i, "machine", e.target.value)} placeholder="Machine" />
    )},
    { key: "details", header: "Details", render: (r: CheckpointAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.details} onChange={(e) => f.updateRow(section, i, "details", e.target.value)} placeholder="Details" />
    )},
    { key: "ticket", header: "Ticket", width: "110px", render: (r: CheckpointAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.ticket} onChange={(e) => f.updateRow(section, i, "ticket", e.target.value)} placeholder="Ticket #" />
    )},
    { key: "notes", header: "Notes", render: (r: CheckpointAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.notes} onChange={(e) => f.updateRow(section, i, "notes", e.target.value)} placeholder="Notes" />
    )},
  ];

  return (
    <div className="space-y-5 pb-32">
      <PageHeader title="Checkpoint Checks" subtitle="Per-site firewall alert review" />

      {SECTIONS.map(({ key, label }) => {
        const section = f.formData[key];
        return (
          <SectionCard key={key} title={label}>
            <RadioGroup
              label="Were any alerts generated?"
              name={`alerts-${key}`}
              value={section.alertsGenerated}
              onChange={(v) => f.setSectionField(key, "alertsGenerated", v)}
            />
            {section.alertsGenerated === "yes" && (
              <AlertTable
                rows={section.alerts}
                columns={makeCols(key)}
                selectAll={section.selectAll}
                onToggleAll={(checked) => f.toggleAll(key, checked)}
                onToggleRow={(i) => f.updateRow(key, i, "selected", !section.alerts[i].selected)}
                onDeleteSelected={() => f.deleteSelected(key)}
                onAddRow={() => f.addRow(key)}
                addLabel="Add alert"
              />
            )}
          </SectionCard>
        );
      })}

      <SubmitBar
        isValid={f.isFormValid}
        message={f.isFormValid ? "Form complete — ready to submit" : f.validationMessage}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
