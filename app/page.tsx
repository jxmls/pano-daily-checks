"use client";

import { useState, useEffect } from "react";
import type { Screen, SessionUser, Submission } from "@/types";
import LoginScreen from "@/components/LoginScreen";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import SolarWindsForm from "@/components/forms/SolarWindsForm";
import VeeamForm from "@/components/forms/VeeamForm";
import VmwareForm from "@/components/forms/VmwareForm";
import CheckpointForm from "@/components/forms/CheckpointForm";
import KnownIssuesCatalog from "@/components/KnownIssuesCatalog";
import AdminPortal from "@/components/admin/AdminPortal";
import ProjectBoard from "@/components/board/ProjectBoard";

const DEFAULT_SCREEN: Screen = "dashboard";
const ENGINEER_OPTIONS = ["Jose Lucar", "Alex Field", "Mihir Sangani"];

function ProfileSetup({ onComplete }: { onComplete: (name: string, checkDate: string) => void }) {
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("engineerName") ?? "" : "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    localStorage.setItem("engineerName", name.trim());
    onComplete(name.trim(), new Date().toISOString().split("T")[0]);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00b4b4", marginBottom: 8 }}>
            Signed in
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
            Who&apos;s checking today?
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
            Select your name to continue.
          </p>
        </div>

        <div style={{
          background: "#111827", border: "1px solid #1e293b",
          borderRadius: 16, padding: "28px 28px",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          <div>
            <label className="label">Your name</label>
            <input
              list="engineers-setup"
              placeholder="Engineer name"
              className="input w-full"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoFocus
            />
            <datalist id="engineers-setup">
              {ENGINEER_OPTIONS.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          {error && (
            <p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", margin: 0 }}>{error}</p>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 800 }}
            onClick={handleSubmit}>
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [screen, setScreen] = useState<Screen>(DEFAULT_SCREEN);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const handleLogin = () => {
    setLoggedIn(true);
    setScreen(DEFAULT_SCREEN);
  };

  const handleProfileComplete = (name: string, checkDate: string) => {
    setUser({ name, checkDate });
  };

  const handleSignOut = () => {
    setLoggedIn(false);
    setUser(null);
    setScreen(DEFAULT_SCREEN);
    setCompletedToday(new Set());
  };

  const handleSubmitSuccess = (module: string) => {
    setCompletedToday((prev) => new Set(Array.from(prev).concat(module)));
  };

  useEffect(() => {
    if (!user) { setCompletedToday(new Set()); return; }
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((subs: Submission[]) => {
        setCompletedToday(new Set(
          subs
            .filter((s: Submission) => s.checkDate === user.checkDate)
            .map((s: Submission) => s.module)
        ));
      })
      .catch(() => {});
  }, [user]);

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!user) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar user={user} screen={screen} onSelectScreen={setScreen} completedToday={completedToday} />
      <TopBar user={user} onSignOut={handleSignOut} />
      <main style={{ marginLeft: 240, marginTop: 52, minHeight: "calc(100vh - 52px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 120px" }}>
          {screen === "dashboard" ? (
            <Dashboard
              engineer={user.name}
              checkDate={user.checkDate}
              completedToday={completedToday}
              onSelectScreen={setScreen}
            />
          ) : screen === "solarwinds" ? (
            <SolarWindsForm
              engineer={user.name}
              date={user.checkDate}
              onSubmitSuccess={() => handleSubmitSuccess("solarwinds")}
            />
          ) : screen === "vsan" ? (
            <VmwareForm
              engineer={user.name}
              date={user.checkDate}
              onSubmitSuccess={() => handleSubmitSuccess("vsan")}
            />
          ) : screen === "veeam" ? (
            <VeeamForm
              engineer={user.name}
              date={user.checkDate}
              onSubmitSuccess={() => handleSubmitSuccess("veeam")}
            />
          ) : screen === "checkpoint" ? (
            <CheckpointForm
              engineer={user.name}
              date={user.checkDate}
              onSubmitSuccess={() => handleSubmitSuccess("checkpoint")}
            />
          ) : screen === "knownissues" ? (
            <KnownIssuesCatalog engineer={user.name} />
          ) : screen === "projectboard" ? (
            <ProjectBoard engineer={user.name} />
          ) : screen === "admin" ? (
            <AdminPortal />
          ) : null}
        </div>
      </main>
    </div>
  );
}
