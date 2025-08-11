import React, { useEffect, useMemo, useState } from "react";
import {
  X, Plus, CheckSquare, MessageSquare, CalendarDays, Trash2,
  ChevronUp, ChevronDown, Pencil, Tag as TagIcon
} from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);
const SUG_KEY = "pano.projectboard.assignees";

// ---------------- helpers ----------------
const initials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters[0] || "—") + (letters[1] || "");
};
const toISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (baseISO, n) => {
  const d = baseISO ? new Date(baseISO) : new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
const addWeeks = (baseISO, n) => addDays(baseISO, 7 * n);
const addMonths = (baseISO, n) => {
  const d = baseISO ? new Date(baseISO) : new Date();
  d.setMonth(d.getMonth() + n);
  return toISODate(d);
};
const priorityClass = (p) =>
  p === "high" ? "bg-red-100 text-red-700"
  : p === "low" ? "bg-green-100 text-green-700"
  : "bg-amber-100 text-amber-800";
const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));
// -----------------------------------------

export default function CardModal({
  open,
  onClose,
  task,
  onUpdate,
  onDelete,
  isDoneColumn,
  isInProgressColumn,
  isTodoColumn,
  onMoveToInProgress,   // callback to move this card to in-progress
}) {
  const engineer = localStorage.getItem("engineerName") || "Me";

  const [form, setForm] = useState({
    title: task.title || "",
    assignee: task.assignee || "",
    priority: task.priority || "medium",
    due: task.due || "",
    description: task.description || "",
  });

  // tags as array (chip editor)
  const [tags, setTags] = useState(
    Array.isArray(task.tags)
      ? task.tags
      : typeof task.tags === "string"
        ? task.tags.split(",").map(t => t.trim()).filter(Boolean)
        : []
  );

  const [checklist, setChecklist] = useState(task.checklist || []);
  const [newItem, setNewItem] = useState("");
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");

  // assignee suggestions/popover
  const [assignees, setAssignees] = useState([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeDraft, setAssigneeDraft] = useState("");

  // (re)open modal -> hydrate
  useEffect(() => {
    if (!open) return;
    setForm({
      title: task.title || "",
      assignee: task.assignee || "",
      priority: task.priority || "medium",
      due: task.due || "",
      description: task.description || "",
    });
    setTags(
      Array.isArray(task.tags)
        ? task.tags
        : typeof task.tags === "string"
          ? task.tags.split(",").map(t => t.trim()).filter(Boolean)
          : []
    );
    setChecklist(task.checklist || []);
    setComments(task.comments || []);
    setNewItem("");
    setNewComment("");
    try {
      const saved = JSON.parse(localStorage.getItem(SUG_KEY) || "[]");
      setAssignees(Array.isArray(saved) ? saved : []);
    } catch { setAssignees([]); }
    setAssigneeDraft(task.assignee || "");
  }, [open, task]);

  // shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); }
      else if (e.key === "Escape") {
        e.preventDefault();
        if (assigneeOpen) setAssigneeOpen(false); else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, assigneeOpen]); // ok

  const rememberAssignee = (name) => {
    if (!name) return;
    const next = unique([name, ...assignees]).slice(0, 12);
    setAssignees(next);
    localStorage.setItem(SUG_KEY, JSON.stringify(next));
  };

  const done = useMemo(() => checklist.filter(i => i.done).length, [checklist]);
  const total = checklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const basePatch = () => ({
    title: form.title.trim(),
    assignee: form.assignee.trim(),
    priority: form.priority,
    due: form.due,
    tags,
    description: form.description,
    checklist,
  });

  const save = () => {
    rememberAssignee(form.assignee);
    onUpdate?.({ ...basePatch(), comments });
    onClose();
  };

  const completeWithNote = () => {
    const note = window.prompt("Completion note (optional):", "") || "";
    const ts = new Date().toISOString();
    const completionComment = { id: uid(), author: engineer, text: note ? `Completed: ${note}` : "Completed", ts };
    rememberAssignee(form.assignee);
    onUpdate?.({ ...basePatch(), comments: [...comments, completionComment], completedAt: ts, completionNote: note });
    onClose();
  };

  // checklist ops
  const addChecklistItem = () => {
    const t = newItem.trim(); if (!t) return;
    setChecklist(prev => [...prev, { id: uid(), text: t, done: false }]);
    setNewItem("");
  };
  const toggleItem = (id) => setChecklist(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it));
  const editItem   = (id, text) => setChecklist(prev => prev.map(it => it.id === id ? { ...it, text } : it));
  const removeItem = (id) => setChecklist(prev => prev.filter(it => it.id !== id));
  const moveItem   = (index, dir) =>
    setChecklist(prev => {
      const next = [...prev]; const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });

  // comments
  const addComment = () => {
    const t = newComment.trim(); if (!t) return;
    setComments(prev => [...prev, { id: uid(), author: engineer, text: t, ts: new Date().toISOString() }]);
    setNewComment("");
  };

  // tags chip editor
  const addTag = (raw) => {
    const t = raw.trim().replace(/^#/, "");
    if (!t) return;
    setTags(prev => unique([...prev, t]));
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-auto">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200">
          {/* header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur px-5 py-3 border-b rounded-t-2xl z-10">
            <div className="flex items-center justify-between gap-3">
              <input
                className="text-lg font-semibold w-full mr-2 outline-none"
                value={form.title}
                onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))}
              />
              <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} title="Close (Esc)">
                <X size={20} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <CheckSquare size={14} /> {done}/{total} • {pct}%
              </span>
              <div className="flex-1 h-1.5 rounded bg-gray-200 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* body */}
          <div className="p-5 grid md:grid-cols-12 gap-5">
            {/* left */}
            <div className="md:col-span-8 space-y-5">
              <section>
                <div className="text-sm font-semibold mb-1">Description</div>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm min-h-[140px]"
                  placeholder="Write details…"
                  value={form.description}
                  onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))}
                />
                <div className="mt-1 text-xs text-gray-500">
                  Tip: Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> to save.
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold inline-flex items-center gap-2">
                    <CheckSquare size={16} /> Checklist
                    <span className="text-xs text-gray-500">{done}/{total}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {checklist.map((it, idx) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <input type="checkbox" className="mt-0.5" checked={it.done} onChange={() => toggleItem(it.id)} />
                      <input
                        className={`flex-1 border rounded px-2 py-1 text-sm ${it.done ? "line-through text-gray-400" : ""}`}
                        value={it.text}
                        onChange={(e) => editItem(it.id, e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-gray-100" title="Move up" onClick={() => moveItem(idx, -1)}><ChevronUp size={16} /></button>
                        <button className="p-1 rounded hover:bg-gray-100" title="Move down" onClick={() => moveItem(idx, 1)}><ChevronDown size={16} /></button>
                        <button className="p-1 rounded hover:bg-gray-100" onClick={() => removeItem(it.id)} title="Remove"><Trash2 size={16} /></button>
                      </div>
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

            {/* right */}
            <aside className="md:col-span-4 space-y-3">
              <div className="text-sm font-semibold">Card details</div>

              {/* summary strip with editable avatar */}
              <div className="relative flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
                <button
                  type="button"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-sm font-semibold"
                  title={form.assignee || "Set assignee"}
                  onClick={() => {
                    setAssigneeDraft(form.assignee || "");
                    setAssigneeOpen(v => !v);
                  }}
                >
                  {initials(form.assignee)}
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow border">
                    <Pencil size={12} />
                  </span>
                </button>

                <div className="flex flex-col gap-1">
                  <div className="text-sm">{form.assignee || <span className="text-gray-500">Unassigned</span>}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${priorityClass(form.priority)}`}>{form.priority}</span>
                    {form.due && (
                      <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        <CalendarDays size={14} /> {form.due}
                      </span>
                    )}
                  </div>
                </div>

                {/* assignee popover */}
                {assigneeOpen && (
                  <div className="absolute z-20 top-12 left-2 w-64 bg-white border rounded shadow-lg p-2">
                    <div className="text-xs text-gray-600 mb-1">Assignee</div>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Type a name…"
                      value={assigneeDraft}
                      onChange={(e) => setAssigneeDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { setForm(s => ({ ...s, assignee: assigneeDraft.trim() })); setAssigneeOpen(false); }
                        if (e.key === "Escape") setAssigneeOpen(false);
                      }}
                      autoFocus
                    />
                    {assignees.length > 0 && (
                      <>
                        <div className="mt-2 text-xs text-gray-500">Recent</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {assignees.map((n) => (
                            <button
                              key={n}
                              className="px-2 py-0.5 border rounded text-xs hover:bg-gray-50"
                              onClick={() => { setForm(s => ({ ...s, assignee: n })); setAssigneeOpen(false); }}
                              title={n}
                            >
                              {initials(n)} • {n}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button className="text-sm underline" onClick={() => setAssigneeOpen(false)}>Cancel</button>
                      <button className="px-2 py-1 border rounded text-sm" onClick={() => { setForm(s => ({ ...s, assignee: assigneeDraft.trim() })); setAssigneeOpen(false); }}>Save</button>
                    </div>
                  </div>
                )}
              </div>

              {/* priority */}
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.priority}
                onChange={(e) => setForm(s => ({ ...s, priority: e.target.value }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* due + quick picks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    value={form.due}
                    onChange={(e) => setForm(s => ({ ...s, due: e.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: addWeeks(s.due || toISODate(), 1) }))}>+1w</button>
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: addWeeks(s.due || toISODate(), 2) }))}>+2w</button>
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: addMonths(s.due || toISODate(), 1) }))}>+1m</button>
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: addMonths(s.due || toISODate(), 3) }))}>+3m</button>
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: toISODate() }))}>Today</button>
                  <button className="px-2 py-0.5 border rounded text-xs" onClick={() => setForm(s => ({ ...s, due: "" }))}>Clear</button>
                </div>
              </div>

              {/* tags chip editor */}
              <div>
                <div className="text-sm font-semibold mb-1 inline-flex items-center gap-2">
                  <TagIcon size={16} /> Tags
                </div>
                <div className="flex flex-wrap gap-2 border rounded px-2 py-2">
                  {tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 inline-flex items-center gap-1">
                      #{t}
                      <button className="hover:opacity-70" onClick={() => removeTag(t)} title="Remove">×</button>
                    </span>
                  ))}
                  <input
                    className="min-w-[8rem] flex-1 outline-none text-sm"
                    placeholder="Type tag and press Enter…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </aside>
          </div>

          {/* footer */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur px-5 py-3 border-t rounded-b-2xl z-10">
            <div className="flex items-center justify-end gap-2">
              {isInProgressColumn ? (
                <button className="px-3 py-1 text-sm border rounded bg-green-600 text-white" onClick={completeWithNote}>
                  Mark complete
                </button>
              ) : isTodoColumn ? (
                <button className="px-3 py-1 text-sm border rounded bg-blue-600 text-white" onClick={onMoveToInProgress}>
                  Move to In Progress
                </button>
              ) : isDoneColumn ? (
                <button className="px-3 py-1 text-sm border rounded" onClick={completeWithNote}>
                  Add completion note
                </button>
              ) : null}

              <button className="px-3 py-1 text-sm underline" onClick={onClose}>Close</button>
              <button
                className="px-3 py-1 text-sm text-red-600 underline"
                onClick={() => { if (window.confirm("Delete this card?")) onDelete?.(); }}
              >
                Delete
              </button>
              <button className="px-3 py-1 border rounded text-sm" onClick={save} title="Ctrl/Cmd + Enter">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
