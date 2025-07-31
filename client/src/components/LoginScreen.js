import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginScreen({ onLogin }) {
  const [engineer, setEngineer] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (!engineer || !date) {
        setError("Please select both engineer and date.");
        setLoading(false);
        return;
      }

      if (password !== "HotFix991!") {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("engineerName", engineer);
      localStorage.setItem("checkDate", date);
      onLogin(engineer, date);
    }, 300); // Simulate loading delay
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${require("../assets/background.jpg")})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Login Box */}
      <div className="backdrop-blur-md bg-white/90 w-full max-w-sm sm:max-w-md rounded-xl shadow-xl p-6 relative z-10">
        <div className="flex justify-center mb-4">
          <img
            src="/panologo.png"
            alt="Panoptics Logo"
            className="h-12 object-contain drop-shadow-md"
          />
        </div>

        <h2 className="text-lg font-semibold text-center text-gray-700 mb-4">
          Infrastructure Hub Login
        </h2>

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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
              autoFocus
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {capsLockOn && (
              <p className="text-yellow-600 text-sm text-center mt-1">
                ⚠️ Caps Lock is on
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
