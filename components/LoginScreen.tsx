"use client";

import { useState, useMemo } from "react";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { getAuthMode, localLogin, msalLogin } from "@/utils/auth";

interface Props { onLogin: () => void; }

function LogoMark() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <rect width="52" height="52" rx="14" fill="#00b4b4" />
      <text x="26" y="38" textAnchor="middle" fill="#002626" fontSize="32" fontWeight="900" fontFamily="Arial,sans-serif">P</text>
    </svg>
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

export default function LoginScreen({ onLogin }: Props) {
  const authMode = useMemo(() => getAuthMode(), []);
  const hasLocal = authMode === "local" || authMode === "both";
  const hasSSO   = authMode === "sso"   || authMode === "both";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLocal = async () => {
    setError("");
    if (!username.trim()) { setError("Username required."); return; }
    if (!password) { setError("Password required."); return; }
    setLoading(true);
    try {
      await localLogin(username, password);
      onLogin();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = async () => {
    setError("");
    setLoading(true);
    try {
      await msalLogin(username || "");
      onLogin();
    } catch (e: unknown) {
      setError((e as Error).message ?? "SSO failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        position: "relative",
        background: "linear-gradient(135deg, #001414 0%, #002626 40%, #003a3a 100%)",
        overflow: "hidden",
      }}>

      {/* Background grid */}
      <div className="pointer-events-none opacity-[0.06]"
        style={{
          position: "absolute", inset: 0, overflow: "hidden",
          backgroundImage: "linear-gradient(#008282 1px, transparent 1px), linear-gradient(90deg, #008282 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      {/* Glow */}
      <div className="pointer-events-none"
        style={{
          position: "absolute", top: "33%", left: "50%", transform: "translate(-50%, -50%)",
          width: 384, height: 384, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,130,130,0.15) 0%, transparent 70%)",
        }} />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <LogoMark />
          </div>
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

          {hasSSO && (
            <button type="button" onClick={handleSSO} disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all"
              style={{ background: "white", color: "#0f1a1a", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: loading ? "not-allowed" : "pointer" }}>
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

          {hasLocal && (
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="label" style={{ color: "rgba(255,255,255,0.45)" }}>Email or username</label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(0,130,130,0.3)",
                    color: "white", outline: "none",
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#00b4b4"; }}
                  onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(0,130,130,0.3)"; }}
                  autoFocus
                />
              </div>

              {/* Password */}
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
                      border: "1.5px solid rgba(0,130,130,0.3)",
                      color: "white", outline: "none",
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      setCapsLock(e.getModifierState("CapsLock"));
                      if (e.key === "Enter") handleLocal();
                    }}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#00b4b4"; }}
                    onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "rgba(0,130,130,0.3)"; }}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center" }}>
                    {showPw ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock && <p className="mt-1 text-xs font-semibold" style={{ color: "#f59e0b" }}>Caps Lock is on</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <ExclamationCircleIcon className="h-4 w-4 mt-0.5" style={{ flexShrink: 0 }} />
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
                {loading ? "Signing in…" : "Continue"}
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
