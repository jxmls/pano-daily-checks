import React from "react";
import TaskCard from "./TaskCard";

export default function BoardSection({ id, title, tasks }) {
  return (
    <div className="bg-white rounded shadow-md w-64 flex-shrink-0">
      <h3 className="bg-blue-600 text-white text-sm font-bold px-3 py-2 rounded-t">
        {title}
      </h3>
      <div className="p-2 space-y-2 min-h-[100px]">
        {tasks.map((task, idx) => (
          <TaskCard key={idx} title={task} />
        ))}
        <button className="text-blue-600 text-sm mt-2 hover:underline">+ Add</button>
      </div>
    </div>
  );
}
