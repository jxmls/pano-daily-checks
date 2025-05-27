import React, { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [date, setDate] = useState("");
  const [engineer, setEngineer] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "HotFix991!" && date && engineer) {
      onLogin({ date, engineer });
    } else {
      alert("Invalid credentials or missing fields.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <img src="/panologo.png" alt="Panoptics Logo" className="h-24 mb-6" />
      <h1 className="text-3xl font-bold mb-6 text-center">Panoptics Infrastructure Checks</h1>
      <form className="space-y-4 w-full max-w-sm" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium mb-1">Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Engineer</label>
          <select className="w-full border rounded px-3 py-2" value={engineer} onChange={(e) => setEngineer(e.target.value)}>
            <option value="">Select engineer</option>
            <option value="Jose Lucar">Jose Lucar</option>
            <option value="Alex Field">Alex Field</option>
            <option value="Mihir Sangani">Mihir Sangani</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
}
