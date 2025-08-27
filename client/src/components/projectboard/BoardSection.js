// ============================
// File: src/components/projectboard/BoardSection.js
// ============================
import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { GripHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import ReactDOM from "react-dom";

const DragPortal = ({ children }) => ReactDOM.createPortal(children, document.body);
const DropIndicator = () => (
  <div className="h-2 my-1 rounded border-2 border-dashed border-blue-400 bg-blue-200/40" />
);

export default function BoardSection({
  id,
  title,
  wipLimit,
  totalCount,
  tasks,
  filtersActive,
  onAddTask,       // (title: string)
  onDeleteTask,    // (taskId: string)
  onUpdateTask,    // (taskId: string, patch: Partial<Task>)
  onRenameColumn,  // (newTitle: string)
  onDeleteColumn,  // ()
  onSetWip,        // (limit: string | number)
  onMoveTask,      // (taskId: string, destId: string)
  dragHandleProps, // from column Draggable
  tagHues,         // { tag: hue }
  dropDisabled = false,
  overLimit = false, // just for pulsing style
  hoverIndex = -1,   // precise insert index from parent
}) {
  const [draft, setDraft] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(title);
  const [wipEditing, setWipEditing] = useState(false);
  const [wipVal, setWipVal] = useState(wipLimit ?? "");

  const commitTitle = () => {
    const next = (titleVal || "").trim();
    if (!next) {
      setTitleVal(title);
      setEditingTitle(false);
      return;
    }
    if (next !== title) onRenameColumn(next);
    setEditingTitle(false);
  };

  const commitWip = () => {
    onSetWip(wipVal);
    setWipEditing(false);
  };

  const handleAddInline = () => {
    const t = draft.trim();
    if (!t) return;
    onAddTask(t);
    setDraft("");
  };

  return (
    <div className="bg-white rounded-2xl shadow w-80 flex-shrink-0">
      {/* Header: entire header is the column drag handle */}
      <div
        className="flex items-center justify-between bg-blue-600 text-white px-3 py-2 rounded-t-2xl cursor-grab"
        {...dragHandleProps}
        title="Drag column"
        aria-label="Drag column"
      >
        <div className="flex items-center gap-2">
          <span className="opacity-90">
            <GripHorizontal size={16} />
          </span>

          {!editingTitle ? (
            <h3
              className="text-sm font-semibold"
              onDoubleClick={() => setEditingTitle(true)}
              title="Double-click to rename"
            >
              {title}
            </h3>
          ) : (
            <input
              className="text-sm text-black rounded px-2 py-1"
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                else if (e.key === "Escape") {
                  setTitleVal(title);
                  setEditingTitle(false);
                }
              }}
              onBlur={commitTitle}
              autoFocus
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`text-xs rounded px-2 py-0.5 ${
              overLimit ? "bg-red-500/70 animate-pulse ring-2 ring-red-300" : "bg-blue-500/60"
            }`}
            title="Work-in-progress"
          >
            WIP {totalCount}{wipLimit ? `/${wipLimit}` : ""}
          </div>

          {!wipEditing ? (
            <button
              className="p-1 rounded hover:bg-blue-700/50"
              title="Set WIP limit"
              onClick={() => setWipEditing(true)}
            >
              WIP
            </button>
          ) : (
            <input
              type="number"
              min="0"
              step="1"
              className="w-16 text-xs text-black rounded px-1 py-0.5"
              placeholder="none"
              value={wipVal}
              onChange={(e) => setWipVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitWip();
                else if (e.key === "Escape") {
                  setWipEditing(false);
                  setWipVal(wipLimit ?? "");
                }
              }}
              onBlur={commitWip}
            />
          )}

          <button
            className="p-1 rounded hover:bg-blue-700/50"
            title="Rename column"
            onClick={() => {
              setTitleVal(title);
              setEditingTitle(true);
            }}
          >
            <Pencil size={16} />
          </button>

          <button
            className="p-1 rounded hover:bg-blue-700/50"
            title="Delete column"
            onClick={onDeleteColumn}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <Droppable droppableId={id} type="TASK" isDropDisabled={dropDisabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 min-h-[140px] space-y-2 rounded-b-2xl ${
              snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"
            } overflow-visible`}
          >
            {/* indicator at very top */}
            {hoverIndex === 0 && <DropIndicator />}

            {tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                {/* indicator before this item */}
                {hoverIndex === index && <DropIndicator />}

                <Draggable draggableId={task.id} index={index}>
                  {(dragProvided, dragSnapshot) => {
                    const card = (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={dragSnapshot.isDragging ? "ring-2 ring-blue-400 rounded-xl" : ""}
                        style={{
                          ...(dragProvided.draggableProps.style || {}),
                          zIndex: dragSnapshot.isDragging ? 2000 : undefined,
                          position: dragSnapshot.isDragging ? "relative" : undefined,
                          opacity: dragSnapshot.isDragging ? 0.92 : 1,
                          boxShadow: dragSnapshot.isDragging
                            ? "0 10px 30px rgba(0,0,0,0.20), 0 6px 12px rgba(0,0,0,0.15)"
                            : undefined,
                          cursor: dragSnapshot.isDragging ? "grabbing" : "grab",
                        }}
                      >
                        <TaskCard
                          task={task}
                          columnId={id}
                          onDelete={() => onDeleteTask(task.id)}
                          onUpdate={(patch) => onUpdateTask(task.id, patch)}
                          // for the modal quick action:
                          isDoneColumn={id === "done"}
                          isInProgressColumn={id === "inprogress"}
                          isTodoColumn={id === "todo"}
                          onMoveToInProgress={() => onMoveTask(task.id, "inprogress")}
                          tagHues={tagHues}
                          filtersActive={filtersActive}
                        />
                      </div>
                    );
                    return dragSnapshot.isDragging ? <DragPortal>{card}</DragPortal> : card;
                  }}
                </Draggable>
              </React.Fragment>
            ))}

            {/* indicator at very bottom */}
            {hoverIndex === tasks.length && <DropIndicator />}

            {provided.placeholder}

            {/* Inline Add */}
            <div className="pt-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Plus size={14} />
                </span>
                <input
                  className="w-full h-9 pl-7 pr-12 bg-white/90 border border-slate-200 rounded-xl text-sm placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 shadow-sm"
                  placeholder="Add a task…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddInline();
                    if (e.key === "Escape") setDraft("");
                  }}
                  aria-label="Add task"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 border border-gray-300 rounded px-1 py-0.5 bg-white/70">
                  Enter
                </kbd>
              </div>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
