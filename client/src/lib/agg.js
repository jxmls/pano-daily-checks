import { dateKeyLocal } from "./dates";
import { REQUIRED_MODULES } from "./storage";

export function submissionHasAlerts(s) {
  if (!s) return false;
  if (s.passed === false) return true;
  const p = s.payload || {};
  const yes = (v) => String(v || "").toLowerCase() === "yes";
  const anyYes = yes(p.alertsGenerated) || yes(p.localAlertsGenerated);
  const anyRows =
    (Array.isArray(p.alerts) ? p.alerts.length : 0) +
    (Array.isArray(p.localAlerts) ? p.localAlerts.length : 0) > 0;
  return anyYes || anyRows;
}

export function filterSubmissions(subs, opts) {
  const {
    moduleFilter = "all",
    engineerFilter = "all",
    from = "",
    to = "",
    q = "",
    quick = null,
    todayStart,
    todayEnd,
    excludeModule = false,
  } = opts || {};

  const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
  const toTs   = to   ? new Date(to   + "T23:59:59").getTime() : null;

  return subs.filter((s) => {
    const t = new Date(s.createdAt).getTime();

    if (quick === "today" || quick === "todayNoAlerts" || quick === "todayAlerts") {
      if (t < todayStart || t > todayEnd) return false;
      if (quick === "todayNoAlerts" && submissionHasAlerts(s)) return false;
      if (quick === "todayAlerts" && !submissionHasAlerts(s)) return false;
    } else {
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
    }

    if (!excludeModule && moduleFilter !== "all" && s.module !== moduleFilter) return false;
    if (engineerFilter !== "all" && s.engineer !== engineerFilter) return false;

    if (q) {
      const hay = `${s.engineer || ""} ${s.module || ""} ${(s.meta?.clients || []).join(" ")} ${JSON.stringify(s.payload || {})}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
}

export function computeDayAgg(subs, compliance) {
  const map = new Map(); // dateKey -> Set(modules)
  const raw = new Map(); // dateKey -> submissions[]

  for (const s of subs) {
    const key = dateKeyLocal(s.createdAt);
    const mod = String(s.module || "").toLowerCase();
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(mod);
    if (!raw.has(key)) raw.set(key, []);
    raw.get(key).push(s);
  }

  const summaries = [];
  let passDays = 0, failDays = 0;

  for (const [key, mods] of map.entries()) {
    const missing = REQUIRED_MODULES.filter((m) => !mods.has(m));
    const submittedCount = mods.size;
    const items = raw.get(key) || [];
    const passed = missing.length === 0 && submittedCount > 0;
    const failed = missing.length > 0 && submittedCount > 0;
    if (passed) passDays++;
    if (failed) failDays++;

    summaries.push({
      dateKey: key,
      submittedCount,
      missingModules: missing,
      items,
      passed,
      failed,
      ack: !!compliance[key]?.acknowledged,
      note: compliance[key]?.note || "",
    });
  }

  summaries.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  const passRate = (passDays + failDays) ? Math.round((passDays / (passDays + failDays)) * 100) : 0;

  return { summaries, passDays, failDays, passRate };
}

export const monthBucketFromDateKey   = (k) => k?.slice(0, 7); // YYYY-MM
export function quarterBucketFromDateKey(k) {
  const [y, m] = k.split("-").map(Number);
  if (!y || !m) return null;
  const q = Math.floor((m - 1) / 3) + 1;
  return `${y}-Q${q}`;
}
