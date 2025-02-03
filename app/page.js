"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import CompletedTodoList from "./components/CompletedTodoList";
import CategoryDistribution from "./components/CategoryDistribution";
import DailyOverview from "./components/DailyOverview";
import CreateTodo from "./components/CreateTodo";
import DopamineLogging from "./components/DopamineLogging";
import Feed from "./components/Feed";
export default function Home() {
  const [todos, setTodos] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  // Extract unique categories from todos
  useEffect(() => {
    const categories = new Set();
    todos.forEach((todo) => {
      todo.categories.forEach((category) => categories.add(category));
    });
    setAllCategories(Array.from(categories));
  }, [todos]);

  async function fetchTodos() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("todos").select("*");
      if (error) {
        console.error("Error fetching todos:", error);
        return;
      }
      console.log("Raw response:", { data, error });
      setTodos(data || []);
    } catch (e) {
      console.error("Exception caught:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="fixed flex justify-center items-center inset-0 bg-customGray">
      {isLoading ? (
        <div className="w-full flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <div className="flex flex-row p-6 space-x-6">
            <Feed todos={todos} />
          </div>

          {/* Right side - Analytics */}
          <div className="p-6 pt-12">
            {/*      <CategoryDistribution /> */}
            {/*  <DailyOverview todos={todos} /> */}
          </div>
        </div>
      )}
    </div>
  );
}
