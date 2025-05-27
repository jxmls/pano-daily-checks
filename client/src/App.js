import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import MultiStepForm from "./components/MultiStepForm";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [screen, setScreen] = useState("login");

  const handleLogin = (userData) => {
    setAuthenticated(true);
    setScreen("dashboard");
    console.log("Logged in:", userData);
  };

  const handleSelectModule = (module) => {
    if (module === "solarwinds") {
      setScreen("solarwinds");
    }
  };

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "dashboard") {
    return <Dashboard onSelectModule={handleSelectModule} />;
  }

  if (screen === "solarwinds") {
    return <MultiStepForm />;
  }

  return null;
}

export default App;
