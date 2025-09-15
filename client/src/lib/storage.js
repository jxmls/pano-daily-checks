export const SUBMISSIONS_KEY = "pano.submissions.v1";
export const COMPLIANCE_KEY  = "pano.compliance.v1";
export const REQUIRED_MODULES = ["veeam", "vsan", "solarwinds", "checkpoint"];

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const val = raw ? JSON.parse(raw) : fallback;
    return val ?? fallback;
  } catch {
    return fallback;
  }
}
function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const loadSubmissions = () => loadJson(SUBMISSIONS_KEY, []);
export const saveAll         = (subs) => saveJson(SUBMISSIONS_KEY, subs || []);
export const loadCompliance  = () => loadJson(COMPLIANCE_KEY, {});
export const saveCompliance  = (obj) => saveJson(COMPLIANCE_KEY, obj || {});
