import React from "react";

export default function TaskCard({ title }) {
  return (
    <div className="bg-gray-100 rounded p-2 text-sm shadow hover:bg-gray-200 transition cursor-pointer">
      {title}
    </div>
  );
}
