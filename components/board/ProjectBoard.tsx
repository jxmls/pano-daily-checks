"use client";

import { useState, useEffect, useCallback } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { Search, Plus, LayoutGrid, List, Calendar, ChevronDown, X } from "lucide-react";
import type { BoardCard, BoardColumn, BoardComment, Priority } from "@/types/board";
import { PRIORITY_CONFIG, ENGINEERS } from "@/types/board";
import KanbanView from "./KanbanView";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import CardDetailPanel from "./CardDetailPanel";
import NewCardModal from "./NewCardModal";

type View = "kanban" | "list" | "calendar";

interface Props { engineer: string; }

export default function ProjectBoard({ engineer }: Props) {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("kanban");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardColumnId, setNewCardColumnId] = useState<string | undefined>();

  const fetchColumns = useCallback(async () => {
    try {
      const data = await fetch("/api/board/columns").then((r) => r.json());
      if (Array.isArray(data)) setColumns(data);
      else setError("Failed to load board.");
    } catch {
      setError("Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchColumns(); }, [fetchColumns]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowNewCard(true); }
      if (e.key === "Escape") { setSelectedCard(null); setShowNewCard(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Drag and drop ──────────────────────────────────────────────
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;

    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const srcCol = next.find((c) => c.id === srcColId)!;
      const dstCol = next.find((c) => c.id === dstColId)!;
      const [moved] = srcCol.cards.splice(source.index, 1);
      moved.columnId = dstColId;
      dstCol.cards.splice(destination.index, 0, moved);
      return next;
    });

    // If selected card was moved, update it
    setSelectedCard((prev) => {
      if (!prev) return prev;
      const updated = columns.flatMap((c) => c.cards).find((c) => c.id === prev.id);
      return updated ? { ...updated, columnId: dstColId } : prev;
    });

    const updatedCols = columns.map((c) => ({ ...c, cards: [...c.cards] }));
    const srcCol = updatedCols.find((c) => c.id === srcColId)!;
    const dstCol = updatedCols.find((c) => c.id === dstColId)!;
    const [moved] = srcCol.cards.splice(source.index, 1);
    moved.columnId = dstColId;
    dstCol.cards.splice(destination.index, 0, moved);

    const items = dstCol.cards.map((c, i) => ({ id: c.id, columnId: dstColId, order: i }));
    if (srcColId !== dstColId) {
      srcCol.cards.forEach((c, i) => items.push({ id: c.id, columnId: srcColId, order: i }));
    }
    await fetch("/api/board/cards/reorder", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  };

  // ── Column operations ──────────────────────────────────────────
  const handleAddColumn = async () => {
    const res = await fetch("/api/board/columns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Column" }),
    });
    const col = await res.json();
    setColumns((prev) => [...prev, col]);
  };

  const handleRenameColumn = async (id: string, name: string) => {
    setColumns((prev) => prev.map((c) => c.id === id ? { ...c, name } : c));
    await fetch(`/api/board/columns/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  };

  const handleDeleteColumn = async (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.columnId === id) setSelectedCard(null);
    await fetch(`/api/board/columns/${id}`, { method: "DELETE" });
  };

  const handleMoveColumn = async (id: string, dir: -1 | 1) => {
    setColumns((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.id === id);
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      const items = next.map((c, i) => ({ id: c.id, order: i }));
      fetch("/api/board/columns/reorder", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      return next;
    });
  };

  // ── Card operations ────────────────────────────────────────────
  const handleAddCard = (columnId: string) => {
    setNewCardColumnId(columnId);
    setShowNewCard(true);
  };

  const handleCardCreated = (card: BoardCard) => {
    setColumns((prev) =>
      prev.map((c) => c.id === card.columnId ? { ...c, cards: [...c.cards, card] } : c)
    );
  };

  const handleCardUpdate = (cardId: string, patch: Partial<BoardCard>) => {
    setColumns((prev) =>
      prev.map((col) => {
        const hasCard = col.cards.some((c) => c.id === cardId);
        const newColumnId = (patch as BoardCard).columnId;

        if (newColumnId && newColumnId !== col.id) {
          // Card moved to another column
          if (hasCard) return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
          if (col.id === newColumnId) {
            const updated = { ...col.cards.find((c) => c.id === cardId)!, ...patch };
            return { ...col, cards: [...col.cards, updated] };
          }
        }
        return {
          ...col,
          cards: col.cards.map((c) => c.id === cardId ? { ...c, ...patch } : c),
        };
      })
    );
    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...patch } : prev));
  };

  const handleCardDelete = (cardId: string) => {
    setColumns((prev) =>
      prev.map((c) => ({ ...c, cards: c.cards.filter((card) => card.id !== cardId) }))
    );
    setSelectedCard(null);
  };

  const handleComment = (cardId: string, comment: BoardComment) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, comments: [...(c.comments ?? []), comment] } : c
        ),
      }))
    );
    setSelectedCard((prev) =>
      prev?.id === cardId ? { ...prev, comments: [...(prev.comments ?? []), comment] } : prev
    );
  };

  const hasFilters = search || filterPriority || filterAssignee;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Board top bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        flexWrap: "wrap",
      }}>
        {/* View tabs */}
        <div style={{
          display: "flex", gap: 2, background: "#0f172a",
          border: "1px solid #1e293b", borderRadius: 8, padding: 3,
        }}>
          {([["kanban", <LayoutGrid key="kg" size={14} />, "Board"], ["list", <List key="lg" size={14} />, "List"], ["calendar", <Calendar key="cg" size={14} />, "Calendar"]] as const).map(
            ([v, icon, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 6, border: "none",
                  background: view === v ? "#1e293b" : "transparent",
                  color: view === v ? "#e2e8f0" : "#64748b",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                {icon}{label}
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 280 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder="Search cards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Priority filter */}
        <div style={{ position: "relative" }}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input"
            style={{ fontSize: 12, paddingRight: 28, appearance: "none", minWidth: 110 }}>
            <option value="">All priorities</option>
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
        </div>

        {/* Assignee filter */}
        <div style={{ position: "relative" }}>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="input"
            style={{ fontSize: 12, paddingRight: 28, appearance: "none", minWidth: 120 }}>
            <option value="">All assignees</option>
            {ENGINEERS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterPriority(""); setFilterAssignee(""); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            <X size={12} />Clear
          </button>
        )}

        {/* New card button */}
        <button
          onClick={() => { setNewCardColumnId(undefined); setShowNewCard(true); }}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px", marginLeft: "auto" }}>
          <Plus size={14} />New card
          <span style={{ opacity: 0.6, fontSize: 10 }}>N</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 16,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#ef4444", fontSize: 13, fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Board content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b", fontSize: 14 }}>Loading board…</div>
      ) : (
        <div style={{ flex: 1, overflow: view === "kanban" ? "visible" : "auto" }}>
          {view === "kanban" && (
            <KanbanView
              columns={columns}
              search={search}
              filterPriority={filterPriority}
              filterAssignee={filterAssignee}
              onSelectCard={setSelectedCard}
              onDragEnd={handleDragEnd}
              onAddCard={handleAddCard}
              onAddColumn={handleAddColumn}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onMoveColumn={handleMoveColumn}
            />
          )}
          {view === "list" && (
            <ListView
              columns={columns}
              search={search}
              filterPriority={filterPriority}
              filterAssignee={filterAssignee}
              onSelectCard={setSelectedCard}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              columns={columns}
              search={search}
              filterPriority={filterPriority}
              filterAssignee={filterAssignee}
              onSelectCard={setSelectedCard}
            />
          )}
        </div>
      )}

      {/* Card detail panel */}
      {selectedCard && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(0,0,0,0.3)" }}
            onClick={() => setSelectedCard(null)}
          />
          <CardDetailPanel
            card={selectedCard}
            columns={columns}
            engineer={engineer}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleCardUpdate}
            onDelete={handleCardDelete}
            onComment={handleComment}
          />
        </>
      )}

      {/* New card modal */}
      {showNewCard && (
        <NewCardModal
          columns={columns}
          defaultColumnId={newCardColumnId}
          engineer={engineer}
          onClose={() => setShowNewCard(false)}
          onCreate={handleCardCreated}
        />
      )}
    </div>
  );
}
