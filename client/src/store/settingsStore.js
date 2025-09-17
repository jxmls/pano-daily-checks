// src/store/settingsStore.js
const KEY = "infrahub.settings.v1";

const defaults = {
  users: [
    { id: "u-jose", name: "Jose Lucar", email: "jose.lucar@panoptics.com", role: "Admin", status: "active" },
    { id: "u-mihir", name: "Mihir Sangani", email: "mihir.sangani@panoptics.com", role: "User", status: "invited" },
  ],
  roles: [
    { id: "r-admin", name: "Admin", permissions: ["useApp", "manageUsers", "configureAuth"] },
    { id: "r-user",  name: "User",  permissions: ["useApp"] },
  ],
  auth: {
    sso:   { mode: "local", aad: { clientId: "", tenantId: "" } }, // mode: 'local' | 'sso' | 'both'
    twoFA: { enabled: false, methods: { sms: false, totp: true, webauthn: false } },
  },
  meta: { updatedAt: new Date().toISOString() },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(next) {
  const val = { ...next, meta: { updatedAt: new Date().toISOString() } };
  localStorage.setItem(KEY, JSON.stringify(val));
  return val;
}

// optional helpers
export const SettingsStore = {
  get: loadSettings,
  set: saveSettings,
  reset() {
    localStorage.removeItem(KEY);
    return loadSettings();
  },
};
