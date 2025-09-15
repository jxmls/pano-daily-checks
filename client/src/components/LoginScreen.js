// src/components/LoginScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const REQUIRED_PASSWORD = process.env.REACT_APP_LOGIN_PASSWORD || "HotFix991!";
// Optional version badge, e.g. set REACT_APP_VERSION=1.3.0
const APP_VERSION = process.env.REACT_APP_VERSION || "";

// Central engineer list for suggestions/validation
const ENGINEER_OPTIONS = ["Jose Lucar", "Alex Field", "Mihir Sangani"];

// Minimum typed characters before we show suggestions
const MIN_SUGGEST_CHARS = 3;

export default function LoginScreen({ onLogin }) {
  const [engineer, setEngineer] = useState(
    () => localStorage.getItem("engineerName") || ""
  );
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field + global errors
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    engineer: "",
    date: "",
    password: "",
  });

  const normalizedOptions = useMemo(
    () => ENGINEER_OPTIONS.map((n) => n.trim().toLowerCase()),
    []
  );
  const trimmedEngineer = engineer.trim();
  const q = trimmedEngineer.toLowerCase();

  // exact match (no warning if exact)
  const exactMatch = useMemo(
    () => (q ? normalizedOptions.includes(q) : true),
    [q, normalizedOptions]
  );

  // suggestions: substring matches (≥3 chars), rank prefixes first
  const suggestions = useMemo(() => {
    if (q.length < MIN_SUGGEST_CHARS) return [];
    const score = (name) => {
      const lower = name.toLowerCase();
      const idx = lower.indexOf(q);
      return idx === 0 ? -1 : idx; // prefixes first, then earlier substrings
    };
    return ENGINEER_OPTIONS
      .filter((name) => {
        const lower = name.toLowerCase();
        return lower.includes(q) && lower !== q;
      })
      .sort((a, b) => score(a) - score(b))
      .slice(0, 5);
  }, [q]);

  // Soft amber hint when there are no matches after 3+ chars
  const showSoftWarning = useMemo(
    () => q.length >= MIN_SUGGEST_CHARS && !exactMatch && suggestions.length === 0,
    [q.length, exactMatch, suggestions.length]
  );

  // Clear field-level errors when user fixes input
  useEffect(() => {
    if (engineer && fieldErrors.engineer) {
      setFieldErrors((e) => ({ ...e, engineer: "" }));
    }
    if (date && fieldErrors.date) {
      setFieldErrors((e) => ({ ...e, date: "" }));
    }
    if (password && fieldErrors.password) {
      setFieldErrors((e) => ({ ...e, password: "" }));
    }
  }, [engineer, date, password]); // eslint-disable-line

  const validate = () => {
    const next = { engineer: "", date: "", password: "" };
    if (!engineer) next.engineer = "Please select or enter your name.";
    if (!date) next.date = "Please choose a date.";
    if (!password) next.password = "Please enter the password.";
    setFieldErrors(next);
    return !next.engineer && !next.date && !next.password;
  };

  const handleLogin = () => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      if (password !== REQUIRED_PASSWORD) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }
      localStorage.setItem("engineerName", engineer);
      localStorage.setItem("checkDate", date);
      onLogin(engineer, date);
    }, 280);
  };

  const setToday = () => setDate(new Date().toISOString().split("T")[0]);

  const isDisabled = loading;

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${require("../assets/background.jpg")})` }}
    >
      {/* dim + grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:40px_40px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 sm:p-7">
          {/* Brand header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Prefer /panologo.svg for crispness; else provide @2x/@3x pngs */}
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
            {APP_VERSION && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                {APP_VERSION}
              </span>
            )}
          </div>

          <h2 className="text-base font-medium text-center text-gray-700 mb-4">
            Sign in
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isDisabled) handleLogin();
            }}
            className="space-y-4"
            noValidate
          >
            {/* Engineer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engineer
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  list="engineers"
                  autoComplete="name"
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
                {/* built-in prefix suggestions (optional) */}
                <datalist id="engineers">
                  {ENGINEER_OPTIONS.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Substring suggestions after 3+ chars */}
              {trimmedEngineer && suggestions.length > 0 && (
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

              {/* Soft warning only when there are NO matches */}
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

            {/* Date */}
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
                    fieldErrors.date
                      ? "border-red-400 ring-1 ring-red-300"
                      : "border-gray-300",
                  ].join(" ")}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <button
                  type="button"
                  onClick={setToday}
                  className="absolute right-2 top-1.5 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-gray-700"
                  aria-label="Set date to today"
                >
                  Today
                </button>
              </div>
              {fieldErrors.date && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
              )}
            </div>

            {/* Password */}
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
                    fieldErrors.password
                      ? "border-red-400 ring-1 ring-red-300"
                      : "border-gray-300",
                  ].join(" ")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {capsLockOn && (
                <p className="text-amber-600 text-sm mt-1">⚠️ Caps Lock is on</p>
              )}
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Global error */}
            {error && (
              <div
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <InformationCircleIcon className="h-5 w-5 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`group w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-white transition
                ${isDisabled ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"}`}
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  Logging in…
                </>
              ) : (
                <>Login</>
              )}
            </button>

            <p className="text-[11px] text-center text-gray-500 pt-1">
              Tip: type at least 3 letters to see name suggestions.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
