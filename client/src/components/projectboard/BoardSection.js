// ============================
// File: src/components/projectboard/BoardSection.js
// ============================
import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { GripHorizontal, Pencil, Trash2 } from "lucide-react";

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
          <div className="text-xs bg-blue-500/60 rounded px-2 py-0.5">
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
      <Droppable droppableId={id} type="TASK" isDropDisabled={false}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 min-h-[140px] space-y-2 rounded-b-2xl ${
              snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={filtersActive}
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    // perf hint: helps the browser prep a GPU layer for smoother dragging
                    style={{
                      ...(dragProvided.draggableProps.style || {}),
                      willChange: "transform",
                    }}
                  >
                    <TaskCard
                      task={task}
                      onDelete={() => onDeleteTask(task.id)}
                      onUpdate={(patch) => onUpdateTask(task.id, patch)}
                      isDragging={dragSnapshot.isDragging}
                      isDoneColumn={id === "done"}
                      isInProgressColumn={id === "inprogress"}
                      isTodoColumn={id === "todo"}
                      onMoveToInProgress={() => onMoveTask?.(task.id, "inprogress")}
                      // pass the dedicated handle to the small grip inside the card
                      dragHandleProps={dragProvided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Inline Add */}
            <div className="pt-2">
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Add a task and press Enter…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddInline();
                  if (e.key === "Escape") setDraft("");
                }}
                aria-label="Add task"
              />
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
