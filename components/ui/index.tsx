"use client";

import React from "react";
import { TrashIcon, PlusIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// ─── RadioGroup ─────────────────────────────────────────────────────────────

interface RadioGroupProps {
  label: string;
  name: string;
  value: string;
  options?: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function RadioGroup({
  label, name, value, onChange,
  options = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
}: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <p className="label">{label}</p>
      <div className="radio-group">
        {options.map((o) => (
          <label key={o.value} className="radio-pill">
            <input type="radio" name={name} value={o.value}
              checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="radio-pill-label">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── ValidationBanner ────────────────────────────────────────────────────────

export function ValidationBanner({ message, valid }: { message: string; valid: boolean }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold"
    style={{
      background: valid ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
      border: valid ? "1.5px solid rgba(34,197,94,0.25)" : "1.5px solid rgba(245,158,11,0.25)",
      color: valid ? "#22c55e" : "#f59e0b",
    }}>
      {valid
        ? <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
        : <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />}
      {message}
    </div>
  );
}

// ─── AlertTable ──────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface AlertTableProps<T extends { selected: boolean }> {
  rows: T[];
  columns: ColumnDef<T>[];
  selectAll: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (index: number) => void;
  onDeleteSelected: () => void;
  onAddRow: () => void;
  addLabel?: string;
}

export function AlertTable<T extends { selected: boolean }>({
  rows, columns, selectAll, onToggleAll, onToggleRow,
  onDeleteSelected, onAddRow, addLabel = "Add row",
}: AlertTableProps<T>) {
  const anySelected = rows.some((r) => r.selected);

  return (
    <div className="space-y-3">
      <div className="card-flush">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="table-th w-10 text-center">
                <input type="checkbox" checked={selectAll}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-brand-500" />
              </th>
              {columns.map((c) => (
                <th key={String(c.key)} className="table-th"
                  style={c.width ? { width: c.width } : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}
                  className="table-td py-10 text-center text-sm font-medium"
                  style={{ color: "#64748b" }}>
                  No rows yet — click &ldquo;{addLabel}&rdquo; to add one.
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i}
                style={{
                  background: row.selected ? "rgba(0,130,130,0.05)" : undefined,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!row.selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { if (!row.selected) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <td className="table-td text-center">
                  <input type="checkbox" checked={row.selected}
                    onChange={() => onToggleRow(i)}
                    className="h-3.5 w-3.5 rounded accent-brand-500" />
                </td>
                {columns.map((c) => (
                  <td key={String(c.key)} className="table-td">
                    {c.render
                      ? c.render(row, i)
                      : String((row as Record<string, unknown>)[String(c.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onAddRow}
          className="btn-secondary text-xs py-2 px-3.5 gap-1.5">
          <PlusIcon className="h-3.5 w-3.5" />
          {addLabel}
        </button>
        {anySelected && (
          <button type="button" onClick={onDeleteSelected}
            className="btn-danger text-xs py-2 px-3.5 gap-1.5">
            <TrashIcon className="h-3.5 w-3.5" />
            Delete selected
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, className = "", ...props }: TextInputProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input
        className={`input ${error ? "!border-red-400 focus:!ring-red-100" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  status?: "ok" | "warn" | "none";
}

export function SectionCard({ title, subtitle, children, status }: SectionCardProps) {
  const dotColor = status === "ok" ? "#10b981" : status === "warn" ? "#f59e0b" : "#008282";

  return (
    <div className="card-flush">
      {/* Header strip */}
      <div className="flex items-center gap-3 px-6 py-4"
        style={{
          borderBottom: "1px solid #1e293b",
          background: "rgba(255,255,255,0.02)",
        }}>
        <span className="w-2 h-2 rounded-full shrink-0 mt-px"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}99` }} />
        <div>
          <h2 className="text-sm font-bold tracking-tight leading-none" style={{ color: "#e2e8f0" }}>
            {title}
          </h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

const PILL_STYLES: Record<string, { bg: string; color: string }> = {
  passed:  { bg: "rgba(16,185,129,0.1)",  color: "#059669" },
  failed:  { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  issues:  { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  active:  { bg: "rgba(0,130,130,0.1)",   color: "#006e6e" },
  retired: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  high:    { bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  medium:  { bg: "rgba(245,158,11,0.1)",  color: "#d97706" },
  low:     { bg: "rgba(16,185,129,0.1)",  color: "#059669" },
};

export function StatusPill({ label, variant }: { label: string; variant?: string }) {
  const key = (variant ?? label).toLowerCase();
  const s = PILL_STYLES[key] ?? { bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
  return (
    <span className="badge font-bold" style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

export function KpiCard({
  label, value, sub, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="stat-card"
      style={accent ? { borderColor: "rgba(0,180,180,0.3)", background: "rgba(0,180,180,0.04)" } : undefined}>
      <p className="label mb-0">{label}</p>
      <p className="text-3xl font-black tracking-tight leading-none mt-1"
        style={{ color: accent ? "#00b4b4" : "#e2e8f0" }}>
        {value}
      </p>
      {sub && <p className="text-xs font-medium mt-1" style={{ color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

// ─── SubmitBar ────────────────────────────────────────────────────────────────

export function SubmitBar({
  isValid,
  message,
  onSubmit,
  isSubmitting = false,
  label = "Submit & Send Email",
}: {
  isValid: boolean;
  message: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  label?: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 240,
        right: 0,
        background: "#0d1526",
        borderTop: "1px solid #1e293b",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        zIndex: 30,
        gap: 16,
      }}
    >
      {/* Validation message */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        {isValid
          ? <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
          : <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />}
        <span style={{ color: isValid ? "#22c55e" : "#f59e0b" }}>{message}</span>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="btn-primary"
        style={{ whiteSpace: "nowrap" }}
      >
        {isSubmitting ? "Submitting…" : label}
      </button>
    </div>
  );
}
