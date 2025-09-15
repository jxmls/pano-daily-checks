// src/components/KnownIssuesCatalog.js
import React, { useMemo, useState, useEffect, useRef } from "react";
import panopticsPdfLogo from "../assets/panopticspdflogo.png";

/* ---------- storage ---------- */
const KI_KEY = "pano.knownIssues.v1";
const loadKI = () => {
  try {
    const raw = localStorage.getItem(KI_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveKI = (items) => localStorage.setItem(KI_KEY, JSON.stringify(items || []));
const newKI = (overrides = {}) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
  title: "",
  systems: [],
  summary: "",
  workaroundUrl: "",
  owner: "Infra",
  acceptedUntil: "", // review date
  lastReviewed: new Date().toISOString(),
  lastReviewedBy: "", // NEW
  reviewHistory: [],  // NEW [{ at: ISO, by: "AB" }]
  status: "active",
  risk: "low",
  ...overrides,
});

/* ---------- utils ---------- */
const getEngineerName = () => localStorage.getItem("engineerName") || "Engineer";
const getInitials = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || "E").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "E";
};

const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
const toCsv = (rows) => {
  const headers = ["title", "systems", "summary", "owner", "reviewDate", "lastReviewed", "status", "risk"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const vals = [
      r.title,
      (r.systems || []).join(" | "),
      r.summary || "",
      r.owner || "",
      r.acceptedUntil || "",
      r.lastReviewed || "",
      r.status || "",
      r.risk || "",
    ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
    lines.push(vals.join(","));
  }
  return lines.join("\n");
};
const daysFromNow = (dStr) => {
  if (!dStr) return Infinity;
  const d = new Date(dStr).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.floor((d - now) / (24 * 3600 * 1000));
};

/* ---------- outside click hook ---------- */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

/* ---------- Actions menu ---------- */
function RowActions({ onEdit, onCopyLink, onMarkReviewed, onToggleStatus, onDelete, item }) {
  const [open, setOpen] = useState(false);
  const pop = useRef(null);
  useOutsideClose(pop, () => setOpen(false));

  return (
    <div className="relative" ref={pop}>
      <button
        className="px-2 py-1 border rounded hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
        title="Actions"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border rounded shadow z-20">
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { onEdit(item); setOpen(false); }}>Edit</button>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { onMarkReviewed(item.id); setOpen(false); }}>Mark reviewed</button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-50"
            onClick={() => {
              onToggleStatus(item.id, item.status === "active" ? "retired" : "active");
              setOpen(false);
            }}
          >
            {item.status === "active" ? "Retire" : "Activate"}
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { onCopyLink(item.id); setOpen(false); }}>Copy link</button>
          <button
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (window.confirm("Delete this known issue?")) onDelete(item.id);
              setOpen(false);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Review date filter popover ---------- */
function ReviewFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));

  const label =
    {
      all: "Review filter: All",
      overdue: "Review filter: Overdue",
      next7: "Review filter: Next 7 days",
      next30: "Review filter: Next 30 days",
      nodate: "Review filter: No date",
    }[value] || "Review filter";

  return (
    <div className="relative" ref={ref}>
      <button className="px-3 py-2 border rounded-lg hover:bg-gray-50" onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-56 bg-white border rounded shadow z-20">
          {[
            ["all", "All"],
            ["overdue", "Overdue"],
            ["next7", "Next 7 days"],
            ["next30", "Next 30 days"],
            ["nodate", "No date"],
          ].map(([v, text]) => (
            <button
              key={v}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${value === v ? "bg-gray-50" : ""}`}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- EDIT MODAL (scrollable + instant Mark reviewed) ---------- */
function EditModal({ item, onClose, onSave, onMarkReviewed, onDelete }) {
  const [draft, setDraft] = useState(item);
  const modalRef = useRef(null);

  useOutsideClose(modalRef, onClose);
  useEffect(() => setDraft(item), [item?.id]);

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const markReviewedNow = () => {
    const at = new Date().toISOString();
    const by = getInitials(getEngineerName());

    // Optimistic update
    setDraft((prev) => ({
      ...prev,
      lastReviewed: at,
      lastReviewedBy: by,
      reviewHistory: [{ at, by }, ...(prev.reviewHistory || [])].slice(0, 50),
    }));

    // Persist via parent
    onMarkReviewed?.(item.id, { at, by });
  };

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Scrollable overlay */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-4">
          {/* Card */}
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Sticky header */}
            <div className="px-5 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold">Edit Known Issue</h3>
              <button className="px-2 py-1 border rounded hover:bg-gray-50" onClick={onClose}>
                Close
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-5 space-y-4 overflow-auto">
              {/* Title */}
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>

              {/* Systems */}
              <div>
                <label className="text-sm font-medium">Systems (comma separated)</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={(draft.systems || []).join(", ")}
                  onChange={(e) =>
                    set({
                      systems: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {(draft.systems || []).map((t) => (
                    <span key={t} className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 border">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  className="mt-1 w-full border rounded px-3 py-2 resize-y min-h-[120px] max-h-64"
                  placeholder="Enter summary (up to 200 characters)"
                  value={draft.summary || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 200) set({ summary: val });
                  }}
                />
                <div className="text-[11px] text-gray-500 text-right">{(draft.summary || "").length}/200 characters</div>
              </div>

              {/* Owner / Review date / Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Owner</label>
                  <input
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={draft.owner || ""}
                    onChange={(e) => set({ owner: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Review date</label>
                  <input
                    type="date"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={draft.acceptedUntil || ""}
                    onChange={(e) => set({ acceptedUntil: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={draft.status}
                    onChange={(e) => set({ status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              {/* Workaround URL */}
              <div>
                <label className="text-sm font-medium">KB / Workaround URL (optional)</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={draft.workaroundUrl || ""}
                  onChange={(e) => set({ workaroundUrl: e.target.value })}
                />
              </div>

              {/* Last reviewed + history */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  Last reviewed: <span className="font-medium">{fmtDateTime(draft?.lastReviewed)}</span>
                  {draft?.lastReviewedBy ? (
                    <> by <span className="font-medium">{draft.lastReviewedBy}</span></>
                  ) : null}
                </div>
                {draft?.reviewHistory?.length > 0 && (
                  <div className="mt-1">
                    <div className="font-medium text-gray-700 mb-0.5">Review history:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {draft.reviewHistory.map((h, idx) => (
                        <li key={idx}>
                          {fmtDateTime(h.at)} by <span className="font-medium">{h.by}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="px-5 py-3 border-t flex items-center gap-2 justify-between sticky bottom-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={markReviewedNow}>
                  Mark reviewed
                </button>
                <button
                  className="px-3 py-2 border rounded text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm("Delete this known issue?")) onDelete(item.id);
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="px-3 py-2 border rounded bg-gray-900 text-white hover:opacity-90"
                  onClick={() => onSave(draft)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
          {/* /Card */}
        </div>
      </div>
    </div>
  );
}

/* ---------- export helpers ---------- */
async function toDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
function buildPdfHTML({ logoDataUrl, rows, generatedAt, stats }) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const tableRows = rows
    .map(
      (r) => `
    <tr>
      <td>${esc(r.title)}</td>
      <td>${esc((r.systems || []).join(" | "))}</td>
      <td>${esc(r.summary || "")}</td>
      <td>${esc(r.owner || "")}</td>
      <td>${esc(r.acceptedUntil || "")}</td>
      <td>${esc(r.lastReviewed || "")}</td>
      <td>${esc(r.status || "")}</td>
      <td>${esc(r.risk || "")}</td>
    </tr>
  `
    )
    .join("");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<title>Known Issues Report</title>
<style>
body{font-family:system-ui,sans-serif;color:#111}
.wrap{max-width:1000px;margin:24px auto;padding:0 16px}
.header{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:12px}
.brand img{height:50px}
.meta{font-size:12px;color:#666}
.stats{margin-top:4px;font-size:12px;color:#444}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #e5e7eb;padding:8px 10px;font-size:13px;vertical-align:top}
th{background:#f8fafc;text-align:left}
tr:nth-child(even) td{background:#fafafa}
@media print{.no-print{display:none}}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="brand">
      <img src="${logoDataUrl}" alt="Panoptics"/>
      <div>
        <h1 style="margin:0;font-size:20px;">Known Issues Report</h1>
        <div class="meta">Generated: ${generatedAt}</div>
        <div class="stats">Active: ${stats.active} • Due: ${stats.due} • Retired: ${stats.retired}</div>
      </div>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;">Print / Save PDF</button>
  </div>

  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Systems</th>
        <th>Summary</th>
        <th>Owner</th>
        <th>Review date</th>
        <th>Last reviewed</th>
        <th>Status</th>
        <th>Risk</th>
      </tr>
    </thead>
    <tbody>${tableRows || `<tr><td colspan="8" style="text-align:center;color:#666;">No rows</td></tr>`}</tbody>
  </table>
</div>
</body></html>`;
}

/* ---------- MAIN ---------- */
export default function KnownIssuesCatalog({ onBackToDashboard }) {
  const [items, setItems] = useState(() => {
    const seeded = loadKI();
    if (seeded.length) return seeded;
    const demo = [
      newKI({
        title: "vSphere client slow on VPN",
        systems: ["VMware", "VPN"],
        summary: "Pages load slowly when on VPN; no data loss.",
        acceptedUntil: "2025-12-31",
      }),
      newKI({
        title: "Exchange ECP first load delay",
        systems: ["Exchange"],
        summary: "First login after IIS recycle takes ~20s; subsequent loads OK.",
        acceptedUntil: "2025-10-01",
      }),
    ];
    saveKI(demo);
    return demo;
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("reviewAsc");
  const [reviewFilter, setReviewFilter] = useState("all"); // all|overdue|next7|next30|nodate
  const [justCopied, setJustCopied] = useState(null);
  const [editing, setEditing] = useState(null);

  // migrate existing items to ensure new fields exist
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        const hasHistory = Array.isArray(it.reviewHistory);
        const hasBy = typeof it.lastReviewedBy === "string";
        if (hasHistory && hasBy) return it;
        changed = true;
        return { ...it, reviewHistory: hasHistory ? it.reviewHistory : [], lastReviewedBy: hasBy ? it.lastReviewedBy : "" };
      });
      if (changed) {
        saveKI(next);
        return next; // return the updated array so UI reflects migration immediately
      }
      return prev;
    });
  }, []);

  // deep-link highlight on mount
  const targetIdRef = useRef(null);
  useEffect(() => {
    const hash = window.location.hash;
    if (hash?.startsWith("#ki-")) targetIdRef.current = hash.replace("#", "");
  }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    items.forEach((i) => (i.systems || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const stats = useMemo(() => {
    const now = new Date();
    const active = items.filter((i) => i.status === "active");
    const retired = items.filter((i) => i.status === "retired");
    const due = active.filter((i) => i.acceptedUntil && new Date(i.acceptedUntil) < now);
    return { active: active.length, retired: retired.length, due: due.length };
  }, [items]);

  const filtered = useMemo(() => {
    const now = Date.now();
    let arr = [...items];

    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.title.toLowerCase().includes(t) ||
          (i.summary || "").toLowerCase().includes(t) ||
          (i.owner || "").toLowerCase().includes(t) ||
          (i.systems || []).some((s) => s.toLowerCase().includes(t))
      );
    }
    if (status !== "all") arr = arr.filter((i) => i.status === status);
    if (tag !== "all") arr = arr.filter((i) => (i.systems || []).includes(tag));

    if (reviewFilter !== "all") {
      arr = arr.filter((i) => {
        const df = daysFromNow(i.acceptedUntil);
        if (reviewFilter === "overdue") return Number.isFinite(df) && df < 0;
        if (reviewFilter === "next7") return Number.isFinite(df) && df >= 0 && df <= 7;
        if (reviewFilter === "next30") return Number.isFinite(df) && df >= 0 && df <= 30;
        if (reviewFilter === "nodate") return !i.acceptedUntil;
        return true;
      });
    }

    const byReview = (a, b, dir = 1) => {
      const da = a.acceptedUntil ? new Date(a.acceptedUntil).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.acceptedUntil ? new Date(b.acceptedUntil).getTime() : Number.MAX_SAFE_INTEGER;
      return (da - db) * dir;
    };
    const byReviewedDesc = (a, b) => new Date(b.lastReviewed || 0) - new Date(a.lastReviewed || 0);
    if (sort === "reviewAsc") arr.sort((a, b) => byReview(a, b, 1));
    if (sort === "reviewDesc") arr.sort((a, b) => byReview(a, b, -1));
    if (sort === "reviewedDesc") arr.sort(byReviewedDesc);

    return arr.map((i) => ({
      ...i,
      _due: i.acceptedUntil ? new Date(i.acceptedUntil).getTime() < now : false,
    }));
  }, [items, q, status, tag, sort, reviewFilter]);

  // state ops
  const update = (id, patch) => {
    const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(next);
    saveKI(next);
  };
  const addAndEdit = () => {
    const ni = newKI({ title: "New known issue" });
    const next = [ni, ...items];
    setItems(next);
    saveKI(next);
    setEditing(ni);
  };

  // Persist review (works with or without { at, by } coming from the modal)
  const markReviewed = (id, extra) => {
    const at = extra?.at || new Date().toISOString();
    const by =
      extra?.by ||
      (() => {
        const eng = getEngineerName();
        const parts = eng.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return eng.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "E";
      })();

    setItems((prev) => {
      const next = prev.map((it) =>
        it.id !== id
          ? it
          : {
              ...it,
              lastReviewed: at,
              lastReviewedBy: by,
              reviewHistory: [{ at, by }, ...(Array.isArray(it.reviewHistory) ? it.reviewHistory : [])].slice(0, 50),
            }
      );
      saveKI(next);
      return next;
    });
  };

  const toggleStatus = (id, newStatus) => update(id, { status: newStatus });
  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveKI(next);
    if (editing?.id === id) setEditing(null);
  };

  const copyLink = async (id) => {
    const hash = `#ki-${id}`;
    try {
      await navigator.clipboard.writeText(hash);
      setJustCopied(id);
      window.location.hash = hash;
      setTimeout(() => setJustCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  // PDF (with logo)
  const exportPdfBranded = async () => {
    const logoDataUrl = await toDataUrl(panopticsPdfLogo);
    const html = buildPdfHTML({
      logoDataUrl,
      rows: filtered,
      generatedAt: new Date().toLocaleString(),
      stats,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  // CSV (simple, Excel-friendly)
  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "known-issues.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // deep-link highlight after render
  useEffect(() => {
    if (!targetIdRef.current) return;
    const el = document.getElementById(targetIdRef.current);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring", "ring-yellow-300");
      setTimeout(() => el.classList.remove("ring", "ring-yellow-300"), 1600);
      targetIdRef.current = null;
    }
  }, [filtered]);

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar card */}
      <div className="w-full bg-white border rounded-2xl shadow-sm p-4 mb-4">
        {/* header: Back + title (left) | stats + actions (right) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg hover:bg-gray-50 border"
              title="Back to dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">Known Issues</h1>
              <p className="text-xs text-gray-500">Catalog of accepted/low-risk issues with review dates and workarounds.</p>
            </div>
          </div>

          {/* Right: stats + actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <span className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Active {stats.active}
              </span>
              <span className="px-2.5 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-100">
                Due {stats.due}
              </span>
              <span className="px-2.5 py-1 text-xs rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                Retired {stats.retired}
              </span>
            </div>

            <button
              onClick={addAndEdit}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-gray-900 text-white hover:opacity-90"
              title="Add known issue"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add</span>
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg border hover:bg-gray-50"
              title="Export CSV"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z" />
                <path d="M8 12h8M8 8h8M8 16h5" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportPdfBranded}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg border hover:bg-gray-50"
              title="Export to PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2h7l5 5v13H6z" />
                <path d="M13 2v5h5" />
                <path d="M8 17h8" />
              </svg>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* filters row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, summary, tag, owner…"
              className="pl-9 pr-3 py-2 border rounded-lg md:w-80"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </select>

          <select value={tag} onChange={(e) => setTag(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="reviewAsc">Review date ↑</option>
            <option value="reviewDesc">Review date ↓</option>
            <option value="reviewedDesc">Last reviewed ↓</option>
          </select>

          <ReviewFilter value={reviewFilter} onChange={setReviewFilter} />
        </div>
      </div>

      {/* Compact table */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-3 w-2/5">Title</th>
                <th className="p-3 w-1/5">Systems</th>
                <th className="p-3 w-1/5">Review date</th>
                <th className="p-3 w-1/6">Status</th>
                <th className="p-3 w-14 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-gray-50/50">
              {filtered.map((i) => (
                <tr
                  id={`ki-${i.id}`}
                  key={i.id}
                  className={`border-t ${i._due ? "border-l-4 border-l-red-400" : "border-l-4 border-l-transparent"}`}
                  title={i._due ? "Review overdue" : ""}
                >
                  {/* Title (click to edit) */}
                  <td className="p-3">
                    <button className="text-left w-full hover:underline" onClick={() => setEditing(i)}>
                      <div className="font-medium">{i.title || "Untitled issue"}</div>
                      {i.summary && <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{i.summary}</div>}
                    </button>
                    {i.workaroundUrl && (
                      <a
                        className="text-xs text-blue-600 underline mt-1 inline-block"
                        href={i.workaroundUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        KB / Workaround
                      </a>
                    )}
                  </td>

                  {/* Systems */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(i.systems || []).slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border">
                          {t}
                        </span>
                      ))}
                      {(i.systems || []).length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-50 border">
                          +{(i.systems || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Review date (inline editable) */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className={`w-full max-w-[160px] border rounded px-2 py-1 ${i._due ? "border-red-400" : ""}`}
                        value={i.acceptedUntil || ""}
                        onChange={(e) => update(i.id, { acceptedUntil: e.target.value })}
                        title={i._due ? "Overdue" : ""}
                      />
                      {i._due && (
                        <span className="text-red-600 text-xs" title="Overdue">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status (read-only pill; edit via modal/actions) */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        i.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                      title="Status (edit via row actions or Edit modal)"
                    >
                      {i.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <RowActions
                      item={i}
                      onEdit={(it) => setEditing(it)}
                      onCopyLink={(id) => {
                        copyLink(id);
                        setTimeout(() => setJustCopied(null), 1200);
                      }}
                      onMarkReviewed={markReviewed}
                      onToggleStatus={(id, ns) => {
                        toggleStatus(id, ns);
                      }}
                      onDelete={(id) => {
                        remove(id);
                      }}
                    />
                    <div className="text-[10px] text-gray-400 mt-1">{justCopied === i.id ? "Link copied" : "\u00A0"}</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No known issues match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            update(draft.id, draft);
            setEditing(null);
          }}
          onMarkReviewed={markReviewed}
          onDelete={(id) => {
            remove(id);
          }}
        />
      )}
    </div>
  );
}
