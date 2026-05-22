export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface BoardComment {
  id: string;
  cardId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface BoardCard {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status?: string | null;
  assignee?: string | null;
  labels: string[];
  dueDate?: string | null;
  estimatedHours?: number | null;
  attachmentUrls: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  comments?: BoardComment[];
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  order: number;
  cards: BoardCard[];
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  HIGH:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  MEDIUM:   { label: "Medium",   color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  LOW:      { label: "Low",      color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export const ENGINEERS = ["Jose Lucar", "Alex Field", "Mihir Sangani"];
