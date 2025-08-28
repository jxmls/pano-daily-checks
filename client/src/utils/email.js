// src/utils/email.js

// ---- Defaults (edit to your real ops mailbox) ----
const DEFAULT_TO  = "ops@example.com";
const DEFAULT_CC  = "";
const DEFAULT_BCC = "";

/**
 * Safely grab env vars in CRA (REACT_APP_*) and fall back to defaults.
 * You can override at runtime via localStorage too.
 */
function env(key, fallback = "") {
  if (typeof process !== "undefined" && process.env && process.env[key]) return process.env[key];
  return fallback;
}
function ls(key, fallback = "") {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}

// Final recipients priority: localStorage -> .env -> defaults
const TO  = ls("checklist.to",  env("REACT_APP_CHECKLIST_TO",  DEFAULT_TO));
const CC  = ls("checklist.cc",  env("REACT_APP_CHECKLIST_CC",  DEFAULT_CC));
const BCC = ls("checklist.bcc", env("REACT_APP_CHECKLIST_BCC", DEFAULT_BCC));

export function buildMailto(subject, body, opts = {}) {
  const to  = opts.to  || TO;
  const cc  = opts.cc  || CC;
  const bcc = opts.bcc || BCC;

  const params = new URLSearchParams();
  if (cc)  params.append("cc", cc);
  if (bcc) params.append("bcc", bcc);
  params.append("subject", subject || "");
  params.append("body", body || "");

  return `mailto:${to}?${params.toString()}`;
}

/**
 * Open the default mail client. If the user doesn’t have one set up,
 * you can enable the Gmail fallback below.
 */
export function openEmail(subject, body, opts = {}) {
  try {
    const href = buildMailto(subject, body, opts);
    const a = document.createElement("a");
    a.href = href;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 0);
  } catch {
    // ignore
  }

  // OPTIONAL: Gmail web compose fallback (uncomment to enable)
  // openGmailWeb(subject, body, opts.to || TO, opts.cc || CC, opts.bcc || BCC);
}

// --- Gmail web compose (fallback) ---
function openGmailWeb(subject, body, to, cc, bcc) {
  const p = new URLSearchParams();
  if (to)  p.append("to", to);
  if (cc)  p.append("cc", cc);
  if (bcc) p.append("bcc", bcc);
  if (subject) p.append("su", subject);
  if (body)    p.append("body", body);
  const url = `https://mail.google.com/mail/?view=cm&fs=1&${p.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
