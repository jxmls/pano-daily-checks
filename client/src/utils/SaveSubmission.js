// src/utils/SaveSubmission.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

export function saveSubmission(entry) {
  const key = "pano.submissions.v1";

  // 1) Local (Admin Portal)
  const raw = localStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  arr.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    ...entry, // { module, engineer, passed, meta, payload, pdf?: { name, dataUrl } }
  });
  localStorage.setItem(key, JSON.stringify(arr));

  // 2) Fire-and-forget DB write
  try {
    fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore; local save succeeded */ }
}
