"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2, MessageSquare, Calendar, Clock, User, Tag, ChevronDown } from "lucide-react";
import type { BoardCard, BoardColumn, BoardComment, Priority } from "@/types/board";
import { PRIORITY_CONFIG, ENGINEERS } from "@/types/board";

interface Props {
  card: BoardCard;
  columns: BoardColumn[];
  engineer: string;
  onClose: () => void;
  onUpdate: (cardId: string, patch: Partial<BoardCard>) => void;
  onDelete: (cardId: string) => void;
  onComment: (cardId: string, comment: BoardComment) => void;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  );
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function fmtDateTime(iso: string) {
  try { return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

export default function CardDetailPanel({ card, columns, engineer, onClose, onUpdate, onDelete, onComment }: Props) {
  const [title, setTitle] = useState(card.title);
  const [desc, setDesc] = useState(card.description ?? "");
  const [priority, setPriority] = useState<Priority>(card.priority as Priority);
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [columnId, setColumnId] = useState(card.columnId);
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split("T")[0] : "");
  const [estimatedHours, setEstimatedHours] = useState(card.estimatedHours?.toString() ?? "");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync card changes when a different card is opened
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTitle(card.title);
    setDesc(card.description ?? "");
    setPriority(card.priority as Priority);
    setAssignee(card.assignee ?? "");
    setColumnId(card.columnId);
    setDueDate(card.dueDate ? card.dueDate.split("T")[0] : "");
    setEstimatedHours(card.estimatedHours?.toString() ?? "");
    setLabels(card.labels ?? []);
  }, [card.id]);

  const patch = async (field: Partial<BoardCard>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/board/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(field),
      });
      const updated = await res.json();
      onUpdate(card.id, updated);
    } finally {
      setSaving(false);
    }
  };

  const handleTitleBlur = () => { if (title !== card.title && title.trim()) patch({ title }); };
  const handleDescBlur = () => { if (desc !== (card.description ?? "")) patch({ description: desc }); };
  const handlePriority = (p: Priority) => { setPriority(p); patch({ priority: p }); };
  const handleAssignee = (a: string) => { setAssignee(a); patch({ assignee: a || null }); };
  const handleColumn = (c: string) => { setColumnId(c); patch({ columnId: c }); };
  const handleDueDate = (d: string) => { setDueDate(d); patch({ dueDate: d || null }); };
  const handleHours = (h: string) => {
    setEstimatedHours(h);
    patch({ estimatedHours: h ? parseFloat(h) : null });
  };

  const addLabel = () => {
    const l = labelInput.trim();
    if (!l || labels.includes(l)) { setLabelInput(""); return; }
    const next = [...labels, l];
    setLabels(next);
    setLabelInput("");
    patch({ labels: next });
  };

  const removeLabel = (l: string) => {
    const next = labels.filter((x) => x !== l);
    setLabels(next);
    patch({ labels: next });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await fetch(`/api/board/cards/${card.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: engineer, body: comment }),
    });
    const c = await res.json();
    onComment(card.id, c);
    setComment("");
  };

  const handleDelete = async () => {
    await fetch(`/api/board/cards/${card.id}`, { method: "DELETE" });
    onDelete(card.id);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 520, zIndex: 200,
      background: "#111827", borderLeft: "1px solid #1e293b",
      display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
      transform: "translateX(0)",
      transition: "transform 0.25s ease",
    }} ref={panelRef}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid #1e293b",
        background: "rgba(0,180,180,0.04)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PriorityBadge priority={priority} />
          {saving && <span style={{ fontSize: 11, color: "#64748b" }}>Saving…</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {deleteConfirm ? (
            <>
              <button onClick={() => setDeleteConfirm(false)}
                style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete}
                style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                Delete
              </button>
            </>
          ) : (
            <button onClick={() => setDeleteConfirm(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", padding: 4 }}
              title="Delete card">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          rows={2}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            fontSize: 18, fontWeight: 700, color: "#e2e8f0", resize: "none",
            lineHeight: 1.4, fontFamily: "inherit", padding: 0,
            borderBottom: "1px solid transparent",
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#1e293b"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
        />

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>

          {/* Priority */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Priority
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={priority}
                onChange={(e) => handlePriority(e.target.value as Priority)}
                className="input"
                style={{ paddingRight: 28, fontSize: 13, appearance: "none" }}>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />Assignee</span>
            </label>
            <div style={{ position: "relative" }}>
              <select value={assignee} onChange={(e) => handleAssignee(e.target.value)} className="input" style={{ fontSize: 13, appearance: "none", paddingRight: 28 }}>
                <option value="">Unassigned</option>
                {ENGINEERS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Column */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Column
            </label>
            <div style={{ position: "relative" }}>
              <select value={columnId} onChange={(e) => handleColumn(e.target.value)} className="input" style={{ fontSize: 13, appearance: "none", paddingRight: 28 }}>
                {columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />Due Date</span>
            </label>
            <input type="date" value={dueDate} onChange={(e) => handleDueDate(e.target.value)}
              className="input" style={{ fontSize: 13, colorScheme: "dark" }} />
          </div>

          {/* Estimated hours */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />Est. Hours</span>
            </label>
            <input type="number" min="0" step="0.5" value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              onBlur={() => handleHours(estimatedHours)}
              className="input" style={{ fontSize: 13 }} placeholder="—" />
          </div>

          {/* Created */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Created
            </label>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, paddingTop: 8 }}>{fmtDateTime(card.createdAt)}</p>
          </div>
        </div>

        {/* Labels */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <Tag size={11} />Labels
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {labels.map((l) => (
              <span key={l} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "rgba(0,180,180,0.12)", color: "#00b4b4",
                border: "1px solid rgba(0,180,180,0.2)",
              }}>
                {l}
                <button onClick={() => removeLabel(l)} style={{ background: "none", border: "none", cursor: "pointer", color: "#00b4b4", padding: 0, lineHeight: 1, fontSize: 13 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
              className="input"
              style={{ flex: 1, fontSize: 12 }}
              placeholder="Add label…"
            />
            <button onClick={addLabel} className="btn-secondary" style={{ fontSize: 12, padding: "0 12px" }}>Add</button>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleDescBlur}
            rows={5}
            placeholder="Add a description…"
            style={{
              width: "100%", background: "#0a0f1e", border: "1.5px solid #1e293b",
              borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "10px 12px",
              fontFamily: "inherit", resize: "vertical", outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#00b4b4"; }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#1e293b"; }}
          />
        </div>

        {/* Comments */}
        <div style={{ marginTop: 24, borderTop: "1px solid #1e293b", paddingTop: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
            <MessageSquare size={11} />Comments ({card.comments?.length ?? 0})
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {(card.comments ?? []).map((c) => (
              <div key={c.id} style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#00b4b4" }}>{c.author}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: "#e2e8f0", margin: 0, lineHeight: 1.5 }}>{c.body}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleComment(); }}
              rows={2}
              placeholder="Add a comment… (Ctrl+Enter to submit)"
              style={{
                flex: 1, background: "#0a0f1e", border: "1.5px solid #1e293b",
                borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "8px 12px",
                fontFamily: "inherit", resize: "none", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00b4b4"; }}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#1e293b"; }}
            />
            <button onClick={handleComment} className="btn-primary" style={{ fontSize: 12, padding: "8px 14px", flexShrink: 0 }}>
              Post
            </button>
          </div>
        </div>

        {/* Metadata footer */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
            Created by <span style={{ color: "#94a3b8" }}>{card.createdBy}</span> · Updated {fmtDateTime(card.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
