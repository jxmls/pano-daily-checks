"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useVmwareForm } from "@/hooks/useVmwareForm";
import { openEmail } from "@/utils/email";
import { buildVmwareEmailBody } from "@/utils/emailBodies";
import { addHeader, safeDate, initials as getInitials } from "@/utils/pdf";
import { saveSubmission } from "@/utils/saveSubmission";
import { RadioGroup, AlertTable, SectionCard, SubmitBar, PageHeader } from "@/components/ui";
import { useToast } from "@/context/toast";
import type { VmwareAlertRow, VmwareOrg } from "@/types";

interface Props { engineer: string; date: string; onSubmitSuccess?: () => void; }

const ORG_LABELS: Record<VmwareOrg, string> = {
  clarion: "Clarion Events",
  panoptics: "Panoptics Global",
  volac: "Volac International",
};

const ORGS: VmwareOrg[] = ["clarion", "panoptics", "volac"];

export default function VmwareForm({ engineer, date, onSubmitSuccess }: Props) {
  const f = useVmwareForm();
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
      addHeader(doc, "VMware vSAN Checklist", engineer, date);
      let y = 52;
      doc.setFontSize(10);

      ORGS.forEach((org) => {
        const bucket = fd.vsan.alerts[org];
        doc.text(ORG_LABELS[org], 14, y); y += 5;
        doc.text(`Alerts generated: ${bucket.alert || "N/A"}`, 14, y); y += 3;
        if (bucket.alert === "yes" && bucket.rows.length > 0) {
          autoTable(doc, {
            head: [["#", "Type", "vSphere Host", "Details", "Ticket", "Notes"]],
            body: bucket.rows.map((r, i) => [i + 1, r.alertType, r.host, r.details, r.ticket || "-", r.notes || "-"]),
            startY: y + 2, styles: { fontSize: 8 },
          });
          // @ts-expect-error jspdf-autotable extends jsPDF
          y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        } else {
          doc.text("No alerts.", 14, y); y += 8;
        }
      });

      const fnDate = safeDate(date);
      const pdfName = `vsan-${getInitials(engineer)}-${fnDate}.pdf`;
      doc.save(pdfName);
      await saveSubmission({ module: "vsan", engineer, checkDate: fnDate, passed: f.isFormValid, payload: fd, pdfName });
      openEmail(`VMware vSAN Checklist - ${fnDate} - ${engineer}`, buildVmwareEmailBody(fd));
      onSubmitSuccess?.();
      toast("VMware vSAN check submitted — PDF downloaded", "success");
    } catch {
      toast("Failed to submit. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const makeCols = (org: VmwareOrg) => [
    { key: "alertType", header: "Type", width: "130px", render: (r: VmwareAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.alertType} onChange={(e) => f.updateRow(org, i, "alertType", e.target.value)} placeholder="Alert type" />
    )},
    { key: "host", header: "vSphere Host", render: (r: VmwareAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.host} onChange={(e) => f.updateRow(org, i, "host", e.target.value)} placeholder="Host" />
    )},
    { key: "details", header: "Details", render: (r: VmwareAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.details} onChange={(e) => f.updateRow(org, i, "details", e.target.value)} placeholder="Details" />
    )},
    { key: "ticket", header: "Ticket", width: "110px", render: (r: VmwareAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.ticket} onChange={(e) => f.updateRow(org, i, "ticket", e.target.value)} placeholder="Ticket #" />
    )},
    { key: "notes", header: "Notes", render: (r: VmwareAlertRow, i: number) => (
      <input className="input text-xs py-1.5" value={r.notes} onChange={(e) => f.updateRow(org, i, "notes", e.target.value)} placeholder="Notes" />
    )},
  ];

  return (
    <div className="space-y-5 pb-32">
      <PageHeader title="VMware vSAN Checks" subtitle="Per-site alert review" />

      {ORGS.map((org) => {
        const bucket = f.formData.vsan.alerts[org];
        return (
          <SectionCard key={org} title={ORG_LABELS[org]}>
            <RadioGroup
              label="Were any vSAN alerts generated?"
              name={`alert-${org}`}
              value={bucket.alert}
              onChange={(v) => f.setBucketAlert(org, v)}
            />
            {bucket.alert === "yes" && (
              <AlertTable
                rows={bucket.rows}
                columns={makeCols(org)}
                selectAll={bucket.selectAll}
                onToggleAll={(checked) => f.toggleAll(org, checked)}
                onToggleRow={(i) => f.updateRow(org, i, "selected", !bucket.rows[i].selected)}
                onDeleteSelected={() => f.deleteSelected(org)}
                onAddRow={() => f.addRow(org)}
                addLabel="Add alert"
              />
            )}
          </SectionCard>
        );
      })}

      <SubmitBar
        isValid={f.isFormValid}
        message={f.isFormValid ? "Form complete — ready to submit" : "Answer all site alert questions before submitting."}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
