// src/components/FloatingSettingsButton.jsx
import React, { useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import SettingsModal from "./SettingsModal";

export default function FloatingSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 rounded-full shadow-md bg-white/90 hover:bg-white p-2 border"
        title="Settings"
      >
        <Cog6ToothIcon className="h-6 w-6 text-gray-700" />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
