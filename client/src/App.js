import React, { useState } from "react";
import LoginScreen from './components/LoginScreen';
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
  return (
    <MultiStepForm
      engineer={userData.engineer}
      date={userData.date}
      onBackToDashboard={() => setScreen("dashboard")}
    />
  );
}


  return null;

export default App;
