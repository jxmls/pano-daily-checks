// Header.js
import React from "react";

export default function Header() {
  return (
    <div className="bg-black w-full flex items-center justify-between px-6 py-4">
      <img src="/panologo.png" alt="Panoptics logo" className="h-12" />
      <a href="/" className="text-white text-sm border border-white rounded px-3 py-1 hover:bg-white hover:text-black transition">
        Home
      </a>
    </div>
  );
}
