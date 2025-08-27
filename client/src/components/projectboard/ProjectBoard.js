// ============================
// File: src/components/projectboard/ProjectBoard.js
// ============================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BoardSection from "./BoardSection";
import {
  Plus,
  Tag,
  Eraser,
  Menu as MenuIcon,
  Layers,
  Copy,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/* -------------------------------------------------
   Storage & utilities
--------------------------------------------------*/
// Legacy single-board key (your current one)
const LEGACY_STORAGE_KEY = "pano.projectboard.v1";
// New multi-board key
const BOARDS_KEY = "pano.projectboards.v1";

const uid = () => Math.random().toString(36).slice(2, 9);

// ---- Default seed
const DEFAULT_COLUMNS = {
  todo: {
    id: "todo",
    title: "To Do",
    wipLimit: null,
    tasks: [
      { id: "t1", title: "Task 1", assignee: "", priority: "medium", due: "", tags: [], createdAt: new Date().toISOString() },
      { id: "t2", title: "Task 2", assignee: "", priority: "low",    due: "", tags: [], createdAt: new Date().toISOString() },
    ],
  },
  inprogress: {
    id: "inprogress",
    title: "In Progress",
    wipLimit: 3,
    tasks: [
      { id: "t3", title: "Task 3", assignee: "", priority: "high", due: "", tags: [], createdAt: new Date().toISOString() }
    ],
  },
  done: {
    id: "done",
    title: "Done",
    wipLimit: null,
    tasks: [
      { id: "t4", title: "Task 4", assignee: "", priority: "low", due: "", tags: ["done"], createdAt: new Date().toISOString(), doneAt: new Date().toISOString() }
    ],
  },
};
const DEFAULT_ORDER = ["todo", "inprogress", "done"];

// ensure settings exists (only tagHues now; Strict WIP removed)
const withDefaults = (state) => {
  const defaults = { settings: { tagHues: {} } };
  return { ...defaults, ...state, settings: { ...defaults.settings, ...(state.settings || {}) } };
};

// Multi-board persistence
function loadBoards() {
  // Try multi-board store first
  const raw = localStorage.getItem(BOARDS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }

  // Migrate legacy single-board if present
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const data = JSON.parse(legacy);
      const id = `board_${uid()}`;
      const migrated = { boards: { [id]: { id, name: "My board", data } }, currentId: id };
      localStorage.setItem(BOARDS_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {}
  }

  // Fresh seed
  const id = `board_${uid()}`;
  const seedData = withDefaults({ columns: DEFAULT_COLUMNS, columnOrder: DEFAULT_ORDER });
  const seed = { boards: { [id]: { id, name: "My board", data: seedData } }, currentId: id };
  localStorage.setItem(BOARDS_KEY, JSON.stringify(seed));
  return seed;
}
function saveBoards(store) {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(store));
}

const MemoBoardSection = React.memo(BoardSection);

