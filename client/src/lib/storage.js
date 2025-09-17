// client/src/lib/storage.js
// storage.js
export async function saveLocalAndMirror(localRow, overrides = {}) {
  // 1) Save locally (keep your existing localStorage logic here)
  try {
    // e.g., persist to your local array/store…
    // saveLocal(localRow)  <-- your existing function, if any
  } catch (_) {}

  // 2) Mirror to backend
  const apiBase =
    (import.meta?.env?.VITE_API_URL) || // Vite
    (process.env.REACT_APP_API_URL) ||  // CRA
    "";                                 // fallback (same origin)

  const payload = {
    module:
      overrides.module ||
      localRow.module ||
      localRow.form ||
      "unknown",
    engineer:
      overrides.engineer ||
      localRow.engineer ||
      localRow.payload?.engineer ||
      localRow.payload?.engineerName ||
      "",
    payload: overrides.payload || localRow.payload || localRow,
    date: localRow.date || new Date().toISOString().slice(0, 10),
    hasAlerts: Boolean(
      overrides?.payload?.alerts?.length ||
      localRow?.payload?.alerts?.length ||
      localRow?.payload?.panopticsAlerts?.length ||
      localRow?.payload?.theBreweryAlerts?.length
    ),
  };

  const res = await fetch(`${apiBase}/api/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Mirror failed: ${res.status} ${t}`);
  }
  return res.json();
}



// ---------- keys & constants ----------
export const SUBMISSIONS_KEY  = "pano.submissions.v1";
export const COMPLIANCE_KEY   = "pano.compliance.v1";
export const REQUIRED_MODULES = ["veeam", "vsan", "solarwinds", "checkpoint"];

// Same-origin API base (override by setting window.__PANO_API_BASE = 'https://api.example.com')
const API_BASE =
  typeof window !== "undefined" && window.__PANO_API_BASE
    ? window.__PANO_API_BASE
    : "";

// ---------- small utils ----------
const isBrowser = typeof window !== "undefined";
let memStore = {}; // fallback when localStorage is unavailable (SSR or locked down)

function getLS() {
  if (!isBrowser) return null;
  try {
    // ensure localStorage is accessible (can throw in private modes)
    const t = "__pano_test__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  const ls = getLS();
  try {
    if (ls) {
      const raw = ls.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }
    return key in memStore ? memStore[key] : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  const ls = getLS();
  try {
    if (ls) ls.setItem(key, JSON.stringify(value));
    else memStore[key] = value;
  } catch {
    // quota or other errors — fall back to memory
    memStore[key] = value;
  }
}

// ---------- current local API (unchanged signatures) ----------
export const loadSubmissions = () => readJson(SUBMISSIONS_KEY, []);
export const saveAll         = (subs) => writeJson(SUBMISSIONS_KEY, subs || []);
export const loadCompliance  = () => readJson(COMPLIANCE_KEY, {});
export const saveCompliance  = (obj)  => writeJson(COMPLIANCE_KEY, obj || {});

// ---------- optional backend helpers ----------
async function fetchJSON(url, opts = {}, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText} ${txt}`.trim());
    }
    // allow 204/empty
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : null;
  } finally {
    clearTimeout(t);
  }
}

// Cache health for a short time to avoid spamming the API
let _healthCache = { at: 0, ok: false };
export async function backendHealthy(force = false) {
  const now = Date.now();
  if (!force && _healthCache.ok && now - _healthCache.at < 60_000) return true;
  try {
    const data = await fetchJSON(`${API_BASE}/api/health`, {}, { timeoutMs: 4000 });
    _healthCache = { at: now, ok: !!(data && data.ok) };
  } catch {
    _healthCache = { at: now, ok: false };
  }
  return _healthCache.ok;
}

/**
 * Fetch all submissions from the server (if available).
 * Options: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } for server-side filtering.
 * Returns [] on any error so callers can safely fall back to local storage.
 */
export async function fetchAllFromServer(opts = {}) {
  const ok = await backendHealthy();
  if (!ok) return [];
  const p = new URLSearchParams();
  if (opts.from) p.set("from", opts.from);
  if (opts.to)   p.set("to", opts.to);
  const qs = p.toString();
  try {
    const rows = await fetchJSON(`${API_BASE}/api/all${qs ? `?${qs}` : ""}`);
    // Expect server to already return objects in the same shape you list in AdminPortal.
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * Post a single submission to the server. Payload example:
 * { module: 'vsan' | 'veeam' | 'solarwinds' | 'checkpoint',
 *   engineer: 'Name',
 *   payload: { ...form data you already send... } }
 * Returns { ok: true } on success, or { ok: false, error } on failure.
 */
export async function postSubmissionToServer(body) {
  const ok = await backendHealthy();
  if (!ok) return { ok: false, error: "Backend not reachable" };
  try {
    const res = await fetchJSON(`${API_BASE}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    return res && res.ok ? { ok: true } : { ok: false, error: "Unexpected server response" };
  } catch (e) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

/**
 * Convenience helper: push a new local submission row (for compatibility)
 * and try to mirror it to the server in the background.
 *
 * It won’t throw; it returns { savedLocal: true, mirrored: boolean }.
 */
export async function saveLocalAndMirror(row, mirrorBody) {
  try {
    const all = loadSubmissions();
    all.unshift(row);
    saveAll(all);
  } catch {
    // ignore; local write failures are non-fatal
  }

  let mirrored = false;
  try {
    if (mirrorBody) {
      const r = await postSubmissionToServer(mirrorBody);
      mirrored = !!r.ok;
    }
  } catch {
    mirrored = false;
  }
  return { savedLocal: true, mirrored };
}
