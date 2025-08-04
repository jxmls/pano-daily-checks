// src/components/projectboard/ProjectBoard.js
import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
const initialData = {
  "To Do": ["Task 1", "Task 2"],
  "In Progress": ["Task 3"],
  "Done": ["Task 4"],
};

export default function ProjectBoard() {
  const [columns, setColumns] = useState(initialData);

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    const sourceItems = [...columns[sourceColumn]];
    const destItems = [...columns[destColumn]];

    // Move within same column
    if (sourceColumn === destColumn) {
      const [movedItem] = sourceItems.splice(source.index, 1);
      sourceItems.splice(destination.index, 0, movedItem);
      setColumns({ ...columns, [sourceColumn]: sourceItems });
    } else {
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);
      setColumns({
        ...columns,
        [sourceColumn]: sourceItems,
        [destColumn]: destItems,
      });
    }
  };

  const handleAddTask = (columnName) => {
    const newTask = prompt("Enter task name:");
    if (newTask) {
      setColumns({
        ...columns,
        [columnName]: [...columns[columnName], newTask],
      });
    }
  };

  return (
    <div className="flex space-x-4 p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(columns).map(([columnName, tasks], index) => (
          <Droppable droppableId={columnName} key={columnName}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-1/3 bg-gray-100 rounded p-3 shadow-md"
              >
                <h3 className="font-bold text-white bg-blue-600 px-3 py-2 rounded mb-3">
                  {columnName}
                </h3>
                {tasks.map((task, idx) => (
                  <Draggable key={task} draggableId={task} index={idx}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-2 mb-2 rounded shadow text-sm"
                      >
                        {task}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <button
                  onClick={() => handleAddTask(columnName)}
                  className="text-blue-700 text-sm mt-2"
                >
                  + Add
                </button>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
