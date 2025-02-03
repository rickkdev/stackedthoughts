import { CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CompletedTodoList({
  todos,
  allCategories,
  selectedCategories,
  toggleCategory,
}) {
  const filteredTodos = todos
    .filter(
      (todo) =>
        selectedCategories.length === 0 ||
        todo.categories.some((cat) => selectedCategories.includes(cat))
    )
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  return (
    <div className="p-6 border border-zinc-800 rounded-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Completed tasks</h1>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2 pb-4 border-b border-zinc-800">
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors
              ${
                selectedCategories.includes(category)
                  ? "border border-sm border-zinc-800 bg-coral text-black rounded-sm"
                  : "border border-sm  border-zinc-800 hover:bg-zinc-100 hover:bg-opacity-30 rounded-sm"
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Todos list */}
      <div
        className="space-y-4 max-h-[600px] overflow-y-auto rounded-sm -mt-2 pr-4 
        scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
      >
        {filteredTodos.map((todo) => (
          <div
            key={todo.id}
            className="p-4 rounded-sm shadow hover:shadow-md transition-shadow border border-zinc-800 w-[450px] text-black"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              <div className="flex-1">
                <p className="text-zinc-800">
                  {todo.text.split(/(#[^\s]+)/).map((part, index) =>
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
                    {formatDistanceToNow(new Date(todo.completed_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
