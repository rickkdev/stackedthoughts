"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

export default function DopamineLogging() {
  const [activity, setActivity] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [impactScores, setImpactScores] = useState({});
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newScore, setNewScore] = useState("");
  const [categories, setCategories] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchLogs();
    fetchImpactScores();
  }, []);

  async function fetchLogs() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("dopamine_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchImpactScores() {
    try {
      const { data, error } = await supabase
        .from("dopamine_impact_scores")
        .select("*");

      if (error) throw error;

      const scoresMap = {};
      const categoryList = [];
      data.forEach((score) => {
        scoresMap[score.category] = score.impact_score;
        categoryList.push(score.category);
      });
      setImpactScores(scoresMap);
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching impact scores:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activity.trim()) return;

    const hashtags = activity.match(/#[\w]+/g) || [];
    const cleanedTags = hashtags.map((tag) => tag.slice(1).toLowerCase());

    // Check if any new categories need scores
    const newCategories = cleanedTags.filter(
      (tag) => !impactScores.hasOwnProperty(tag)
    );
    if (newCategories.length > 0) {
      setNewCategory(newCategories[0]);
      setShowScoreModal(true);
      return;
    }

    await saveActivity(cleanedTags);
  }

  async function saveActivity(categories) {
    try {
      const { error } = await supabase.from("dopamine_logs").insert([
        {
          activity: activity,
          categories: categories,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setActivity("");
      fetchLogs();
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  async function handleScoreSubmit() {
    try {
      const { error } = await supabase.from("dopamine_impact_scores").insert([
        {
          category: newCategory,
          impact_score: newScore,
        },
      ]);

      if (error) throw error;

      await fetchImpactScores();
      setShowScoreModal(false);

      // After saving the score, proceed with saving the activity
      const hashtags = activity.match(/#[\w]+/g) || [];
      const cleanedTags = hashtags.map((tag) => tag.slice(1).toLowerCase());
      await saveActivity(cleanedTags);
    } catch (error) {
      console.error("Error saving impact score:", error);
    }
  }

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredLogs = logs.filter(
    (log) =>
      selectedCategories.length === 0 ||
      log.categories.some((cat) => selectedCategories.includes(cat))
  );

  function CategoryLabels() {
    return (
      <div className="w-[30rem] overflow-hidden">
        <div
          className="overflow-x-auto mb-4 pb-2 
          scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900"
        >
          <div className="flex gap-2 w-fit">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-2 py-1 rounded-sm text-sm flex-shrink-0 ${
                  selectedCategories.includes(category)
                    ? "bg-coral text-black"
                    : "border border-zinc-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border border-zinc-800 rounded-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Dopamine Log</h1>

      {/* Category filters */}
      <CategoryLabels />

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="What dopamine-triggering activity did you do? (use #hashtags)"
            className="flex-1 p-2 border border-zinc-800 rounded-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-coral text-black rounded-sm border border-zinc-800 hover:bg-opacity-90"
          >
            Log Activity
          </button>
        </div>
      </form>

      {/* Activity logs */}
      <div
        className="space-y-4 max-h-[600px] overflow-y-auto rounded-sm pr-4 
        scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
      >
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-sm shadow hover:shadow-md transition-shadow border border-zinc-800 w-[450px] text-black"
            >
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-coral mt-1" />
                <div className="flex-1">
                  <p className="text-zinc-800">
                    {log.activity.split(/(#[^\s]+)/).map((part, index) =>
                      part.startsWith("#") ? (
                        <span
                          key={index}
                          className="bg-zinc-200 text-black rounded-sm px-1.5 py-0.5"
                        >
                          {part}
                        </span>
                      ) : (
                        <span key={index}>{part}</span>
                      )
                    )}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-zinc-400">
                      {isClient &&
                        formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-sm border border-zinc-800 w-[400px]">
            <h2 className="text-xl font-bold mb-4">
              Set Impact Score for #{newCategory}
            </h2>
            <p className="mb-4">
              How would you rate the dopamine impact of this activity? (0-10)
            </p>
            <input
              type="number"
              min="0"
              max="10"
              value={newScore}
              onChange={(e) => setNewScore(Number(e.target.value))}
              className="w-full p-2 border border-zinc-800 rounded-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 border border-zinc-800 rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleScoreSubmit}
                className="px-4 py-2 bg-coral text-black rounded-sm border border-zinc-800"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
