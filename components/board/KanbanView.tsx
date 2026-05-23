"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Check, X, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { BoardCard, BoardColumn, Priority } from "@/types/board";
import { PRIORITY_CONFIG } from "@/types/board";

interface Props {
  columns: BoardColumn[];
  search: string;
  filterPriority: string;
  filterAssignee: string;
  onSelectCard: (card: BoardCard) => void;
  onDragEnd: (result: DropResult) => void;
  onAddCard: (columnId: string) => void;
  onAddColumn: () => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveColumn: (columnId: string, dir: -1 | 1) => void;
}

function PriorityDot({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority as Priority] ?? PRIORITY_CONFIG.LOW;
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0, display: "inline-block" }} />;
}

function fmtShortDate(iso: string | null | undefined) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
  catch { return iso; }
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function isDue(iso: string | null | undefined) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

function KanbanCard({ card, index, onSelect }: { card: BoardCard; index: number; onSelect: () => void }) {
  const pc = PRIORITY_CONFIG[card.priority as Priority] ?? PRIORITY_CONFIG.LOW;
  const due = card.dueDate ? fmtShortDate(card.dueDate) : null;
  const overdue = isDue(card.dueDate);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onSelect}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? "#273045" : "#1e293b",
            border: "1px solid",
            borderColor: snapshot.isDragging ? "#00b4b4" : "#283548",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 8,
            cursor: "pointer",
            boxShadow: snapshot.isDragging
              ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,180,180,0.3)"
              : "0 1px 4px rgba(0,0,0,0.2)",
            transition: snapshot.isDragging ? "none" : "box-shadow 0.15s, border-color 0.15s",
            userSelect: "none",
          }}
          onMouseEnter={(e) => { if (!snapshot.isDragging) (e.currentTarget as HTMLElement).style.borderColor = "#2d3f55"; }}
          onMouseLeave={(e) => { if (!snapshot.isDragging) (e.currentTarget as HTMLElement).style.borderColor = "#283548"; }}
        >
          {/* Priority + title */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <PriorityDot priority={card.priority as Priority} />
            <p style={{ fontSize: 13, fontWeight: 600, color: card.title ? "#e2e8f0" : "#64748b", margin: 0, lineHeight: 1.4, flex: 1, fontStyle: card.title ? "normal" : "italic" }}>
              {card.title || "(Untitled)"}
            </p>
          </div>

          {/* Labels */}
          {(card.labels ?? []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {(card.labels ?? []).slice(0, 3).map((l) => (
                <span key={l} style={{
                  padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                  background: "rgba(0,180,180,0.1)", color: "#00b4b4",
                }}>
                  {l}
                </span>
              ))}
              {(card.labels ?? []).length > 3 && (
                <span style={{ fontSize: 10, color: "#64748b" }}>+{(card.labels ?? []).length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{
              padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
              background: pc.bg, color: pc.color,
            }}>
              {pc.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {due && (
                <span style={{ fontSize: 10, fontWeight: 600, color: overdue ? "#ef4444" : "#64748b" }}>
                  {due}
                </span>
              )}
              {card.assignee && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#00b4b4", color: "#0a0f1e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 800,
                }}>
                  {initials(card.assignee)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanView({
  columns, search, filterPriority, filterAssignee,
  onSelectCard, onDragEnd, onAddCard, onAddColumn, onRenameColumn, onDeleteColumn, onMoveColumn,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  const filterCards = (cards: BoardCard[]) =>
    cards.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !(c.labels ?? []).some((l) => l.toLowerCase().includes(search.toLowerCase())) &&
          !(c.assignee ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && c.priority !== filterPriority) return false;
      if (filterAssignee && c.assignee !== filterAssignee) return false;
      return true;
    });

  const startRename = (col: BoardColumn) => {
    setRenamingId(col.id);
    setRenameVal(col.name);
    setMenuId(null);
  };

  const commitRename = (colId: string) => {
    if (renameVal.trim()) onRenameColumn(colId, renameVal.trim());
    setRenamingId(null);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
        {columns.map((col, colIdx) => {
          const filtered = filterCards(col.cards ?? []);
          return (
            <div key={col.id} style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}>

              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 10px", marginBottom: 8,
                background: "#0f172a", borderRadius: 8,
                border: "1px solid #1e293b",
              }}>
                {renamingId === col.id ? (
                  <>
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(col.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "inherit",
                      }}
                    />
                    <button onClick={() => commitRename(col.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e", display: "flex" }}><Check size={13} /></button>
                    <button onClick={() => setRenamingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: col.name ? "#e2e8f0" : "#64748b", fontStyle: col.name ? "normal" : "italic" }}>
                      {col.name || "Untitled column"}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                      background: "rgba(100,116,139,0.15)", color: "#64748b",
                    }}>{filtered.length}</span>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setMenuId(menuId === col.id ? null : col.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 2 }}>
                        <MoreHorizontal size={14} />
                      </button>
                      {menuId === col.id && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                          background: "#111827", border: "1px solid #1e293b", borderRadius: 8,
                          minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                        }}
                          onMouseLeave={() => setMenuId(null)}>
                          <button onClick={() => startRename(col)} style={menuItemStyle}><Pencil size={12} />Rename</button>
                          <button onClick={() => { onMoveColumn(col.id, -1); setMenuId(null); }} disabled={colIdx === 0} style={{ ...menuItemStyle, opacity: colIdx === 0 ? 0.4 : 1 }}><ChevronLeft size={12} />Move left</button>
                          <button onClick={() => { onMoveColumn(col.id, 1); setMenuId(null); }} disabled={colIdx === columns.length - 1} style={{ ...menuItemStyle, opacity: colIdx === columns.length - 1 ? 0.4 : 1 }}><ChevronRight size={12} />Move right</button>
                          <div style={{ height: 1, background: "#1e293b", margin: "4px 0" }} />
                          <button onClick={() => { onDeleteColumn(col.id); setMenuId(null); }} style={{ ...menuItemStyle, color: "#ef4444" }}><Trash2 size={12} />Delete column</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Cards droppable */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1, minHeight: 60, borderRadius: 8, padding: 4,
                      background: snapshot.isDraggingOver ? "rgba(0,180,180,0.04)" : "transparent",
                      border: snapshot.isDraggingOver ? "1px dashed rgba(0,180,180,0.3)" : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {filtered.length === 0 && !snapshot.isDraggingOver && (
                      <div style={{
                        textAlign: "center", padding: "24px 12px",
                        border: "1.5px dashed #1e293b", borderRadius: 8,
                        color: "#64748b", fontSize: 12, fontWeight: 500,
                      }}>
                        Drop cards here
                      </div>
                    )}
                    {filtered.map((card, i) => (
                      <KanbanCard key={card.id} card={card} index={i} onSelect={() => onSelectCard(card)} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add card */}
              <button
                onClick={() => onAddCard(col.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 8,
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: "transparent", border: "1px dashed #1e293b",
                  color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#00b4b4";
                  (e.currentTarget as HTMLElement).style.color = "#00b4b4";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1e293b";
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                }}
              >
                <Plus size={13} />Add card
              </button>
            </div>
          );
        })}

        {/* Add column */}
        <button
          onClick={onAddColumn}
          style={{
            width: 240, flexShrink: 0, padding: "12px 16px", borderRadius: 8,
            background: "transparent", border: "1.5px dashed #1e293b",
            color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#00b4b4";
            (e.currentTarget as HTMLElement).style.color = "#00b4b4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#1e293b";
            (e.currentTarget as HTMLElement).style.color = "#64748b";
          }}
        >
          <Plus size={14} />Add column
        </button>
      </div>
    </DragDropContext>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  width: "100%", padding: "8px 12px",
  background: "transparent", border: "none",
  color: "#e2e8f0", fontSize: 12, fontWeight: 500,
  cursor: "pointer", textAlign: "left",
  transition: "background 0.1s",
};
