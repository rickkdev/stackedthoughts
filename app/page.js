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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC.PW) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
    } else {
      alert("Incorrect password");
    }
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed flex justify-center items-center inset-0 bg-customGray">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-md"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="border p-2 rounded mb-4 w-full"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed flex justify-center items-center inset-0 bg-customGray">
      {isLoading ? (
        <div className="w-full flex items-center justify-center">
          <p className="text-white">Loading..</p>
        </div>
      ) : (
        <div className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-row justify-center p-6 space-x-6">
              <Feed todos={todos} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
