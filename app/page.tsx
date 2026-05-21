"use client";

import { useState, useEffect } from "react";
import type { Screen, SessionUser, Submission } from "@/types";
import LoginScreen from "@/components/LoginScreen";
import Sidebar from "@/components/Sidebar";
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
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        screen={screen}
        onSelectScreen={setScreen}
        onSignOut={handleSignOut}
        completedToday={completedToday}
      />
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", overflowY: "auto" }}>
        <div className="max-w-5xl mx-auto px-6 py-8 pb-32">
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
          ) : screen === "admin" ? (
            <AdminPortal />
          ) : null}
        </div>
      </main>
    </div>
  );
}
