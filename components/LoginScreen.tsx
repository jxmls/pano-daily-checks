"use client";

import { useState, useMemo } from "react";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { getAuthMode, localLogin, msalLogin } from "@/utils/auth";

const ENGINEER_OPTIONS = ["Jose Lucar", "Alex Field", "Mihir Sangani"];

interface Props { onLogin: (name: string, checkDate: string) => void; }

export default function LoginScreen({ onLogin }: Props) {
  const authMode = useMemo(() => getAuthMode(), []);
  const hasLocal = authMode === "local" || authMode === "both";
  const hasSSO   = authMode === "sso"   || authMode === "both";

  const [engineer, setEngineer] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("engineerName") ?? "" : "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ engineer: "", date: "", password: "" });

  const q = engineer.trim().toLowerCase();
  const suggestions = q.length >= 2
    ? ENGINEER_OPTIONS.filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
    : [];

  const validateLocal = () => {
    const e = { engineer: "", date: "", password: "" };
    if (!engineer.trim()) e.engineer = "Name required";
    if (!date) e.date = "Date required";
    if (!password) e.password = "Password required";
    setFieldErrors(e);
    return !e.engineer && !e.date && !e.password;
  };

  const complete = (name: string) => {
    localStorage.setItem("engineerName", name);
    localStorage.setItem("checkDate", date);
    onLogin(name, date);
  };

  const handleLocal = async () => {
    setError("");
    if (!validateLocal()) return;
    setLoading(true);
    try { complete(await localLogin(engineer, password)); }
    catch (e: unknown) { setError((e as Error).message ?? "Sign-in failed."); }
    finally { setLoading(false); }
  };

  const handleSSO = async () => {
    setError("");
    if (!engineer.trim()) { setFieldErrors((p) => ({ ...p, engineer: "Name required" })); return; }
    if (!date) { setFieldErrors((p) => ({ ...p, date: "Date required" })); return; }
    setLoading(true);
    try { complete(await msalLogin(engineer)); }
    catch (e: unknown) { setError((e as Error).message ?? "SSO failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #001414 0%, #002626 40%, #003a3a 100%)",
      }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(#008282 1px, transparent 1px), linear-gradient(90deg, #008282 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,130,130,0.15) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-sm">

        {/* Logo area */}
        <div className="text-center mb-8">
          <img src="/panologo.png" alt="Panoptics"
            className="h-10 w-auto object-contain mx-auto brightness-0 invert opacity-90 mb-3"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <h1 className="text-2xl font-black text-white tracking-tight">Infrastructure Hub</h1>
          <p className="text-sm mt-1" style={{ color: "#5ccfcf" }}>Daily Checks Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(0,130,130,0.25)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>

          {/* Engineer */}
          <div>
            <label className="label" style={{ color: "rgba(255,255,255,0.45)" }}>Engineer</label>
            <input
              list="engineers"
              placeholder="Your name"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: fieldErrors.engineer ? "1.5px solid #f87171" : "1.5px solid rgba(0,130,130,0.3)",
                color: "white",
                outline: "none",
              }}
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#008282"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.engineer ? "#f87171" : "rgba(0,130,130,0.3)"; }}
              autoFocus
            />
            <datalist id="engineers">
              {ENGINEER_OPTIONS.map((n) => <option key={n} value={n} />)}
            </datalist>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => setEngineer(s)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(0,130,130,0.2)", color: "#7dd8d8", border: "1px solid rgba(0,130,130,0.3)" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {fieldErrors.engineer && <p className="mt-1 text-xs font-semibold text-red-400">{fieldErrors.engineer}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label" style={{ color: "rgba(255,255,255,0.45)" }}>Check Date</label>
            <div className="flex gap-2">
              <input type="date"
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: fieldErrors.date ? "1.5px solid #f87171" : "1.5px solid rgba(0,130,130,0.3)",
                  color: "white",
                  outline: "none",
                  colorScheme: "dark",
                }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button type="button"
                onClick={() => setDate(new Date().toISOString().split("T")[0])}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                style={{ background: "rgba(0,130,130,0.2)", color: "#7dd8d8", border: "1.5px solid rgba(0,130,130,0.3)" }}>
                Today
              </button>
            </div>
            {fieldErrors.date && <p className="mt-1 text-xs font-semibold text-red-400">{fieldErrors.date}</p>}
          </div>

          {/* SSO */}
          {hasSSO && (
            <button type="button" onClick={handleSSO} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all"
              style={{
                background: "white", color: "#0f1a1a",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}>
              <MicrosoftIcon />
              {loading ? "Signing in…" : "Sign in with Microsoft"}
            </button>
          )}

          {hasSSO && hasLocal && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
          )}

          {/* Password */}
          {hasLocal && (
            <div className="space-y-4">
              <div>
                <label className="label" style={{ color: "rgba(255,255,255,0.45)" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm font-semibold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: fieldErrors.password ? "1.5px solid #f87171" : "1.5px solid rgba(0,130,130,0.3)",
                      color: "white",
                      outline: "none",
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      setCapsLock(e.getModifierState("CapsLock"));
                      if (e.key === "Enter") handleLocal();
                    }}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    {showPw ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock && <p className="mt-1 text-xs text-amber-400 font-semibold">⚠ Caps Lock is on</p>}
                {fieldErrors.password && <p className="mt-1 text-xs text-red-400 font-semibold">{fieldErrors.password}</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-400"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.2)" }}>
                  <ExclamationCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button type="button" onClick={handleLocal} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-black tracking-tight text-white transition-all"
                style={{
                  background: loading ? "rgba(0,130,130,0.4)" : "linear-gradient(135deg, #008282, #006e6e)",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(0,130,130,0.4)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Logging in…" : "Continue →"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
          Panoptics Infrastructure Hub · Daily Checks
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
      <rect width="10" height="10" x="0"    y="0"    fill="#F25022" />
      <rect width="10" height="10" x="12.5" y="0"    fill="#7FBA00" />
      <rect width="10" height="10" x="0"    y="12.5" fill="#00A4EF" />
      <rect width="10" height="10" x="12.5" y="12.5" fill="#FFB900" />
    </svg>
  );
}
