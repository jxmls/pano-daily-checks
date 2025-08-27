// src/utils/SaveSubmission.js
export function saveSubmission(entry) {
  const key = "pano.submissions.v1";
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
      ...entry, // { module, engineer, passed, meta, payload, pdf?: { name, dataUrl } }
    });
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error("Failed to save submission", e);
  }
}
