"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import type { BoardCard, BoardColumn, Priority } from "@/types/board";
import { PRIORITY_CONFIG, ENGINEERS } from "@/types/board";

interface Props {
  columns: BoardColumn[];
  defaultColumnId?: string;
  engineer: string;
  onClose: () => void;
  onCreate: (card: BoardCard) => void;
}

export default function NewCardModal({ columns, defaultColumnId, engineer, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/board/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId, title: title.trim(), priority,
          assignee: assignee || null,
          dueDate: dueDate || null,
          createdBy: engineer,
          labels: [],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const card = await res.json();
      onCreate({ ...card, comments: card.comments ?? [] });
      onClose();
    } catch {
      setError("Failed to create card. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#111827", border: "1px solid #1e293b",
        borderRadius: 14, padding: "24px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>New card</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              autoFocus
              className="input w-full"
              placeholder="Card title…"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{error}</p>}
          </div>

          {/* Column */}
          <div>
            <label className="label">Column</label>
            <div style={{ position: "relative" }}>
              <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className="input" style={{ appearance: "none", paddingRight: 32 }}>
                {columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Priority + Assignee */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">Priority</label>
              <div style={{ position: "relative" }}>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input" style={{ appearance: "none", paddingRight: 32, fontSize: 13 }}>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label className="label">Assignee</label>
              <div style={{ position: "relative" }}>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input" style={{ appearance: "none", paddingRight: 32, fontSize: 13 }}>
                  <option value="">Unassigned</option>
                  {ENGINEERS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="label">Due Date (optional)</label>
            <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ colorScheme: "dark" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn-primary" style={{ flex: 2 }}>
            {saving ? "Creating…" : "Create card"}
          </button>
        </div>
      </div>
    </div>
  );
}
