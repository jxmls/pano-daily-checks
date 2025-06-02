import React, { useState } from "react";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./components/Dashboard";
import MultiStepForm from "./components/MultiStepForm";

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
    }
  };

  if (!authenticated) {
    return <SplashScreen onLogin={handleLogin} />;
  }

  if (screen === "dashboard") {
    return <Dashboard onSelectModule={handleSelectModule} />;
  }

  if (screen === "solarwinds") {
    return <MultiStepForm engineer={userData.engineer} date={userData.date} />;
  }

  return null;
}

export default App;
