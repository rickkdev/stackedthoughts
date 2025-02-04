import { CheckSquare, Activity } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ItemCard({ item, onUpdate }) {
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");
  const itemText =
    item.title || item.text || item.task || item.description || item.activity;

  const isTask = item.task || item.text;

  // Determine which table to use based on the item type
  const getTableName = () => {
    // If item has 'task' or 'text' property, it's a todo
    if (item.task || item.text) {
      return "todos";
    }
    // Otherwise it's a dopamine log
    return "dopamine_logs";
  };

  const handleTimeUpdate = async (newDate) => {
    try {
      setIsUpdating(true);
      // Format the date to exactly match the current format
      const dateToUpdate = new Date(newDate)
        .toISOString()
        .slice(0, -1) // Remove the Z at the end
        .concat("+00:00"); // Add the timezone in the correct format

      const tableName = getTableName();

      const { error } = await supabase
        .from(tableName)
        .update({ created_at: dateToUpdate })
        .eq("id", item.id)
        .select();

      if (error) throw error;

      if (onUpdate) onUpdate();
      setIsTimeModalOpen(false);
    } catch (error) {
      alert(`Failed to update time: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 rounded-sm shadow hover:shadow-md transition-shadow border border-zinc-800 w-[600px]">
      <div className="flex items-start gap-3">
        {isTask ? (
          <CheckSquare className="w-5 h-5 text-green-500 mt-1" />
        ) : (
          <Activity className="w-5 h-5 text-coral mt-1" />
        )}
        <div className="flex-1">
          <p className="text-white">{highlightHashtags(itemText)}</p>
          <span
            className="text-zinc-400 text-sm cursor-pointer hover:text-zinc-300"
            onClick={() => setIsTimeModalOpen(true)}
          >
            {new Date(item.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-xl">
            <h3 className="text-white mb-4">Edit Time</h3>
            <input
              type="datetime-local"
              className="bg-zinc-800 text-white p-2 rounded mb-4"
              defaultValue={new Date(item.created_at)
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => {
                // Just store the value, don't update yet
                setNewDateTime(e.target.value);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                onClick={() => setIsTimeModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                onClick={() => handleTimeUpdate(newDateTime)}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function highlightHashtags(text) {
  const hashtagRegex = /(#[\w]+)/g;
  return text.split(hashtagRegex).map((part, index) =>
    part.startsWith("#") ? (
      <span
        key={index}
        className="bg-white rounded-sm px-1"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.4)", color: "black" }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}