// collect unique tags across all tasks
const collectTags = (columns) => {
  const set = new Set();
  Object.values(columns).forEach((col) =>
    col.tasks.forEach((t) => (t.tags || []).forEach((tg) => set.add(tg)))
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

/* -------------------------------------------------
   Tiny dependency-free Dropdown for menus
--------------------------------------------------*/
function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative inline-block text-left"
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    >
      <button
        className="h-9 w-9 rounded-2xl grid place-items-center hover:bg-gray-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Board menu"
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-64 origin-top-left rounded-2xl border bg-white shadow-xl p-2">
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------
   Header UI micro-components (visual polish)
--------------------------------------------------*/
function AccentBar({ hue = 220 }) {
  return (
    <div
      className="h-10 w-1.5 rounded-full"
      style={{ background: `linear-gradient(180deg, hsl(${hue} 90% 55%) 0%, hsl(${hue + 20} 85% 50%) 100%)` }}
    />
  );
}

function BoardBadge({ name }) {
  return (
    <div
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm"
      title="Current board"
    >
      <span className="h-2 w-2 rounded-full bg-blue-500" />
      <Layers size={16} className="opacity-70 group-hover:opacity-100" />
      <span className="font-medium">{name}</span>
      <ChevronDown size={16} className="opacity-60 group-hover:opacity-100" />
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
      <span className="font-semibold">{value}</span> {label}
    </span>
  );
}

/* -------------------------------------------------
   Main component
--------------------------------------------------*/
export default function ProjectBoard() {
  // --- Multi-board store
  const [store, setStore] = useState(() => loadBoards()); // { boards: { id: { id, name, data } }, currentId }
  const currentBoard = store.boards[store.currentId];
  const boardName = currentBoard?.name || "Board";
  const boardHue  = useMemo(() => autoHue(boardName), [boardName]);

  // --- Per-board state
  const [state, setState] = useState(() => withDefaults(currentBoard.data));
  const { columns, columnOrder, settings } = state;

  // ---- Filters
  const [filters, setFilters] = useState({ q: "", priority: "all", assignee: "", tag: "" });
  const filtersActive = useMemo(
    () =>
      (filters.q && filters.q.trim() !== "") ||
      (filters.priority && filters.priority !== "all") ||
      (filters.assignee && filters.assignee.trim() !== "") ||
      (filters.tag && filters.tag.trim() !== ""),
    [filters]
  );

  const [notice, setNotice] = useState("");
  const showNotice = useCallback((msg) => {
    setNotice(msg);
    window.clearTimeout(showNotice._t);
    showNotice._t = window.setTimeout(() => setNotice(""), 2500);
  }, []);

  // precise hover indicator (index within current droppable)
  const [hover, setHover] = useState(null); // { droppableId, index } | null

  // ---- Multi-board aware updateState (persists into current board)
  const updateState = useCallback((producer) => {
    setState((prev) => {
      const next = withDefaults(typeof producer === "function" ? producer(prev) : producer);
      setStore((s) => {
        const updated = { ...s, boards: { ...s.boards, [s.currentId]: { ...s.boards[s.currentId], data: next } } };
        saveBoards(updated);
        return updated;
      });
      return next;
    });
  }, []);

  // Sync local state when switching boards
  useEffect(() => {
    setState(withDefaults(store.boards[store.currentId].data));
  }, [store.currentId, store.boards]);

  // ---- DnD
  const handleDragUpdate = useCallback(({ destination }) => {
    if (destination) setHover({ droppableId: destination.droppableId, index: destination.index });
    else setHover(null);
  }, []);

  const handleDragEnd = useCallback(
    ({ source, destination, type }) => {
      setHover(null); // clear indicator

      if (!destination) return;

      if (filtersActive) {
        showNotice("Drag is disabled while filters are active.");
        return;
      }

      if (type === "COLUMN") {
        updateState((prev) => {
          const nextOrder = Array.from(prev.columnOrder);
          const [moved] = nextOrder.splice(source.index, 1);
          nextOrder.splice(destination.index, 0, moved);
          return { ...prev, columnOrder: nextOrder };
        });
        return;
      }

      const srcId = source.droppableId;
      const dstId = destination.droppableId;

      if (srcId === dstId) {
        updateState((prev) => {
          const newTasks = [...prev.columns[srcId].tasks];
          const [moved] = newTasks.splice(source.index, 1);
          newTasks.splice(destination.index, 0, moved);
          return {
            ...prev,
            columns: { ...prev.columns, [srcId]: { ...prev.columns[srcId], tasks: newTasks } },
          };
        });
      } else {
        updateState((prev) => {
          const destLimit = prev.columns[dstId].wipLimit;
          const destCount = prev.columns[dstId].tasks.length;
          if (destLimit && destCount >= destLimit) {
            showNotice(`WIP limit reached for "${prev.columns[dstId].title}"`);
            return prev;
          }

          const sourceTasks = [...prev.columns[srcId].tasks];
          const destTasks = [...prev.columns[dstId].tasks];
          const [moved] = sourceTasks.splice(source.index, 1);

          // toggle doneAt timestamp
          if (dstId === "done") moved.doneAt = new Date().toISOString();
          else if (moved.doneAt) delete moved.doneAt;

          destTasks.splice(destination.index, 0, moved);

          return {
            ...prev,
            columns: {
              ...prev.columns,
              [srcId]: { ...prev.columns[srcId], tasks: sourceTasks },
              [dstId]: { ...prev.columns[dstId], tasks: destTasks },
            },
          };
        });
      }
    },
    [filtersActive, showNotice, updateState]
  );

  // ---- Column actions
  const handleAddColumnInline = useCallback(
    (title) => {
      const name = (title || "").trim();
      if (!name) return;
      const id = uid();
      updateState((prev) => ({
        ...prev,
        columns: { ...prev.columns, [id]: { id, title: name, wipLimit: null, tasks: [] } },
        columnOrder: [...prev.columnOrder, id],
      }));
    },
    [updateState]
  );

  const handleRenameColumn = useCallback(
    (columnId, newTitle) => {
      const title = (newTitle || "").trim();
      if (!title) return;
      updateState((prev) => ({
        ...prev,
        columns: { ...prev.columns, [columnId]: { ...prev.columns[columnId], title } },
      }));
    },
    [updateState]
  );

  const handleDeleteColumn = useCallback(
    (columnId) => {
      updateState((prev) => {
        const { [columnId]: _omit, ...restCols } = prev.columns;
        return {
          ...prev,
          columns: restCols,
          columnOrder: prev.columnOrder.filter((id) => id !== columnId),
        };
      });
    },
    [updateState]
  );

  const handleSetWip = useCallback(
    (columnId, limitValue) => {
      const val = limitValue === "" ? null : Math.max(0, Number(limitValue) || 0);
      const wipLimit = val === 0 ? null : val;
      updateState((prev) => ({
        ...prev,
        columns: { ...prev.columns, [columnId]: { ...prev.columns[columnId], wipLimit } },
      }));
    },
    [updateState]
  );

  // ---- Task actions
  const handleAddTaskInline = useCallback(
    (columnId, title) => {
      const t = (title || "").trim();
      if (!t) return;
      updateState((prev) => {
        const col = prev.columns[columnId];
        if (col.wipLimit && col.tasks.length >= col.wipLimit) {
          showNotice(`WIP limit reached for "${col.title}"`);
          return prev;
        }
        const task = {
          id: uid(),
          title: t,
          assignee: "",
          priority: "medium",
          due: "",
          tags: [],
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          columns: { ...prev.columns, [columnId]: { ...col, tasks: [...col.tasks, task] } },
        };
      });
    },
    [showNotice, updateState]
  );

  const handleDeleteTask = useCallback(
    (columnId, taskId) => {
      updateState((prev) => {
        const col = prev.columns[columnId];
        return {
          ...prev,
          columns: {
            ...prev.columns,
            [columnId]: { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) },
          },
        };
      });
    },
    [updateState]
  );

  const handleUpdateTask = useCallback(
    (columnId, taskId, patch) => {
      updateState((prev) => {
        const col = prev.columns[columnId];
        const nextTasks = col.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
        return { ...prev, columns: { ...prev.columns, [columnId]: { ...col, tasks: nextTasks } } };
      });
    },
    [updateState]
  );

  // Move from modal (“Move to In Progress”)
  const handleMoveTask = useCallback(
    (sourceColumnId, taskId, destColumnId) => {
      if (sourceColumnId === destColumnId) return;
      updateState((prev) => {
        const src = prev.columns[sourceColumnId];
        const dst = prev.columns[destColumnId];
        if (!src || !dst) return prev;

        if (dst.wipLimit && dst.tasks.length >= dst.wipLimit) {
          showNotice(`WIP limit reached for "${dst.title}"`);
          return prev;
        }

        const sourceTasks = [...src.tasks];
        const idx = sourceTasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return prev;

        const [moved] = sourceTasks.splice(idx, 1);
        if (destColumnId === "done") moved.doneAt = new Date().toISOString();
        else if (moved.doneAt) delete moved.doneAt;

        const destTasks = [moved, ...dst.tasks]; // prepend at top

        return {
          ...prev,
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...src, tasks: sourceTasks },
            [destColumnId]: { ...dst, tasks: destTasks },
          },
        };
      });
    },
    [showNotice, updateState]
  );

  // ---- Tag manager helpers
  const allTags = useMemo(() => collectTags(columns), [columns]);
  const [tagDrawerOpen, setTagDrawerOpen] = useState(false);

  // Filtering
  const matchesFilters = useCallback(
    (task) => {
      const q = filters.q.trim().toLowerCase();
      if (q) {
        const inTitle = task.title.toLowerCase().includes(q);
        const inTags = (task.tags || []).some((tg) => tg.toLowerCase().includes(q));
        if (!inTitle && !inTags) return false;
      }
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;
      if (filters.assignee && !String(task.assignee || "").toLowerCase().includes(filters.assignee.toLowerCase()))
        return false;
      if (filters.tag && !(task.tags || []).map((t) => t.toLowerCase()).includes(filters.tag.toLowerCase()))
        return false;
      return true;
    },
    [filters]
  );

  // ---- UI numbers
  const totalTasks = useMemo(
    () => Object.values(columns).reduce((n, col) => n + col.tasks.length, 0),
    [columns]
  );
  const doneTasks = useMemo(() => columns.done?.tasks.length || 0, [columns]);

  // ---- UI
  const [addingCol, setAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  // --- Board menu actions
  const newBoard = useCallback(() => {
    const name = window.prompt("Board name?", "New board");
    if (!name) return;
    const id = `board_${uid()}`;
    const fresh = withDefaults({ columns: DEFAULT_COLUMNS, columnOrder: DEFAULT_ORDER });
    setStore((s) => {
      const next = { boards: { ...s.boards, [id]: { id, name, data: fresh } }, currentId: id };
      saveBoards(next);
      return next;
    });
  }, []);

  const switchBoard = useCallback((id) => {
    setStore((s) => { const next = { ...s, currentId: id }; saveBoards(next); return next; });
  }, []);

  const renameBoard = useCallback(() => {
    const name = window.prompt("Rename board", store.boards[store.currentId].name || "");
    if (!name) return;
    setStore((s) => {
      const next = { ...s, boards: { ...s.boards, [s.currentId]: { ...s.boards[s.currentId], name } } };
      saveBoards(next); return next;
    });
  }, [store.boards, store.currentId]);

  const duplicateBoard = useCallback(() => {
    const id = `board_${uid()}`;
    const source = store.boards[store.currentId];
    const cloned = JSON.parse(JSON.stringify(source.data));
    const next = { boards: { ...store.boards, [id]: { id, name: `${source.name} (copy)`, data: cloned } }, currentId: id };
    setStore(next); saveBoards(next);
  }, [store.boards, store.currentId]);

  const deleteBoard = useCallback(() => {
    if (Object.keys(store.boards).length === 1) {
      alert("You must keep at least one board.");
      return;
    }
    if (!window.confirm(`Delete board “${boardName}”? This cannot be undone.`)) return;
    setStore((s) => {
      const copy = { ...s.boards };
      delete copy[s.currentId];
      const nextId = Object.keys(copy)[0];
      const next = { boards: copy, currentId: nextId };
      saveBoards(next);
      return next;
    });
  }, [store.boards, store.currentId]);

  return (
    <div className="p-4 overflow-x-auto">
      {/* Sticky hero header */}
      <div className="sticky top-0 z-40 -mx-4 px-4 pb-3 mb-3 bg-white/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b" style={{ backgroundImage: `linear-gradient(180deg, hsl(${boardHue} 100% 98%) 0%, white 55%)` }}>
        <div className="flex items-center justify-between">
          {/* Left: accent + title */}
          <div className="flex items-center gap-3">
            <AccentBar hue={boardHue} />
            <div className="leading-tight">
              <div className="flex items-center gap-3">
                <Dropdown trigger={<MenuIcon className="text-blue-600" />} >
                  {({ close }) => (
                    <div>
                      <div className="px-3 pt-1 pb-2 text-xs font-semibold text-gray-500">
                        {Object.keys(store.boards).length} boards
                      </div>
                      <div className="max-h-48 overflow-auto mb-2">
                        {Object.values(store.boards).map((b) => (
                          <button
                            key={b.id}
                            className="w-full flex items-center justify-between px-4 py-2 rounded-2xl hover:bg-gray-50"
                            onClick={() => { switchBoard(b.id); close(); }}
                          >
                            <span className={b.id === store.currentId ? "font-semibold" : ""}>
                              <span className="inline-flex items-center gap-2">
                                <Layers size={16}/> {b.name}
                              </span>
                            </span>
                            {b.id === store.currentId && <ChevronRight size={16} />}
                          </button>
                        ))}
                      </div>
                      <hr className="my-2" />
                      <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50"
                              onClick={() => { newBoard(); close(); }}>
                        <Plus size={16}/> New board
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50"
                              onClick={() => { duplicateBoard(); close(); }}>
                        <Copy size={16}/> Duplicate current
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50"
                              onClick={() => { renameBoard(); close(); }}>
                        <Edit3 size={16}/> Rename current
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl text-red-600 hover:bg-red-50"
                              onClick={() => { deleteBoard(); close(); }}>
                        <Trash2 size={16}/> Delete current
                      </button>
                    </div>
                  )}
                </Dropdown>

                {/* PRIMARY TITLE — board name */}
                <h1 className="text-2xl font-bold tracking-tight leading-tight">
                  {boardName}
                </h1>
              </div>

              {/* Subline: app label + stats */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  <span className="font-semibold">{doneTasks}/{totalTasks}</span> done
                </span>
                <span>•</span>
                <span>Project Board</span>
              </div>
            </div>
          </div>

          {/* Right: board badge that also opens a switcher menu */}
          <Dropdown trigger={<div><BoardBadge name={boardName} /></div>}>
            {({ close }) => (
              <div>
                <div className="px-3 pt-1 pb-2 text-xs font-semibold text-gray-500">Boards</div>
                <div className="max-h-48 overflow-auto mb-2">
                  {Object.values(store.boards).map((b) => (
                    <button
                      key={b.id}
                      className="w-full flex items-center justify-between px-4 py-2 rounded-2xl hover:bg-gray-50"
                      onClick={() => { switchBoard(b.id); close(); }}
                    >
                      <span className={b.id === store.currentId ? "font-semibold" : ""}>
                        <span className="inline-flex items-center gap-2"><Layers size={16}/>{b.name}</span>
                      </span>
                      {b.id === store.currentId && <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
                <hr className="my-2" />
                <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50"
                        onClick={() => { newBoard(); close(); }}>
                  <Plus size={16}/> New board
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-gray-50"
                        onClick={() => { renameBoard(); close(); }}>
                  <Edit3 size={16}/> Rename current
                </button>
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      {/* Filters + Actions (optional spacing polish) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 mt-1">
        {/* Filters (left) */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-9 border border-slate-200 rounded-full px-3 text-sm bg-white/90 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Search title or tags…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="h-9 border border-slate-200 rounded-full px-3 text-sm bg-white/90 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="h-9 border border-slate-200 rounded-full px-3 text-sm bg-white/90 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Assignee"
            value={filters.assignee}
            onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
          />
          <input
            className="h-9 border border-slate-200 rounded-full px-3 text-sm bg-white/90 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Tag"
            value={filters.tag}
            onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
          />
        </div>

        {/* Actions toolbar (right) */}
        <div className="ml-2 flex items-center gap-2">
          {/* Edit tags */}
          <button
            type="button"
            onClick={() => setTagDrawerOpen(true)}
            title="Edit tags"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-200 bg-white/90 text-sm shadow-sm hover:bg-slate-50
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          >
            <Tag size={16} />
            <span className="hidden sm:inline">Edit tags</span>
          </button>

          {/* Clear filters */}
          <button
            type="button"
            onClick={() => setFilters({ q: "", priority: "all", assignee: "", tag: "" })}
            title="Clear filters"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-200 bg-white/90 text-sm shadow-sm hover:bg-slate-50
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          >
            <Eraser size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Add column */}
          {!addingCol ? (
            <button
              type="button"
              onClick={() => setAddingCol(true)}
              title="Add column"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-blue-600 text-white text-sm shadow hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add column</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                className="h-9 border border-slate-200 rounded-full px-3 text-sm bg-white/90 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                placeholder="New column title"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddColumnInline(newColTitle);
                    setNewColTitle("");
                    setAddingCol(false);
                  } else if (e.key === "Escape") {
                    setAddingCol(false);
                    setNewColTitle("");
                  }
                }}
                autoFocus
              />
              <button
                className="h-9 px-3 rounded-full border border-slate-200 text-sm bg-white hover:bg-slate-50"
                onClick={() => {
                  handleAddColumnInline(newColTitle);
                  setNewColTitle("");
                  setAddingCol(false);
                }}
              >
                Add
              </button>
              <button
                className="h-9 px-2 text-sm underline"
                onClick={() => {
                  setAddingCol(false);
                  setNewColTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="mb-3 text-sm rounded bg-yellow-50 border border-yellow-200 text-yellow-900 px-3 py-2">
          {notice}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4 overflow-visible">
              {columnOrder.map((colId, index) => {
                const col = columns[colId];
                if (!col) return null;
                const visibleTasks = col.tasks.filter((t) => matchesFilters(t));
                const overLimit = !!(col.wipLimit && col.tasks.length >= col.wipLimit);

                return (
                  <Draggable key={col.id} draggableId={col.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...(dragProvided.draggableProps.style || {}),
                          willChange: "transform",
                          zIndex: dragSnapshot.isDragging ? 1000 : undefined,
                          position: dragSnapshot.isDragging ? "relative" : undefined,
                        }}
                      >
                        <MemoBoardSection
                          id={col.id}
                          title={col.title}
                          wipLimit={col.wipLimit}
                          totalCount={col.tasks.length}
                          tasks={visibleTasks}
                          filtersActive={filtersActive}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onAddTask={(title) => handleAddTaskInline(col.id, title)}
                          onDeleteTask={(taskId) => handleDeleteTask(col.id, taskId)}
                          onUpdateTask={(taskId, patch) => handleUpdateTask(col.id, taskId, patch)}
                          onRenameColumn={(newTitle) => handleRenameColumn(col.id, newTitle)}
                          onDeleteColumn={() => handleDeleteColumn(col.id)}
                          onSetWip={(limit) => handleSetWip(col.id, limit)}
                          onMoveTask={(taskId, destId) => handleMoveTask(col.id, taskId, destId)}
                          tagHues={settings.tagHues}
                          dropDisabled={false}
                          overLimit={overLimit}
                          hoverIndex={hover && hover.droppableId === col.id ? hover.index : -1}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Tag Drawer */}
      {tagDrawerOpen && (
        <TagDrawer
          tags={allTags}
          tagHues={settings.tagHues}
          onClose={() => setTagDrawerOpen(false)}
          onApply={(rows) => applyTagChanges(rows, updateState)}
        />
      )}
    </div>
  );
}

/* ============================
   Tag Drawer component
=============================*/
function TagDrawer({ tags, tagHues, onClose, onApply }) {
  const [rows, setRows] = useState(() =>
    tags.map((t) => ({
      oldName: t,
      name: t,
      hue: (tagHues && Number.isFinite(tagHues[t])) ? tagHues[t] : autoHue(t),
      remove: false
    }))
  );

  const setRow = (i, patch) => {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Edit tags</h3>
          <button className="text-sm underline" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
          {rows.length === 0 && <div className="text-sm text-gray-500">No tags yet.</div>}
          {rows.map((row, i) => (
            <div key={row.oldName} className="flex items-center gap-2 border rounded p-2">
              <span
                className="inline-block w-4 h-4 rounded"
                style={{ backgroundColor: `hsl(${row.hue} 70% 50%)` }}
                title="Color"
              />
              <input
                className="border rounded px-2 py-1 text-sm flex-1"
                value={row.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
              />
              <input
                type="range" min={0} max={359}
                value={row.hue}
                onChange={(e) => setRow(i, { hue: Number(e.target.value) })}
                title="Hue"
              />
              <label className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={row.remove}
                  onChange={(e) => setRow(i, { remove: e.target.checked })}
                />
                delete
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="text-sm underline" onClick={onClose}>Cancel</button>
          <button
            className="text-sm px-3 py-1 border rounded"
            onClick={() => { onApply(rows); onClose(); }}
          >
            Apply
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Renaming two tags to the same name will merge them. Deleting removes the tag from all cards.
        </div>
      </div>
    </div>
  );
}

/* ============================
   Tag helpers
=============================*/
function autoHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

// applyTagChanges extracted so it can use updateState from parent cleanly
function applyTagChanges(rows, updateState) {
  const clampHue = (n) => Math.max(0, Math.min(359, Math.round(n)));
  const renameMap = new Map();
  const newHues = {};

  rows.forEach(({ oldName, name, hue, remove }) => {
    const target = (name || "").trim();
    if (!target || remove) {
      renameMap.set(oldName, null); // delete tag from cards
    } else {
      renameMap.set(oldName, target);
      newHues[target] = Number.isFinite(hue) ? clampHue(hue) : autoHue(target);
    }
  });

  updateState((prev) => {
    const nextCols = { ...prev.columns };
    Object.values(nextCols).forEach((col) => {
      col.tasks = col.tasks.map((t) => {
        const tags = (t.tags || [])
          .map((tg) => (renameMap.has(tg) ? renameMap.get(tg) : tg))
          .filter(Boolean);
        return { ...t, tags };
      });
    });
    return { ...prev, columns: nextCols, settings: { ...prev.settings, tagHues: newHues } };
  });
}
