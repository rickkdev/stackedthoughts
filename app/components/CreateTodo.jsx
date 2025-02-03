"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CreateTodo({ onTodoCreated }) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) {
      setIsOpen(false); // Close the modal if text is empty
      setText(""); // Clear the input
      return;
    }

    try {
      // Extract hashtags from text
      const hashtags = trimmedText.match(/#[\w-]+/g) || [];
      const categories = hashtags.map((tag) => tag.slice(1)); // Remove # symbol

      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            text: trimmedText,
            categories,
            is_completed: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Detailed error:", error);
        throw error;
      }

      console.log("Successfully created todo:", data);
      setText("");
      onTodoCreated();
    } catch (error) {
      console.error("Error creating todo:", error.message);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 border-dashed border border-zinc-400 text-black p-4 rounded-full shadow-lg hover:bg-coral hover:text-white transition-colors z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-[44rem] bg-customGray rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-700">
              <h3 className="text-gray-900 font-semibold">Add new task</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-gray-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter new todo (use #hashtags for categories)"
                className="w-full p-2 rounded bg-customGray text-gray-900 border border-gray-900 focus:outline-none focus:border-gray-900"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="w-full bg-customGray border-dashed border border-zinc-400 text-gray-900 p-2 rounded hover:bg-coral flex items-center justify-center gap-2"
              >
                Add task
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
