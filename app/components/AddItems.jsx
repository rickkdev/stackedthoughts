"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

export default function AddItems({ onItemAdded }) {
  const [text, setText] = useState("");
  const [textareaHeight, setTextareaHeight] = useState("77px");
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newScore, setNewScore] = useState("");
  const [impactScores, setImpactScores] = useState({});

  // Fetch impact scores on component mount
  useEffect(() => {
    fetchImpactScores();
  }, []);

  // Add this effect to handle textarea height
  useEffect(() => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "77px"; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
      setTextareaHeight(`${scrollHeight}px`);
    }
  }, [text]);

  async function fetchImpactScores() {
    try {
      const { data, error } = await supabase
        .from("dopamine_impact_scores")
        .select("*");

      if (error) throw error;

      const scoresMap = {};
      data.forEach((score) => {
        scoresMap[score.category] = score.impact_score;
      });
      setImpactScores(scoresMap);
    } catch (error) {
      console.error("Error fetching impact scores:", error);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Extract content without the command
    const command = text.split(" ")[0];
    const content = text.slice(command.length).trim();

    if (!content) return;

    // Extract hashtags
    const hashtags = content.match(/#[\w-]+/g) || [];
    const categories = hashtags.map((tag) => tag.slice(1));

    try {
      if (command === "/task") {
        await handleTaskSubmit(content, categories);
      } else if (command === "/dopamine") {
        // Check for new categories first
        const newCategories = categories.filter(
          (tag) => !impactScores.hasOwnProperty(tag)
        );
        if (newCategories.length > 0) {
          setNewCategory(newCategories[0]);
          setShowScoreModal(true);
          return;
        }
        await handleDopamineSubmit(content, categories);
      }
    } catch (error) {
      console.error("Error submitting item:", error);
    }
  };

  const handleTaskSubmit = async (content, categories) => {
    const { error } = await supabase.from("todos").insert([
      {
        text: content,
        categories,
        is_completed: false,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    setText("");
    onItemAdded();
  };

  const handleDopamineSubmit = async (content, categories) => {
    const { error } = await supabase.from("dopamine_logs").insert([
      {
        activity: content,
        categories,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    setText("");
    onItemAdded();
  };

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

      // Continue with the dopamine log submission
      const content = text.slice("/dopamine".length).trim();
      const hashtags = content.match(/#[\w-]+/g) || [];
      const categories = hashtags.map((tag) => tag.slice(1));
      await handleDopamineSubmit(content, categories);
    } catch (error) {
      console.error("Error saving impact score:", error);
    }
  }

  const isValidCommand =
    text.startsWith("/task") || text.startsWith("/dopamine");

  const renderTextWithHighlight = () => {
    const taskMatch = text.match(/^(\/task\s?)/);
    const dopamineMatch = text.match(/^(\/dopamine\s?)/);

    if (taskMatch) {
      return (
        <>
          <span className="bg-zinc-900 rounded-sm text-zinc-400">
            {taskMatch[1]}
          </span>
          {text.slice(taskMatch[1].length)}
        </>
      );
    } else if (dopamineMatch) {
      return (
        <>
          <span className="bg-zinc-900 rounded-sm text-zinc-400">
            {dopamineMatch[1]}
          </span>
          {text.slice(dopamineMatch[1].length)}
        </>
      );
    }
    return text;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col border border-zinc-800 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isValidCommand) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Start with /task or /dopamine..."
            className="w-full py-3 px-3 rounded-sm bg-transparent text-transparent placeholder-transparent leading-relaxed resize-none z-10 absolute inset-0 caret-white outline-none focus:outline-none"
            data-tooltip-id="command-tooltip"
            data-tooltip-content="Start typing /task or /dopamine"
            data-tooltip-variant="dark"
            style={{ height: textareaHeight }}
          />
          <div
            className="w-full py-3 px-3 rounded-sm bg-customGray text-white placeholder-zinc-500 leading-relaxed whitespace-pre-wrap pointer-events-none"
            style={{ minHeight: "77px", height: textareaHeight }}
          >
            {text ? (
              renderTextWithHighlight()
            ) : (
              <span className="text-zinc-500">
                Start with /task or /dopamine...
              </span>
            )}
          </div>
          <div className="flex justify-end p-2">
            <button
              type="submit"
              disabled={!isValidCommand}
              className={`px-4 py-2 m-2 rounded-full ${
                !isValidCommand
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : text.startsWith("/task")
                  ? "bg-customGreen bg-opacity-70 text-zinc-900 hover:bg-opacity-90"
                  : "bg-coral text-black hover:bg-opacity-90"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
        <Tooltip
          id="command-tooltip"
          place="top"
          isOpen={!isValidCommand && text.length > 0}
        />
      </form>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-customGray p-6 rounded-sm border border-zinc-800 w-[400px]">
            <h2 className="text-xl font-bold mb-4 text-white">
              Set Impact Score for #{newCategory}
            </h2>
            <p className="mb-4 text-zinc-300">
              How would you rate the dopamine impact of this activity? (0-10)
            </p>
            <input
              type="number"
              min="0"
              max="10"
              value={newScore}
              onChange={(e) => setNewScore(Number(e.target.value))}
              className="w-full p-2 border border-zinc-800 rounded-sm mb-4 bg-customGray text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 border border-zinc-800 rounded-sm text-white"
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
    </>
  );
}
