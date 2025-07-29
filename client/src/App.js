import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import SolarWindsForm from "./components/SolarWindsForm";
import VmwareForm from "./components/VmwareForm";
import Header from "./components/Header";
import CheckpointForm from "./components/CheckpointForm";


export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [screen, setScreen] = useState("splash");
  const [userData, setUserData] = useState({});

  const handleLogin = (engineer, date) => {
    setUserData({ engineer, date });
    setAuthenticated(true);
    setScreen("dashboard");
  };

  const handleSelectModule = (module) => {
    setScreen(module);
  };

  return (
    <div className="min-h-screen bg-white text-black">

      <Header
        showHome={authenticated && screen !== "dashboard"}
        showSignOut={authenticated && screen === "dashboard"}
        onBackToDashboard={() => setScreen("dashboard")}
        onSignOut={() => {
          setAuthenticated(false);
          setUserData({});
          setScreen("splash");
        }}
        engineer={userData.engineer}
      />

      <div className="max-w-6xl mx-auto p-4">
        {!authenticated ? (
          <LoginScreen onLogin={handleLogin} />
        ) : screen === "dashboard" ? (
          <Dashboard onSelectModule={handleSelectModule} />
        ) : screen === "solarwinds" ? (
          <SolarWindsForm
            engineer={userData.engineer}
            date={userData.date}
            onBackToDashboard={() => setScreen("dashboard")}
          />
        ) : screen === "vsan" ? (
          <VmwareForm
            engineer={userData.engineer}
            date={userData.date}
            onBackToDashboard={() => setScreen("dashboard")}
          />
          ) : screen === "checkpoint" ? (
  <CheckpointForm
    engineer={userData.engineer}
    date={userData.date}
    onBackToDashboard={() => setScreen("dashboard")}
  />

        ) : null}
      </div>
    </div>
  );
}
