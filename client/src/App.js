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
// Future: Add additional routing modules here
};

const handleBackToDashboard = () => {
setScreen("dashboard");
};

if (!authenticated) {
return <LoginScreen onLogin={handleLogin} />;
}

switch (screen) {
case "dashboard":
return <Dashboard onSelectModule={handleSelectModule} />;
case "solarwinds":
return <MultiStepForm onBack={handleBackToDashboard} />;
default:
return <Dashboard onSelectModule={handleSelectModule} />;
}
}