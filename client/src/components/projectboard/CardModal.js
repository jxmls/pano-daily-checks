import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Plus, CheckSquare, MessageSquare, CalendarDays, Trash2 } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

// helpers for due-date quick picks
const toISO = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
};

export default function CardModal({
  open,
  onClose,
  task,
  onUpdate,
  onDelete,
  isDoneColumn,
  isInProgressColumn,
  isTodoColumn,
  onMoveToInProgress,
}) {
  const engineer = localStorage.getItem("engineerName") || "Me";

  const [form, setForm] = useState({
    title: task.title || "",
    assignee: task.assignee || "",
    priority: task.priority || "medium",
    due: task.due || "",
    tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
    description: task.description || "",
  });
  const [checklist, setChecklist] = useState(task.checklist || []);
  const [newItem, setNewItem] = useState("");
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");

  // Reinitialize when task changes / modal opens
  useEffect(() => {
    if (!open) return;
    setForm({
      title: task.title || "",
      assignee: task.assignee || "",
      priority: task.priority || "medium",
      due: task.due || "",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
      description: task.description || "",
    });
    setChecklist(task.checklist || []);
    setComments(task.comments || []);
    setNewItem("");
    setNewComment("");
  }, [open, task]);

  // Body scroll lock while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Refs for focus management / trap
  const panelRef = useRef(null);
  const titleRef = useRef(null);

  // Auto focus title when opening
  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [open]);

  // Focus trap: keep Tab within modal
  useEffect(() => {
    if (!open) return;
    const root = panelRef.current;
    if (!root) return;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

    function onKeyDown(e) {
      if (e.key !== "Tab") return;
      const nodes = getFocusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Global keyboard shortcuts
  const save = useCallback(() => {
    onUpdate?.({
      title: form.title.trim(),
      assignee: form.assignee.trim(),
      priority: form.priority,
      due: form.due,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: form.description,
      checklist,
      comments,
    });
    onClose?.();
  }, [comments, checklist, form, onClose, onUpdate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, save]);

  // Close on global overlay close
  useEffect(() => {
    const handler = () => onClose?.();
    window.addEventListener("pano:close-overlays", handler);
    return () => window.removeEventListener("pano:close-overlays", handler);
  }, [onClose]);

  const done = useMemo(() => checklist.filter((i) => i.done).length, [checklist]);
  const total = checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const addChecklistItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setChecklist((prev) => [...prev, { id: uid(), text: t, done: false }]);
    setNewItem("");
  };

  const toggleItem  = (id) => setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const editItem    = (id, text) => setChecklist((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));
  const removeItem  = (id) => setChecklist((prev) => prev.filter((it) => it.id !== id));
  const addComment  = () => {
    const t = newComment.trim();
    if (!t) return;
    setComments((prev) => [...prev, { id: uid(), author: engineer, text: t, ts: new Date().toISOString() }]);
    setNewComment("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Edit card">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Centered panel container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Panel = flex column so header/footer stick and body scrolls */}
        <div
          ref={panelRef}
          className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur px-5 py-3 border-b rounded-t-2xl z-10">
            <div className="flex items-center justify-between gap-3">
              <input
                ref={titleRef}
                className="text-lg font-semibold w-full mr-2 outline-none"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Card title"
              />
              <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} title="Close (Esc)">
                <X size={20} />
              </button>
            </div>

            {/* Progress */}
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <CheckSquare size={14} /> {done}/{total} • {pct}%
              </span>
              <div className="flex-1 h-1.5 rounded bg-gray-200 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="p-5 grid md:grid-cols-12 gap-5 flex-1 overflow-auto">
            {/* LEFT */}
            <div className="md:col-span-8 space-y-5">
              {/* Description */}
              <section>
                <div className="text-sm font-semibold mb-1">Description</div>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm min-h-[140px]"
                  placeholder="Write details…"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Tip: Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> to save.
                </div>
              </section>

              {/* Checklist */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold inline-flex items-center gap-2">
                    <CheckSquare size={16} /> Checklist
                    <span className="text-xs text-gray-500">{done}/{total}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {checklist.map((it) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <input type="checkbox" className="mt-0.5" checked={it.done} onChange={() => toggleItem(it.id)} />
                      <input
                        className={`flex-1 border rounded px-2 py-1 text-sm ${it.done ? "line-through text-gray-400" : ""}`}
                        value={it.text}
                        onChange={(e) => editItem(it.id, e.target.value)}
                      />
                      <button className="p-1 rounded hover:bg-gray-100" onClick={() => removeItem(it.id)} title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="Add checklist item…"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addChecklistItem(); }}
                    />
                    <button className="px-2 py-1 border rounded text-sm" onClick={addChecklistItem}>
                      <Plus size={14} className="inline mr-1" /> Add
                    </button>
                  </div>
                </div>
              </section>

              {/* Comments */}
              <section>
                <div className="text-sm font-semibold mb-2 inline-flex items-center gap-2">
                  <MessageSquare size={16} /> Comments
                </div>
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="text-sm border rounded px-3 py-2">
                      <div className="text-gray-500 text-xs mb-1">
                        {c.author} • {new Date(c.ts).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{c.text}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="Write a comment…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e)=>{ if(e.key==="Enter") addComment(); }}
                  />
                  <button className="px-3 py-1 border rounded text-sm" onClick={addComment}>Add</button>
                </div>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="md:col-span-4 space-y-3">
              <div className="text-sm font-semibold">Card details</div>

              {/* Assignee */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-[11px] font-semibold shrink-0"
                  title={form.assignee || "Unassigned"}
                >
                  {((name) => {
                    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
                    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                    const letters = (name || "").replace(/[^A-Za-z]/g, "").toUpperCase();
                    return letters.slice(0, 2) || "—";
                  })(form.assignee)}
                </div>
                <input
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="Assignee"
                  value={form.assignee}
                  onChange={(e) => setForm((s) => ({ ...s, assignee: e.target.value }))}
                />
              </div>

              {/* Priority */}
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.priority}
                onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Due with quick picks */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    value={form.due}
                    onChange={(e) => setForm((s) => ({ ...s, due: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Quick:</span>
                  {[
                    { label: "1w", days: 7 },
                    { label: "2w", days: 14 },
                    { label: "1m", days: 30 },
                    { label: "3m", days: 90 },
                  ].map(({ label, days }) => (
                    <button
                      key={label}
                      className="px-2 py-0.5 border rounded"
                      onClick={() => setForm((s) => ({ ...s, due: toISO(addDays(new Date(), days)) }))}
                    >
                      {label}
                    </button>
                  ))}
                  {form.due && (
                    <button className="px-2 py-0.5 underline" onClick={() => setForm((s) => ({ ...s, due: "" }))}>
                      clear
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="labels, comma, separated"
                value={form.tags}
                onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
              />

              {/* Contextual actions */}
              <div className="pt-2 flex flex-wrap gap-2">
                {isTodoColumn && (
                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={() => { onMoveToInProgress?.(); onClose?.(); }}
                  >
                    Move to In Progress
                  </button>
                )}
                {isInProgressColumn && (
                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={() => {
                      setChecklist((prev) => prev.map((i) => ({ ...i, done: true })));
                    }}
                  >
                    Mark complete (checklist)
                  </button>
                )}
              </div>
            </aside>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur px-5 py-3 border-t rounded-b-2xl z-10">
            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-1 text-sm underline" onClick={onClose}>Close</button>
              <button
                className="px-3 py-1 text-sm text-red-600 underline"
                onClick={() => { if (window.confirm("Delete this card?")) onDelete?.(); }}
              >
                Delete
              </button>
              <button
                className="px-3 py-1 border rounded text-sm"
                onClick={save}
                title="Ctrl/Cmd + Enter"
                disabled={!form.title.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
