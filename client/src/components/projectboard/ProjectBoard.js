// ============================
// File: src/components/projectboard/ProjectBoard.js
// ============================
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BoardSection from "./BoardSection";
import { Plus } from "lucide-react";

const STORAGE_KEY = "pano.projectboard.v1";
const uid = () => Math.random().toString(36).slice(2, 9);

// ---- Default seed
const DEFAULT_COLUMNS = {
  todo: {
    id: "todo",
    title: "To Do",
    wipLimit: null,
    tasks: [
      { id: "t1", title: "Task 1", assignee: "", priority: "medium", due: "", tags: [] },
      { id: "t2", title: "Task 2", assignee: "", priority: "low", due: "", tags: [] },
    ],
  },
  inprogress: {
    id: "inprogress",
    title: "In Progress",
    wipLimit: 3,
    tasks: [{ id: "t3", title: "Task 3", assignee: "", priority: "high", due: "", tags: [] }],
  },
  done: {
    id: "done",
    title: "Done",
    wipLimit: null,
    tasks: [{ id: "t4", title: "Task 4", assignee: "", priority: "low", due: "", tags: ["done"] }],
  },
};
const DEFAULT_ORDER = ["todo", "inprogress", "done"];

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.columns && parsed?.columnOrder) return parsed;
    }
  } catch {}
  return { columns: DEFAULT_COLUMNS, columnOrder: DEFAULT_ORDER };
}

const MemoBoardSection = React.memo(BoardSection);

export default function ProjectBoard() {
  const [state, setState] = useState(() => loadInitialState());
  const { columns, columnOrder } = state;

  // Centralized updater that also persists
  const updateState = useCallback((producer) => {
    setState((prev) => {
      const next = typeof producer === "function" ? producer(prev) : producer;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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

  // Persist initial load too (so key exists even before edits)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- DnD
  const handleDragEnd = useCallback(
    ({ source, destination, type }) => {
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
        const task = { id: uid(), title: t, assignee: "", priority: "medium", due: "", tags: [] };
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

  // ---- Filtering
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

  // ---- UI
  const [addingCol, setAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Project Board</h2>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search title or tags…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Assignee"
            value={filters.assignee}
            onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Tag"
            value={filters.tag}
            onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
          />
          <button
            onClick={() => setFilters({ q: "", priority: "all", assignee: "", tag: "" })}
            className="text-sm underline"
          >
            Clear
          </button>

          {!addingCol ? (
            <button
              onClick={() => setAddingCol(true)}
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
            >
              <Plus size={16} /> Add column
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                className="border rounded px-2 py-1 text-sm"
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
                className="text-sm px-2 py-1 border rounded"
                onClick={() => {
                  handleAddColumnInline(newColTitle);
                  setNewColTitle("");
                  setAddingCol(false);
                }}
              >
                Add
              </button>
              <button className="text-sm underline" onClick={() => { setAddingCol(false); setNewColTitle(""); }}>
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4">
              {columnOrder.map((colId, index) => {
                const col = columns[colId];
                if (!col) return null;
                const visibleTasks = col.tasks.filter((t) => matchesFilters(t));
                return (
                  <Draggable key={col.id} draggableId={col.id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...(dragProvided.draggableProps.style || {}),
                          willChange: "transform", // GPU hint for column
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
    </div>
  );
}
