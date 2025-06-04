// Header.js
import React from "react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <div className="bg-black w-full py-4 px-6 flex items-center justify-between">
      <img src="/panologo.png" alt="Panoptics logo" className="h-12" />
      <Button className="bg-white text-black hover:bg-gray-200 text-sm px-4 py-2 rounded">
        Dashboard
      </Button>
    </div>
  );
}
