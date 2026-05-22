"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BoardCard, BoardColumn, Priority } from "@/types/board";
import { PRIORITY_CONFIG } from "@/types/board";

interface Props {
  columns: BoardColumn[];
  search: string;
  filterPriority: string;
  filterAssignee: string;
  onSelectCard: (card: BoardCard) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

export default function CalendarView({ columns, search, filterPriority, filterAssignee, onSelectCard }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const allCards = columns.flatMap((col) => col.cards);

  const filtered = allCards.filter((c) => {
    if (!c.dueDate) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !(c.assignee ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterAssignee && c.assignee !== filterAssignee) return false;
    return true;
  });

  const cardsByDay: Record<number, BoardCard[]> = {};
  for (const card of filtered) {
    if (!card.dueDate) continue;
    const d = new Date(card.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!cardsByDay[day]) cardsByDay[day] = [];
      cardsByDay[day].push(card);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const monthLabel = new Date(year, month).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} className="btn-secondary" style={{ padding: "6px 10px" }}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{monthLabel}</h2>
        <button onClick={nextMonth} className="btn-secondary" style={{ padding: "6px 10px" }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{
            textAlign: "center", padding: "6px 0",
            fontSize: 11, fontWeight: 700, color: "#64748b",
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - startOffset + 1;
          const isCurrentMonth = day >= 1 && day <= daysInMonth;
          const isToday = day === todayDay;
          const dayCards = isCurrentMonth ? (cardsByDay[day] ?? []) : [];

          return (
            <div
              key={i}
              style={{
                minHeight: 90, padding: "6px 6px 4px",
                background: isCurrentMonth ? "#111827" : "#0d1220",
                border: "1px solid",
                borderColor: isToday ? "rgba(0,180,180,0.4)" : "#1e293b",
                borderRadius: 6,
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: isToday ? 800 : 500,
                color: isToday ? "#00b4b4" : "#64748b",
                marginBottom: 4,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                {isCurrentMonth ? day : ""}
                {isToday && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                    background: "rgba(0,180,180,0.15)", color: "#00b4b4",
                  }}>
                    Today
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayCards.slice(0, 3).map((card) => {
                  const pc = PRIORITY_CONFIG[card.priority as Priority] ?? PRIORITY_CONFIG.LOW;
                  return (
                    <button
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "3px 5px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: pc.bg, color: pc.color, border: "none", cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "opacity 0.1s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      title={card.title}
                    >
                      {card.title}
                    </button>
                  );
                })}
                {dayCards.length > 3 && (
                  <span style={{ fontSize: 9, color: "#64748b", paddingLeft: 4 }}>
                    +{dayCards.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
