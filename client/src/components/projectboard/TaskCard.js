import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Pencil, Trash2, CalendarDays, CheckSquare, GripVertical } from "lucide-react";
import CardModal from "./CardModal";

/* ---------- helpers ---------- */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (letters.length >= 2) return letters.slice(0, 2);
  if (letters.length === 1) return letters;
  return "—";
}
function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
function parseISODate(d) {
  if (!d) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  return new Date(Date.UTC(y, mo, da));
}
function startOfTodayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
function dueStatus(due, isDone) {
  if (isDone) return "done";
  const dt = parseISODate(due);
  if (!dt) return "none";
  const today = startOfTodayUTC();
  const diffDays = Math.floor((dt - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "scheduled";
}

/* ---------- component ---------- */
function TaskCardInner({
  task,
  onDelete,
  onUpdate,
  isDragging = false,
  isDoneColumn = false,
  isInProgressColumn = false,
  isTodoColumn = false,
  onMoveToInProgress = () => {},
  // drag handle for the small grip only:
  dragHandleProps = {},
  // tag hue map from ProjectBoard settings
  tagHues = {},
}) {
  const safe = {
    id: task?.id ?? "",
    title: task?.title ?? "",
    assignee: task?.assignee ?? "",
    priority: task?.priority ?? "medium",
    due: task?.due ?? "",
    tags: Array.isArray(task?.tags) ? task.tags : [],
    checklist: Array.isArray(task?.checklist) ? task.checklist : [],
  };

  const tagStyle = (tg) => {
    const hasHue = tagHues && Number.isFinite(tagHues[tg]);
    const h = hasHue ? tagHues[tg] : hueFromString(tg.toLowerCase());
    return { backgroundColor: `hsl(${h} 70% 92%)`, color: `hsl(${h} 30% 28%)` };
  };

  const { done, total, pct, ds, priorityBadge, accent, dueBadge } = useMemo(() => {
    const done = safe.checklist.filter((i) => i.done).length;
    const total = safe.checklist.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const priorityBadge =
      safe.priority === "high"
        ? "bg-red-100 text-red-700"
        : safe.priority === "low"
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-800";

    const accent =
      safe.priority === "high"
        ? "before:bg-red-500"
        : safe.priority === "low"
        ? "before:bg-green-500"
        : "before:bg-amber-500";

    const ds = dueStatus(safe.due, isDoneColumn);
    const dueBadge =
      ds === "overdue"
        ? "bg-red-100 text-red-700"
        : ds === "soon"
        ? "bg-amber-100 text-amber-800"
        : ds === "done"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-700";

    return { done, total, pct, ds, priorityBadge, accent, dueBadge };
  }, [safe.checklist, safe.due, safe.priority, isDoneColumn]);

  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`group relative select-none bg-white rounded-xl p-3 text-sm shadow-sm hover:shadow-md transition border ${
          isDragging ? "border-blue-300" : "border-transparent"
        } before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl ${accent}`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* small grip = true drag handle (prevents click-vs-drag conflict) */}
          <span
            {...dragHandleProps}
            data-drag-handle
            title="Drag card"
            className="p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing shrink-0"
            aria-label="Drag card"
            style={{ touchAction: "manipulation" }}
          >
            <GripVertical size={16} />
          </span>

          {/* clickable body */}
          <button
            type="button"
            className="flex items-start gap-3 flex-1 min-w-0 text-left"
            onClick={() => setOpen(true)}
          >
            {/* avatar */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-[11px] font-semibold shrink-0"
              title={safe.assignee || "Unassigned"}
            >
              {initials(safe.assignee)}
            </div>

            {/* content */}
            <div className="min-w-0 w-full">
              <div className="font-medium truncate">{safe.title}</div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {safe.priority && (
                  <span className={`px-2 py-0.5 rounded ${priorityBadge}`}>{safe.priority}</span>
                )}
                {safe.due && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${dueBadge}`}>
                    <CalendarDays size={14} />
                    {ds === "overdue" ? "Overdue" : "Due"} {safe.due}
                  </span>
                )}
                {(safe.tags || []).slice(0, 3).map((tg) => (
                  <span key={tg} className="px-2 py-0.5 rounded" style={tagStyle(tg)}>
                    #{tg}
                  </span>
                ))}
                {(safe.tags || []).length > 3 && (
                  <span className="text-gray-500">+{safe.tags.length - 3} more</span>
                )}
              </div>

              {/* checklist progress */}
              {total > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare size={12} /> {done}/{total}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button title="Edit" onClick={() => setOpen(true)} className="p-1 rounded hover:bg-gray-100">
              <Pencil size={16} />
            </button>
            <button title="Delete" onClick={onDelete} className="p-1 rounded hover:bg-gray-100">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal via PORTAL to body so it centers & isn't clipped */}
      {open &&
        ReactDOM.createPortal(
          <CardModal
            open
            onClose={() => setOpen(false)}
            task={task}
            onUpdate={(patch) => onUpdate?.(patch)}
            onDelete={onDelete}
            isDoneColumn={isDoneColumn}
            isInProgressColumn={isInProgressColumn}
            isTodoColumn={isTodoColumn}
            onMoveToInProgress={onMoveToInProgress}
          />,
          document.body
        )}
    </>
  );
}

/* ---------- memo to avoid re-renders of non-dragging cards ---------- */
function areEqual(prev, next) {
  const a = prev.task || {};
  const b = next.task || {};
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.isDoneColumn !== next.isDoneColumn) return false;
  if (prev.isInProgressColumn !== next.isInProgressColumn) return false;
  if (prev.isTodoColumn !== next.isTodoColumn) return false;
  if (prev.tagHues !== next.tagHues) return false;
  if (a.id !== b.id) return false;
  if (a.title !== b.title) return false;
  if (a.assignee !== b.assignee) return false;
  if (a.priority !== b.priority) return false;
  if (a.due !== b.due) return false;

  const at = Array.isArray(a.tags) ? a.tags.join("|") : "";
  const bt = Array.isArray(b.tags) ? b.tags.join("|") : "";
  if (at !== bt) return false;

  const ac = Array.isArray(a.checklist) ? a.checklist.map((i) => `${i.id}:${i.done}:${i.text}`).join("|") : "";
  const bc = Array.isArray(b.checklist) ? b.checklist.map((i) => `${i.id}:${i.done}:${i.text}`).join("|") : "";
  if (ac !== bc) return false;

  return true;
}

export default React.memo(TaskCardInner, areEqual);
