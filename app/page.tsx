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

const DEFAULT_SCREEN: Screen = "dashboard";

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [screen, setScreen] = useState<Screen>(DEFAULT_SCREEN);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const handleLogin = (name: string, checkDate: string) => {
    setUser({ name, checkDate });
    setScreen(DEFAULT_SCREEN);
  };

  const handleSignOut = () => {
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

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
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
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>Project Board — coming soon</p>
            </div>
          ) : screen === "admin" ? (
            <AdminPortal />
          ) : null}
        </div>
      </main>
    </div>
  );
}
