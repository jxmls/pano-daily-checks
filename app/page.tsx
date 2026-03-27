"use client";

import { useState } from "react";
import type { Screen, SessionUser } from "@/types";
import LoginScreen from "@/components/LoginScreen";
import Header from "@/components/Header";
import SolarWindsForm from "@/components/forms/SolarWindsForm";
import VeeamForm from "@/components/forms/VeeamForm";
import VmwareForm from "@/components/forms/VmwareForm";
import CheckpointForm from "@/components/forms/CheckpointForm";
import KnownIssuesCatalog from "@/components/KnownIssuesCatalog";
import AdminPortal from "@/components/admin/AdminPortal";
import SettingsButton from "@/components/SettingsButton";

const DEFAULT_SCREEN: Screen = "solarwinds";

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [screen, setScreen] = useState<Screen>(DEFAULT_SCREEN);

  const handleLogin = (name: string, checkDate: string) => {
    setUser({ name, checkDate });
    setScreen(DEFAULT_SCREEN);
  };

  const handleSignOut = () => {
    setUser(null);
    setScreen(DEFAULT_SCREEN);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={user}
        screen={screen}
        onSelectScreen={setScreen}
        onSignOut={user ? handleSignOut : undefined}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : screen === "solarwinds" ? (
          <SolarWindsForm engineer={user.name} date={user.checkDate} />
        ) : screen === "vsan" ? (
          <VmwareForm engineer={user.name} date={user.checkDate} />
        ) : screen === "veeam" ? (
          <VeeamForm engineer={user.name} date={user.checkDate} />
        ) : screen === "checkpoint" ? (
          <CheckpointForm engineer={user.name} date={user.checkDate} />
        ) : screen === "knownissues" ? (
          <KnownIssuesCatalog />
        ) : screen === "admin" ? (
          <AdminPortal />
        ) : null}
      </main>

      {user && <SettingsButton />}
    </div>
  );
}
