// components/LoginScreen.js

import React, { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [engineer, setEngineer] = useState("");
  const [date, setDate] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!engineer || !date) {
      setError("Please select both engineer and date.");
      return;
    }

    if (password !== "HotFix991!") {
      setError("Incorrect password. Please try again.");
      return;
    }

    localStorage.setItem("engineerName", engineer);
    localStorage.setItem("checkDate", date);
    onLogin(engineer, date);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Panoptics Infrastructure Checks
      </h1>

      <div className="w-full max-w-xs space-y-4">
        <div>
          <label className="block font-medium mb-1">Engineer</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={engineer}
            onChange={(e) => setEngineer(e.target.value)}
          >
            <option value="">Select engineer</option>
            <option value="Jose Lucar">Jose Lucar</option>
            <option value="Alex Field">Alex Field</option>
            <option value="Mihir Sangani">Mihir Sangani</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}
