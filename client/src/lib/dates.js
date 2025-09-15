export function startOfLocalDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
export function endOfLocalDay(d = new Date())   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
export function toISODate(d)                    { return d.toISOString().slice(0,10); }

export function dateKeyLocal(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function dateKeyToStartTs(k) { return new Date(`${k}T00:00:00`).getTime(); }

export function prettyLocal(dateStr) {
  const d = new Date(dateStr + "T12:00:00"); // avoid TZ edge-cases
  return d.toLocaleDateString();
}
