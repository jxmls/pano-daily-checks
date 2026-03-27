"use client";

import { useState } from "react";
import { Cog6ToothIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Settings {
  to: string;
  cc: string;
  bcc: string;
  password: string;
}

const KEYS = {
  to:       "checklist.to",
  cc:       "checklist.cc",
  bcc:      "checklist.bcc",
  password: "checklist.password",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return { to: "", cc: "", bcc: "", password: "" };
  return {
    to:       localStorage.getItem(KEYS.to) ?? "",
    cc:       localStorage.getItem(KEYS.cc) ?? "",
    bcc:      localStorage.getItem(KEYS.bcc) ?? "",
    password: localStorage.getItem(KEYS.password) ?? "",
  };
}

function saveSettings(s: Settings) {
  Object.entries(KEYS).forEach(([k, lsKey]) => localStorage.setItem(lsKey, s[k as keyof Settings]));
}

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-white shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition"
        title="Settings"
      >
        <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Email recipients</h3>
              {(["to", "cc", "bcc"] as const).map((f) => (
                <div key={f}>
                  <label className="label uppercase text-xs">{f}</label>
                  <input className="input" type="email" value={settings[f]}
                    onChange={(e) => setSettings((p) => ({ ...p, [f]: e.target.value }))}
                    placeholder={f === "to" ? "checklist@company.com" : "optional"} />
                </div>
              ))}

              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1 mt-2">Auth</h3>
              <div>
                <label className="label">Override local password</label>
                <input className="input" type="password" value={settings.password}
                  onChange={(e) => setSettings((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Leave blank to use env default" />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={handleSave} className="btn-primary flex-1">
                {saved ? "✓ Saved" : "Save settings"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
