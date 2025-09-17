// Auth strategies (Local password + Microsoft SSO) — JS edition

const REQUIRED_PASSWORD = process.env.REACT_APP_LOCAL_PASSWORD || "HotFix991!";
const AAD_CLIENT_ID = process.env.REACT_APP_AAD_CLIENT_ID || "";
const AAD_TENANT_ID = process.env.REACT_APP_AAD_TENANT_ID || "";

/* ---------- Local (password) ---------- */
export const localStrategy = {
  id: "local",
  label: "Local (Password)",
  usesPassword: true,
  async login({ engineer, password }) {
    if (!engineer || !engineer.trim()) throw new Error("Please enter your name.");
    if (!password) throw new Error("Please enter the password.");
    if (password !== REQUIRED_PASSWORD) throw new Error("Incorrect password.");
    return { displayName: engineer.trim() };
  },
};

/* ---------- Microsoft SSO (MSAL) ---------- */
export const msalStrategy = {
  id: "sso",
  label: "Microsoft SSO",
  usesPassword: false,
  async login({ engineer }) {
    if (!AAD_CLIENT_ID || !AAD_TENANT_ID) {
      throw new Error(
        "SSO not configured. Missing REACT_APP_AAD_CLIENT_ID or REACT_APP_AAD_TENANT_ID."
      );
    }
    // Lazy import so devs not using SSO don’t need the package installed until used
    let PublicClientApplication;
    try {
      ({ PublicClientApplication } = await import("@azure/msal-browser"));
    } catch {
      throw new Error("SSO module not installed. Run: npm i @azure/msal-browser");
    }

    const pca = new PublicClientApplication({
      auth: {
        clientId: AAD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${AAD_TENANT_ID}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
    });

    const res = await pca.loginPopup({ scopes: ["User.Read"] });
    const acct =
      res.account ||
      (pca.getAllAccounts && pca.getAllAccounts()[0]) ||
      undefined;

    const displayName = (acct && (acct.name || acct.username)) || engineer || "Unknown";
    return { displayName };
  },
};

/* ---------- Strategy selector from env / URL ---------- */
function resolveAuthMode() {
  const urlMode = new URLSearchParams(window.location.search).get("auth");
  const envMode = (process.env.REACT_APP_AUTH_MODE || "local").toLowerCase();
  const valid = ["local", "sso", "both"];
  if (urlMode && valid.includes(urlMode)) return urlMode;
  return valid.includes(envMode) ? envMode : "local";
}

export function getEnabledStrategies() {
  const mode = resolveAuthMode();
  if (mode === "local") return [localStrategy];
  if (mode === "sso") return [msalStrategy];
  return [msalStrategy, localStrategy]; // both
}

export function getAuthModeLabel() {
  const mode = resolveAuthMode();
  return mode.toUpperCase();
}
