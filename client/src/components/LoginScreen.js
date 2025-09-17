import React, { useMemo, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

/* ========= Config ========= */
const REQUIRED_PASSWORD = process.env.REACT_APP_LOCAL_PASSWORD || "HotFix991!";
const AAD_CLIENT_ID = process.env.REACT_APP_AAD_CLIENT_ID || "";
const AAD_TENANT_ID = process.env.REACT_APP_AAD_TENANT_ID || "";
const APP_VERSION = process.env.REACT_APP_VERSION || "";

/* ========= Strategies (inline) ========= */
const localStrategy = {
  id: "local",
  label: "Local (Password)",
  usesPassword: true,
  async login({ engineer, password }) {
    if (!engineer?.trim()) throw new Error("Please enter your name.");
    if (!password) throw new Error("Please enter the password.");
    if (password !== REQUIRED_PASSWORD) throw new Error("Incorrect password.");
    return { displayName: engineer.trim() };
  },
};

const msalStrategy = {
  id: "sso",
  label: "Microsoft SSO",
  usesPassword: false,
  async login({ engineer }) {
    const cid = process.env.REACT_APP_AAD_CLIENT_ID;
    const tid = process.env.REACT_APP_AAD_TENANT_ID;
    if (!cid || !tid) {
      throw new Error(
        "SSO not configured. Set REACT_APP_AAD_CLIENT_ID and REACT_APP_AAD_TENANT_ID."
      );
    }

    let PublicClientApplication;
    try {
      ({ PublicClientApplication } = await import("@azure/msal-browser"));
    } catch {
      throw new Error("SSO module not installed. Run: npm i @azure/msal-browser");
    }

    const pca = new PublicClientApplication({
      auth: {
        clientId: cid,
        authority: `https://login.microsoftonline.com/${tid}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
    });

    // 🔧 v3 requirement: initialize + (nice-to-have) handleRedirectPromise
    await pca.initialize();
    await pca.handleRedirectPromise().catch(() => null);

    // Try to reuse an existing signed-in account first
    let account = pca.getActiveAccount();
    if (!account) {
      const accounts = pca.getAllAccounts();
      if (accounts?.length) {
        account = accounts[0];
        pca.setActiveAccount(account);
      }
    }

    if (!account) {
      try {
        const res = await pca.loginPopup({ scopes: ["User.Read"] });
        account = res.account || account;
        if (account) pca.setActiveAccount(account);
      } catch (err) {
        const msg = (err?.message || err?.errorMessage || "").toLowerCase();
        if (msg.includes("popup")) {
          await pca.loginRedirect({ scopes: ["User.Read"] });
          // When we come back from redirect, handleRedirectPromise() (above) resolves.
          // We can return a placeholder name now; real account is loaded on next render.
          return { displayName: engineer || "Unknown" };
        }
        throw err;
      }
    }

    const displayName =
      (account && (account.name || account.username)) || engineer || "Unknown";
    return { displayName };
  },
};


function resolveAuthMode() {
  const urlMode = new URLSearchParams(window.location.search).get("auth");
  const envMode = (process.env.REACT_APP_AUTH_MODE || "local").toLowerCase();
  const valid = ["local", "sso", "both"];
  if (urlMode && valid.includes(urlMode)) return urlMode;
  return valid.includes(envMode) ? envMode : "local";
}
function getEnabledStrategies() {
  const mode = resolveAuthMode();
  if (mode === "local") return [localStrategy];
  if (mode === "sso") return [msalStrategy];
  return [msalStrategy, localStrategy]; // both
}
function getAuthModeLabel() {
  return resolveAuthMode().toUpperCase();
}

/* ========= Simple suggestions ========= */
const ENGINEER_OPTIONS = ["Jose Lucar", "Alex Field", "Mihir Sangani"];

export default function LoginScreen({ onLogin }) {
  const strategies = useMemo(() => getEnabledStrategies(), []);
  const hasSSO = strategies.some((s) => s.id === "sso");
  const hasLocal = strategies.some((s) => s.id === "local");

  const [engineer, setEngineer] = useState(
    () => localStorage.getItem("engineerName") || ""
  );
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    engineer: "",
    date: "",
    password: "",
  });

  // basic “contains” suggestions (>=3 chars)
  const q = engineer.trim().toLowerCase();
  const suggestions =
    q.length >= 3
      ? ENGINEER_OPTIONS.filter(
          (n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q
        ).slice(0, 5)
      : [];
  const showSoftWarning = q.length >= 3 && suggestions.length === 0;

  const validateLocal = () => {
    const next = { engineer: "", date: "", password: "" };
    if (!engineer?.trim()) next.engineer = "Please enter your name.";
    if (!date) next.date = "Please choose a date.";
    if (!password) next.password = "Please enter the password.";
    setFieldErrors(next);
    return !next.engineer && !next.date && !next.password;
  };

  const completeLogin = (displayName) => {
    const finalName = displayName || engineer || "Unknown";
    localStorage.setItem("engineerName", finalName);
    localStorage.setItem("checkDate", date);
    onLogin(finalName, date);
  };

  const loginWithLocal = async () => {
    setError("");
    if (!validateLocal()) return;
    setLoading(true);
    try {
      const { displayName } = await localStrategy.login({ engineer, password });
      completeLogin(displayName);
    } catch (e) {
      setError(e?.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    setError("");
    // For SSO we only require name + date (keep the same local validation minus password)
    const next = { engineer: "", date: "" };
    if (!engineer?.trim()) next.engineer = "Please enter your name.";
    if (!date) next.date = "Please choose a date.";
    setFieldErrors((prev) => ({ ...prev, ...next, password: "" }));
    if (next.engineer || next.date) return;

    setLoading(true);
    try {
      const { displayName } = await msalStrategy.login({ engineer, date });
      completeLogin(displayName);
    } catch (e) {
      setError(e?.message || "Microsoft sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${require("../assets/background.jpg")})` }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/70" />
      <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src="/panologo.png"
                srcSet="/panologo@2x.png 2x, /panologo@3x.png 3x"
                sizes="(max-width: 768px) 120px, 160px"
                alt="Panoptics"
                className="h-10 w-auto object-contain select-none"
                loading="eager"
                decoding="async"
                draggable="false"
              />
              <h1 className="text-xl font-semibold text-gray-800">
                Infrastructure Hub
              </h1>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
              Auth: {getAuthModeLabel()}
              {APP_VERSION ? ` · v${APP_VERSION}` : ""}
            </span>
          </div>

          {/* Engineer & Date (shared) */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engineer
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  list="engineers"
                  placeholder="Start typing your name…"
                  className={[
                    "w-full pl-10 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
                    fieldErrors.engineer
                      ? "border-red-400 ring-1 ring-red-300"
                      : showSoftWarning
                      ? "border-amber-400 ring-1 ring-amber-300"
                      : "border-gray-300",
                  ].join(" ")}
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  autoFocus
                />
                <datalist id="engineers">
                  {ENGINEER_OPTIONS.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>

              {!!engineer.trim() && suggestions.length > 0 && (
                <div className="mt-1 text-[13px] text-gray-700">
                  Suggestions:
                  <span className="ml-1 inline-flex flex-wrap gap-1">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEngineer(s)}
                        className="px-2 py-[2px] rounded-full border text-[12px] bg-gray-50 hover:bg-gray-100"
                      >
                        {s}
                      </button>
                    ))}
                  </span>
                </div>
              )}

              {showSoftWarning && (
                <div className="mt-1 text-[13px] text-amber-700 flex items-start gap-2">
                  <InformationCircleIcon className="h-4 w-4 mt-0.5" />
                  <span>Name not in list — check spelling.</span>
                </div>
              )}

              {fieldErrors.engineer && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.engineer}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  className={[
                    "w-full pl-10 pr-20 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
                    fieldErrors.date ? "border-red-400 ring-1 ring-red-300" : "border-gray-300",
                  ].join(" ")}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().split("T")[0])}
                  className="absolute right-2 top-1.5 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-gray-700"
                >
                  Today
                </button>
              </div>
              {fieldErrors.date && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
              )}
            </div>
          </div>

          {/* Microsoft SSO button */}
          {hasSSO && (
            <div className="mt-5">
              <button
                type="button"
                onClick={loginWithMicrosoft}
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 border transition ${
                  loading
                    ? "bg-white text-gray-400 border-gray-300 cursor-not-allowed"
                    : "bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
                }`}
              >
                {/* Microsoft logo (inline SVG) */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 23 23"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect width="10" height="10" x="0" y="0" fill="#F25022" />
                  <rect width="10" height="10" x="12.5" y="0" fill="#7FBA00" />
                  <rect width="10" height="10" x="0" y="12.5" fill="#00A4EF" />
                  <rect width="10" height="10" x="12.5" y="12.5" fill="#FFB900" />
                </svg>
                {loading ? "Signing in…" : "Sign in with Microsoft"}
              </button>
              <div className="mt-2 text-center text-xs text-gray-500">
                Your organization’s Microsoft account
              </div>
            </div>
          )}

          {/* OR divider (only if both modes) */}
          {hasSSO && hasLocal && (
            <div className="my-5 flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="mx-3 text-xs uppercase tracking-wide text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Local password form */}
          {hasLocal && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginWithLocal();
              }}
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={[
                      "w-full pl-10 border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition",
                      fieldErrors.password ? "border-red-400 ring-1 ring-red-300" : "border-gray-300",
                    ].join(" ")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="text-amber-600 text-sm mt-1">⚠️ Caps Lock is on</p>
                )}
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Error (local) */}
              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <InformationCircleIcon className="h-5 w-5 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-white transition
                ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"}`}
              >
                {loading ? "Logging in…" : "Continue with password"}
              </button>
            </form>
          )}

          {/* Error (SSO-only mode) */}
          {!hasLocal && error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <InformationCircleIcon className="h-5 w-5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
