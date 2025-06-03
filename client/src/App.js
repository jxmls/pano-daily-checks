import React, { useState } from "react";
import LoginScreen from './components/LoginScreen';
import Dashboard from "./components/Dashboard";
import SolarWindsForm from './components/SolarWindsForm';
import VSANForm from './components/VSANForm'; // ✅ make sure the filename matches exactly (case-sensitive)

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [screen, setScreen] = useState("splash");
  const [userData, setUserData] = useState({});

  const handleLogin = (engineer, date) => {
    setUserData({ engineer, date });
    setAuthenticated(true);
    setScreen("dashboard");
  };

  const handleSelectModule = (module) => {
    if (module === "solarwinds") {
      setScreen("solarwinds");
    } else if (module === "vsan") {
      setScreen("vsan"); // ✅ this was missing
    }
    // Add more module routes as needed
  };

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "dashboard") {
    return (
      <Dashboard
        onSelectModule={handleSelectModule}
        onSignOut={() => {
          setAuthenticated(false);
          setUserData({});
          setScreen("splash");
        }}
      />
    );
  }

  if (screen === "solarwinds") {
    return (
      <SolarWindsForm
        engineer={userData.engineer}
        date={userData.date}
        onBackToDashboard={() => setScreen("dashboard")}
      />
    );
  }

  if (screen === "vsan") {
    return (
      <VSANForm
        engineer={userData.engineer}
        date={userData.date}
        onBackToDashboard={() => setScreen("dashboard")}
      />
    );
  }

  return null;
}

export default App;
