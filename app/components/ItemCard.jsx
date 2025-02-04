import { CheckSquare, Activity } from "lucide-react";

export default function ItemCard({ item }) {
  const itemText =
    item.title || item.text || item.task || item.description || item.activity;

  const isTask = item.task || item.text;

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
          <span className="text-zinc-400 text-sm">
            {new Date(item.created_at).toLocaleString()}
          </span>
        </div>
      </div>
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
