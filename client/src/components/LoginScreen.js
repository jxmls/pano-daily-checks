import React, { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [engineer, setEngineer] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

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
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${require("../assets/background.jpg")})`,
      }}
    >
      {/* Overlay for enhanced contrast */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Login box */}
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 relative z-10">
        <div className="flex justify-center mb-6">
          <img
            src="/panologo.png"
            alt="Panoptics Logo"
            className="h-12 object-contain"
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engineer
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
