"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { CheckSquare, Activity } from "lucide-react";
import AddItems from "./AddItems";
import ItemCard from "./ItemCard";

// Helper function to ensure consistent date formatting between server and client
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

export default function Feed({ initialItems }) {
  // Process the server-provided items to include formatted dates
  // This ensures consistent date display between server and client
  const processedInitialItems = initialItems.map((item) => ({
    ...item,
    created_at: item.created_at,
    formattedDate: formatDate(item.created_at),
  }));

  // Initialize state with the processed server data
  const [items, setItems] = useState(processedInitialItems);
  const [showTasks, setShowTasks] = useState(true);
  const [showDopamine, setShowDopamine] = useState(true);
  const [activeHashtags, setActiveHashtags] = useState(new Set());

  // This function is only called when we need to refresh data
  // (after adding/updating items)
  async function refreshItems() {
    const { data: todos = [] } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: logs = [] } = await supabase
      .from("dopamine_logs")
      .select("*")
      .order("created_at", { ascending: false });

    const combinedItems = [...todos, ...logs]
      .filter((item) => item && item.created_at)
      .map((item) => ({
        ...item,
        created_at: item.created_at,
        formattedDate: formatDate(item.created_at),
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setItems(combinedItems);
  }

  // Extract unique hashtags from all items
  const uniqueHashtags = [
    ...new Set(
      items
        .map((item) => {
          const text =
            item.title ||
            item.text ||
            item.task ||
            item.description ||
            item.activity;
          const matches = text.match(/#[\w]+/g);
          return matches || [];
        })
        .flat()
    ),
  ];

  // Update filtered items to include hashtag filtering
  const filteredItems = items.filter((item) => {
    // Type filter (tasks/dopamine)
    const typeFilter = item.task || item.text ? showTasks : showDopamine;

    // Hashtag filter
    if (activeHashtags.size === 0) return typeFilter;

    const text =
      item.title || item.text || item.task || item.description || item.activity;
    const itemHashtags = text.match(/#[\w]+/g) || [];
    return typeFilter && itemHashtags.some((tag) => activeHashtags.has(tag));
  });

  // Toggle hashtag filter
  const toggleHashtag = (hashtag) => {
    setActiveHashtags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hashtag)) {
        newSet.delete(hashtag);
      } else {
        newSet.add(hashtag);
      }
      return newSet;
    });
  };

  const handleItemAdded = () => {
    refreshItems();
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-2xl mx-auto mt-4 overflow-y-auto pt-2">
        <div className="flex gap-3 mb-6 w-full">
          <button
            onClick={() => setShowTasks(!showTasks)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
              showTasks
                ? "border-customGreen border-opacity-70 text-white"
                : "border-zinc-800 text-zinc-500 hover:border-green-500/30 hover:text-zinc-300"
            }`}
          >
            <CheckSquare className="w-4 h-4 text-green-500/90" />
            <span className="text-sm">Tasks</span>
          </button>
          <button
            onClick={() => setShowDopamine(!showDopamine)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
              showDopamine
                ? "border-coral/50 text-white"
                : "border-zinc-800 text-zinc-500 hover:border-coral/30 hover:text-zinc-300"
            }`}
          >
            <Activity className="w-4 h-4 text-coral/70" />
            <span className="text-sm">Dopamine</span>
          </button>
        </div>

        <AddItems onItemAdded={handleItemAdded} />

        <div className="space-y-4">
          {uniqueHashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 w-[37rem]">
              {uniqueHashtags.map((hashtag) => (
                <button
                  key={hashtag}
                  onClick={() => toggleHashtag(hashtag)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeHashtags.has(hashtag)
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-900/50 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
          )}

          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={refreshItems} />
          ))}
        </div>
      </div>
    </div>
  );
}
