"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { CheckSquare, Activity } from "lucide-react";
import AddItems from "./AddItems";
import ItemCard from "./ItemCard";

export default function Feed() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showDopamine, setShowDopamine] = useState(true);
  const [activeHashtags, setActiveHashtags] = useState(new Set());

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setIsLoading(true);

      // Fetch todos
      const { data: todos, error: todosError } = await supabase
        .from("todos")
        .select("*");

      if (todosError) throw todosError;

      // Log todos to inspect structure
      console.log("Todos data:", todos);

      // Fetch dopamine logs
      const { data: logs, error: logsError } = await supabase
        .from("dopamine_logs")
        .select("*");

      if (logsError) throw logsError;

      // Log logs to inspect structure
      console.log("Dopamine logs data:", logs);

      // Combine and sort by created_at
      const combinedItems = [...todos, ...logs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setItems(combinedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
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
    fetchItems();
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-2xl mx-auto mt-4 overflow-y-auto pt-2">
        <div className="flex gap-3 mb-6">
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

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {uniqueHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
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
              <ItemCard key={item.id} item={item} onUpdate={fetchItems} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
