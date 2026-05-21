"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSolarWindsForm } from "@/hooks/useSolarWindsForm";
import { openEmail } from "@/utils/email";
import { buildSolarWindsEmailBody } from "@/utils/emailBodies";
import { addHeader, safeDate, initials as getInitials } from "@/utils/pdf";
import { saveSubmission } from "@/utils/saveSubmission";
import { RadioGroup, AlertTable, SectionCard, SubmitBar, PageHeader } from "@/components/ui";
import { useToast } from "@/context/toast";
import type { SolarWindsAlertRow } from "@/types";

interface Props { engineer: string; date: string; onSubmitSuccess?: () => void; }

const inputCls = "input text-xs py-2";

export default function SolarWindsForm({ engineer, date, onSubmitSuccess }: Props) {
  const f = useSolarWindsForm();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { f.setField("engineer", engineer); f.setField("date", date); }, [engineer, date]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!f.isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fd = f.formData; const s = fd.solarwinds;
      const doc = new jsPDF();
      addHeader(doc, "SolarWinds Daily Checklist", engineer, date);
      let y = 52;
      doc.setFontSize(10);
      doc.text(`Services Running: ${s.servicesRunning}`, 14, y); y += 6;
      if (s.servicesRunning === "no") { doc.text(`Service Down Ticket: ${s.serviceDownTicket || "-"}`, 14, y); y += 6; }
      doc.text(`Client: ${s.client || "Multiple"}`, 14, y); y += 6;
      doc.text(`Alerts Generated: ${s.alertsGenerated}`, 14, y); y += 6;
      if (s.alertsGenerated === "yes" && s.alerts.length > 0) {
        autoTable(doc, {
          head: [["#", "Type", "Name", "Details", "Time", "Ticket", "Notes"]],
          body: s.alerts.map((a, i) => [i+1, a.alertType, a.name, a.details, a.time, a.ticket||"-", a.notes||"-"]),
          startY: y + 3, styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 130, 130] },
        });
      }
      const fnDate = safeDate(date);
      const pdfName = `solarwinds-${getInitials(engineer)}-${fnDate}.pdf`;
      doc.save(pdfName);
      await saveSubmission({ module: "solarwinds", engineer, checkDate: fnDate, passed: f.isFormValid, payload: fd, pdfName });
      openEmail(`SolarWinds Daily Checklist - ${fnDate} - ${engineer}`, buildSolarWindsEmailBody(fd));
      onSubmitSuccess?.();
      toast("SolarWinds check submitted — PDF downloaded", "success");
    } catch {
      toast("Failed to submit. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cols = [
    { key: "alertType", header: "Type", width: "130px", render: (r: SolarWindsAlertRow, i: number) => (
      <input className={inputCls} value={r.alertType} onChange={(e) => f.updateAlert(i,"alertType",e.target.value)} placeholder="Alert type" />
    )},
    { key: "name", header: "Name", render: (r: SolarWindsAlertRow, i: number) => (
      <input className={inputCls} value={r.name} onChange={(e) => f.updateAlert(i,"name",e.target.value)} placeholder="Alert name" />
    )},
    { key: "details", header: "Details", render: (r: SolarWindsAlertRow, i: number) => (
      <input className={inputCls} value={r.details} onChange={(e) => f.updateAlert(i,"details",e.target.value)} placeholder="Details" />
    )},
    { key: "time", header: "Time", width: "175px", render: (r: SolarWindsAlertRow, i: number) => (
      <input type="datetime-local" className={inputCls} value={r.time} onChange={(e) => f.updateAlert(i,"time",e.target.value)} />
    )},
    { key: "ticket", header: "Ticket", width: "115px", render: (r: SolarWindsAlertRow, i: number) => (
      <input className={inputCls} value={r.ticket} onChange={(e) => f.updateAlert(i,"ticket",e.target.value)} placeholder="Ticket #" />
    )},
    { key: "notes", header: "Notes", render: (r: SolarWindsAlertRow, i: number) => (
      <input className={inputCls} value={r.notes} onChange={(e) => f.updateAlert(i,"notes",e.target.value)} placeholder="Notes" />
    )},
  ];

  const s = f.formData.solarwinds;

  return (
    <div className="space-y-5 max-w-5xl pb-32">
      <PageHeader title="SolarWinds Checks" subtitle={`Engineer: ${engineer} · ${date}`} />

      <SectionCard title="Service Status">
        <RadioGroup label="Are all SolarWinds services running?" name="servicesRunning"
          value={s.servicesRunning} onChange={(v) => f.setSolarField("servicesRunning", v)} />
        {s.servicesRunning === "no" && (
          <div className="pl-1">
            <label className="label">Service Down Ticket</label>
            <input className="input max-w-xs" value={s.serviceDownTicket}
              onChange={(e) => f.setSolarField("serviceDownTicket", e.target.value)} placeholder="Ticket number" />
          </div>
        )}
        <div className="pl-1">
          <label className="label">Client</label>
          <input className="input max-w-xs" value={s.client}
            onChange={(e) => f.setSolarField("client", e.target.value)} placeholder="Multiple" />
        </div>
      </SectionCard>

      <SectionCard title="Alerts">
        <RadioGroup label="Were any alerts generated?" name="alertsGenerated"
          value={s.alertsGenerated} onChange={(v) => f.setSolarField("alertsGenerated", v)} />
        {s.alertsGenerated === "yes" && (
          <AlertTable rows={s.alerts} columns={cols}
            selectAll={s.alerts.length > 0 && s.alerts.every((a) => a.selected)}
            onToggleAll={f.toggleAll}
            onToggleRow={(i) => f.updateAlert(i, "selected", !s.alerts[i].selected)}
            onDeleteSelected={f.deleteSelected}
            onAddRow={f.addRow} addLabel="Add alert" />
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
