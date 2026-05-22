"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { BoardCard, BoardColumn, Priority } from "@/types/board";
import { PRIORITY_CONFIG } from "@/types/board";

interface Props {
  columns: BoardColumn[];
  search: string;
  filterPriority: string;
  filterAssignee: string;
  onSelectCard: (card: BoardCard) => void;
}

type SortKey = "title" | "assignee" | "priority" | "dueDate" | "createdAt" | "column";
const PRIORITY_ORDER: Record<Priority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ListView({ columns, search, filterPriority, filterAssignee, onSelectCard }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const colMap = Object.fromEntries(columns.map((c) => [c.id, c.name]));

  const allCards = columns.flatMap((col) =>
    col.cards.map((c) => ({ ...c, columnName: col.name }))
  );

  const filtered = allCards.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !(c.assignee ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !c.labels.some((l) => l.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterAssignee && c.assignee !== filterAssignee) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "assignee") cmp = (a.assignee ?? "").localeCompare(b.assignee ?? "");
    else if (sortKey === "priority") cmp = PRIORITY_ORDER[a.priority as Priority] - PRIORITY_ORDER[b.priority as Priority];
    else if (sortKey === "dueDate") cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    else if (sortKey === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
    else if (sortKey === "column") cmp = (colMap[a.columnId] ?? "").localeCompare(colMap[b.columnId] ?? "");
    return cmp * sortDir;
  });

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 1
      ? <ChevronUp size={12} style={{ color: "#00b4b4" }} />
      : <ChevronDown size={12} style={{ color: "#00b4b4" }} />;
  };

  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0d1526" }}>
            {(["title", "assignee", "priority", "labels", "dueDate", "column", "createdAt"] as const).map((k) => {
              const labels: Record<string, string> = {
                title: "Title", assignee: "Assignee", priority: "Priority",
                labels: "Labels", dueDate: "Due Date", column: "Status", createdAt: "Created",
              };
              const sortable = k !== "labels";
              return (
                <th key={k}
                  onClick={() => sortable && setSort(k as SortKey)}
                  style={{
                    padding: "10px 14px", textAlign: "left", fontWeight: 700,
                    fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em",
                    borderBottom: "1px solid #1e293b", userSelect: "none",
                    cursor: sortable ? "pointer" : "default", whiteSpace: "nowrap",
                  }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {labels[k]}{sortable && <SortIcon k={k as SortKey} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: "#64748b" }}>
                No cards match the current filters.
              </td>
            </tr>
          )}
          {sorted.map((card, i) => {
            const pc = PRIORITY_CONFIG[card.priority as Priority] ?? PRIORITY_CONFIG.LOW;
            const overdue = card.dueDate && new Date(card.dueDate) < new Date();
            return (
              <tr
                key={card.id}
                onClick={() => onSelectCard(card)}
                style={{
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  cursor: "pointer", borderBottom: "1px solid #1a2234",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,180,180,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
              >
                <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{card.title}</td>
                <td style={{ padding: "10px 14px" }}>
                  {card.assignee ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "#00b4b4", color: "#0a0f1e",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800, flexShrink: 0,
                      }}>
                        {initials(card.assignee)}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{card.assignee}</span>
                    </span>
                  ) : <span style={{ color: "#64748b", fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                    background: pc.bg, color: pc.color,
                  }}>{pc.label}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {card.labels.slice(0, 2).map((l) => (
                      <span key={l} style={{
                        padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: "rgba(0,180,180,0.1)", color: "#00b4b4",
                      }}>{l}</span>
                    ))}
                    {card.labels.length > 2 && <span style={{ fontSize: 10, color: "#64748b" }}>+{card.labels.length - 2}</span>}
                  </div>
                </td>
                <td style={{ padding: "10px 14px", color: overdue ? "#ef4444" : "#64748b", fontSize: 12, fontWeight: overdue ? 700 : 400 }}>
                  {fmtDate(card.dueDate)}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: "rgba(100,116,139,0.1)", color: "#94a3b8",
                  }}>{colMap[card.columnId] ?? "—"}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                  {fmtDate(card.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
